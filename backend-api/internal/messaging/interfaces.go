package messaging

import "time"

const (
	ScanJobVersion      = 1
	ExchangeName        = "cyberwatch.scans"
	ExchangeType        = "topic"
	QueueName           = "scan_jobs"
	DeadLetterQueueName = "scan_dead_letter"
	RoutingKeyStart     = "scan.start"
	DeadLetterExchange  = "cyberwatch.scans.dlx"
	MaxAttempts         = 3
)

// ScanJob is the versionable message published for async scans.
type ScanJob struct {
	Version     int       `json:"version"`
	ScanID      uint      `json:"scanId"`
	CompanyID   uint      `json:"companyId"`
	Domain      string    `json:"domain"`
	RequestedBy string    `json:"requestedBy"`
	CreatedAt   time.Time `json:"createdAt"`
	Attempt     int       `json:"attempt,omitempty"`
}

// ScanPublisher dispatches scan jobs (HTTP worker or RabbitMQ).
type ScanPublisher interface {
	Publish(job ScanJob) error
	Close() error
}
