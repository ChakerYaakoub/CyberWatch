package messaging

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// RabbitPublisher publishes persistent scan jobs to RabbitMQ.
type RabbitPublisher struct {
	conn *amqp.Connection
	ch   *amqp.Channel
}

func NewRabbitPublisher(url string) (*RabbitPublisher, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("rabbitmq dial: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("rabbitmq channel: %w", err)
	}

	pub := &RabbitPublisher{conn: conn, ch: ch}
	if err := pub.declareTopology(); err != nil {
		_ = pub.Close()
		return nil, err
	}
	return pub, nil
}

func (p *RabbitPublisher) declareTopology() error {
	if err := p.ch.ExchangeDeclare(ExchangeName, ExchangeType, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare exchange: %w", err)
	}
	if err := p.ch.ExchangeDeclare(DeadLetterExchange, ExchangeType, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dlx: %w", err)
	}

	if _, err := p.ch.QueueDeclare(DeadLetterQueueName, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dead letter queue: %w", err)
	}
	if err := p.ch.QueueBind(DeadLetterQueueName, "#", DeadLetterExchange, false, nil); err != nil {
		return fmt.Errorf("bind dead letter queue: %w", err)
	}

	args := amqp.Table{
		"x-dead-letter-exchange": DeadLetterExchange,
	}
	if _, err := p.ch.QueueDeclare(QueueName, true, false, false, false, args); err != nil {
		return fmt.Errorf("declare scan_jobs: %w", err)
	}
	if err := p.ch.QueueBind(QueueName, RoutingKeyStart, ExchangeName, false, nil); err != nil {
		return fmt.Errorf("bind scan_jobs: %w", err)
	}
	return nil
}

func (p *RabbitPublisher) Publish(job ScanJob) error {
	if job.Version == 0 {
		job.Version = ScanJobVersion
	}
	if job.Attempt == 0 {
		job.Attempt = 1
	}

	body, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal scan job: %w", err)
	}

	err = p.ch.Publish(
		ExchangeName,
		RoutingKeyStart,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Timestamp:    time.Now().UTC(),
			Body:         body,
			Headers: amqp.Table{
				"x-attempt": job.Attempt,
			},
		},
	)
	if err != nil {
		return fmt.Errorf("publish scan job: %w", err)
	}

	log.Printf("scan job published via rabbitmq scanId=%d attempt=%d", job.ScanID, job.Attempt)
	return nil
}

func (p *RabbitPublisher) Close() error {
	var first error
	if p.ch != nil {
		if err := p.ch.Close(); err != nil && first == nil {
			first = err
		}
	}
	if p.conn != nil {
		if err := p.conn.Close(); err != nil && first == nil {
			first = err
		}
	}
	return first
}

// NoopPublisher is used in tests.
type NoopPublisher struct{}

func (NoopPublisher) Publish(ScanJob) error { return nil }
func (NoopPublisher) Close() error          { return nil }
