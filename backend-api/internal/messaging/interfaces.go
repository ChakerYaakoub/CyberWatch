// Package messaging defines how the API dispatches async scan jobs to workers.
// Two implementations share ScanPublisher: HTTP (dev) and RabbitMQ (Compose default).
package messaging

import "time"

const (
	ScanJobVersion = 1
	ExchangeType   = "topic"
)

// Topology is loaded from environment (deploy-specific exchange/queue names).
// MaxAttempts is carried for documentation/config symmetry; the worker enforces retries.
type Topology struct {
	Exchange           string
	DeadLetterExchange string
	Queue              string
	DeadLetterQueue    string
	RoutingKey         string
	MaxAttempts        int
}

// ScanJob is the JSON message the worker consumes (HTTP body or RabbitMQ payload).
type ScanJob struct {
	Version     int       `json:"version"`
	ScanID      uint      `json:"scanId"`
	CompanyID   uint      `json:"companyId"`
	Domain      string    `json:"domain"`
	RequestedBy string    `json:"requestedBy"`
	CreatedAt   time.Time `json:"createdAt"`
	Attempt     int       `json:"attempt,omitempty"`
}

// ScanPublisher dispatches scan jobs. ScanService depends on this interface only.
type ScanPublisher interface {
	Publish(job ScanJob) error
	Close() error
}
