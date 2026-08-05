package messaging

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// HTTPPublisher fires scan jobs at the Python worker (development mode).
// Publish returns after scheduling; it does not wait for scan completion.
type HTTPPublisher struct {
	workerURL  string
	httpClient *http.Client
}

func NewHTTPPublisher(workerURL string) *HTTPPublisher {
	return &HTTPPublisher{
		workerURL: workerURL,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (p *HTTPPublisher) Publish(job ScanJob) error {
	if job.Version == 0 {
		job.Version = ScanJobVersion
	}
	if job.Attempt == 0 {
		job.Attempt = 1
	}

	payload, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal scan job: %w", err)
	}

	// Async HTTP so the API can return 202 without waiting for the worker.
	go p.dispatch(payload, job.ScanID)
	return nil
}

func (p *HTTPPublisher) dispatch(payload []byte, scanID uint) {
	url := fmt.Sprintf("%s/jobs", p.workerURL)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		log.Printf("scan job http request build failed scanId=%d: %v", scanID, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		log.Printf("scan job http dispatch failed scanId=%d: %v", scanID, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		log.Printf("scan job http dispatch rejected scanId=%d status=%d", scanID, resp.StatusCode)
		return
	}
	log.Printf("scan job published via http scanId=%d", scanID)
}

func (p *HTTPPublisher) Close() error {
	return nil
}
