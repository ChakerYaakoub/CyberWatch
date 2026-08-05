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
	topo Topology
}

func NewRabbitPublisher(url string, topo Topology) (*RabbitPublisher, error) {
	if url == "" {
		return nil, fmt.Errorf("RABBITMQ_URL is empty")
	}
	if topo.Exchange == "" || topo.Queue == "" || topo.RoutingKey == "" {
		return nil, fmt.Errorf("rabbitmq topology is incomplete")
	}
	if topo.MaxAttempts < 1 {
		topo.MaxAttempts = 3
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("rabbitmq dial: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("rabbitmq channel: %w", err)
	}

	pub := &RabbitPublisher{conn: conn, ch: ch, topo: topo}
	if err := pub.declareTopology(); err != nil {
		_ = pub.Close()
		return nil, err
	}
	return pub, nil
}

func (p *RabbitPublisher) declareTopology() error {
	// Main exchange + DLX/queue. Broker x-dead-letter-exchange is declared for
	// compatibility; the worker uses app-level retry (ack + republish) / DLQ publish.
	if err := p.ch.ExchangeDeclare(p.topo.Exchange, ExchangeType, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare exchange: %w", err)
	}
	if err := p.ch.ExchangeDeclare(p.topo.DeadLetterExchange, ExchangeType, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dlx: %w", err)
	}

	if _, err := p.ch.QueueDeclare(p.topo.DeadLetterQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dead letter queue: %w", err)
	}
	if err := p.ch.QueueBind(p.topo.DeadLetterQueue, "#", p.topo.DeadLetterExchange, false, nil); err != nil {
		return fmt.Errorf("bind dead letter queue: %w", err)
	}

	args := amqp.Table{
		"x-dead-letter-exchange": p.topo.DeadLetterExchange,
	}
	if _, err := p.ch.QueueDeclare(p.topo.Queue, true, false, false, false, args); err != nil {
		return fmt.Errorf("declare scan queue: %w", err)
	}
	if err := p.ch.QueueBind(p.topo.Queue, p.topo.RoutingKey, p.topo.Exchange, false, nil); err != nil {
		return fmt.Errorf("bind scan queue: %w", err)
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
		p.topo.Exchange,
		p.topo.RoutingKey,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent, // survive broker restart
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
