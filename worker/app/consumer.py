"""
RabbitMQ consumer for scan_jobs (Compose default entrypoint).

Reuses JobProcessor / ScanService — same path as POST /jobs.
Run: python -m app.consumer
"""

from __future__ import annotations

import json
import time

import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties

from app.config import get_settings, require_rabbitmq_url
from app.models.job import ScanJob
from app.services.job_processor import JobProcessor
from app.utils.logging_config import configure_logging, get_logger

logger = get_logger(__name__)


class ScanConsumer:
    """Long-running consumer: declare topology, process one message at a time, reconnect on failure."""

    def __init__(self) -> None:
        self.settings = get_settings()
        require_rabbitmq_url(self.settings)
        self.processor = JobProcessor(self.settings)
        self._connection: pika.BlockingConnection | None = None
        self._channel: BlockingChannel | None = None

    def connect(self) -> None:
        params = pika.URLParameters(self.settings.rabbitmq_url)
        params.heartbeat = 30
        params.blocked_connection_timeout = 30
        self._connection = pika.BlockingConnection(params)
        self._channel = self._connection.channel()
        self._declare_topology(self._channel)
        # One unacked job at a time — avoids overload and preserves order per consumer.
        self._channel.basic_qos(prefetch_count=1)
        logger.info("rabbitmq_connected", queue=self.settings.queue_name)

    def _declare_topology(self, channel: BlockingChannel) -> None:
        """Idempotent declare — must match Go RabbitPublisher topology."""
        channel.exchange_declare(
            exchange=self.settings.exchange_name,
            exchange_type="topic",
            durable=True,
        )
        channel.exchange_declare(
            exchange=self.settings.dead_letter_exchange,
            exchange_type="topic",
            durable=True,
        )
        channel.queue_declare(queue=self.settings.dead_letter_queue, durable=True)
        channel.queue_bind(
            queue=self.settings.dead_letter_queue,
            exchange=self.settings.dead_letter_exchange,
            routing_key="#",
        )
        channel.queue_declare(
            queue=self.settings.queue_name,
            durable=True,
            arguments={"x-dead-letter-exchange": self.settings.dead_letter_exchange},
        )
        channel.queue_bind(
            queue=self.settings.queue_name,
            exchange=self.settings.exchange_name,
            routing_key=self.settings.routing_key,
        )

    def _publish_retry(self, channel: BlockingChannel, job: ScanJob) -> None:
        """Requeue with attempt+1 (manual retry; message is acked then republished)."""
        job.attempt += 1
        channel.basic_publish(
            exchange=self.settings.exchange_name,
            routing_key=self.settings.routing_key,
            body=job.model_dump_json().encode("utf-8"),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,
                headers={"x-attempt": job.attempt},
            ),
        )
        logger.info("job_requeued", scan_id=job.scanId, attempt=job.attempt)

    def _publish_dead_letter(self, channel: BlockingChannel, body: bytes, reason: str) -> None:
        channel.basic_publish(
            exchange=self.settings.dead_letter_exchange,
            routing_key=self.settings.routing_key,
            body=body,
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,
                headers={"x-failure-reason": reason[:500]},
            ),
        )
        logger.error("job_dead_lettered", reason=reason)

    def on_message(
        self,
        channel: BlockingChannel,
        method: Basic.Deliver,
        properties: BasicProperties,
        body: bytes,
    ) -> None:
        """Always ack: poison → DLQ; failure → republish or DLQ (never broker nack)."""
        try:
            payload = json.loads(body.decode("utf-8"))
            job = ScanJob.model_validate(payload)
        except Exception as exc:  # noqa: BLE001
            logger.error("malformed_message", error=str(exc))
            self._publish_dead_letter(channel, body, f"malformed: {exc}")
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        headers = properties.headers or {}
        attempt = int(headers.get("x-attempt", job.attempt or 1))
        job.attempt = attempt

        try:
            self.processor.process(job)
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as exc:  # noqa: BLE001
            logger.exception("job_failed", scan_id=job.scanId, attempt=attempt, error=str(exc))
            if attempt < self.settings.max_attempts:
                self._publish_retry(channel, job)
                channel.basic_ack(delivery_tag=method.delivery_tag)
            else:
                self._publish_dead_letter(channel, body, str(exc))
                channel.basic_ack(delivery_tag=method.delivery_tag)

    def run_forever(self) -> None:
        configure_logging(self.settings.log_level)
        while True:
            try:
                self.connect()
                assert self._channel is not None
                self._channel.basic_consume(
                    queue=self.settings.queue_name,
                    on_message_callback=self.on_message,
                )
                logger.info("consumer_listening", queue=self.settings.queue_name)
                self._channel.start_consuming()
            except KeyboardInterrupt:
                logger.info("consumer_stopped")
                break
            except Exception as exc:  # noqa: BLE001
                logger.error("rabbitmq_connection_lost", error=str(exc))
                self._close_quietly()
                time.sleep(5)
                logger.info("rabbitmq_reconnecting")

    def _close_quietly(self) -> None:
        try:
            if self._channel and self._channel.is_open:
                self._channel.close()
        except Exception:  # noqa: BLE001
            pass
        try:
            if self._connection and self._connection.is_open:
                self._connection.close()
        except Exception:  # noqa: BLE001
            pass


def main() -> None:
    ScanConsumer().run_forever()


if __name__ == "__main__":
    main()
