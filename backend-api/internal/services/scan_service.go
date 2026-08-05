package services

import (
	"errors"
	"log"
	"time"

	"github.com/cyberwatch/backend-api/internal/messaging"
	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
)

// ScanService creates scan rows and dispatches async jobs to the worker.
// It does not run scanners — that is the Python worker's job.
type ScanService struct {
	scans     *repositories.ScanRepository
	companies *repositories.CompanyRepository
	publisher messaging.ScanPublisher
}

func NewScanService(
	scans *repositories.ScanRepository,
	companies *repositories.CompanyRepository,
	publisher messaging.ScanPublisher,
) *ScanService {
	if publisher == nil {
		publisher = messaging.NoopPublisher{}
	}
	return &ScanService{
		scans:     scans,
		companies: companies,
		publisher: publisher,
	}
}

// CreateScanCommand is the input for starting a scan (from HTTP handler).
type CreateScanCommand struct {
	CompanyID   uint
	RequestedBy string // usually JWT email
}

// Create inserts PENDING, publishes ScanJob, then marks QUEUED (or FAILED on publish error).
func (s *ScanService) Create(input CreateScanCommand) (*models.Scan, error) {
	if input.CompanyID == 0 {
		return nil, ErrInvalidInput
	}

	company, err := s.companies.FindByID(input.CompanyID)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrCompanyMissing
		}
		return nil, err
	}

	// Persist first so the worker can update this row by scanId.
	scan := &models.Scan{
		CompanyID: input.CompanyID,
		Status:    models.ScanStatusPending,
	}

	if err := s.scans.Create(scan); err != nil {
		return nil, err
	}

	requestedBy := input.RequestedBy
	if requestedBy == "" {
		requestedBy = "system"
	}

	job := messaging.ScanJob{
		Version:     messaging.ScanJobVersion,
		ScanID:      scan.ID,
		CompanyID:   company.ID,
		Domain:      company.Domain,
		RequestedBy: requestedBy,
		CreatedAt:   time.Now().UTC(),
		Attempt:     1,
	}

	// Dispatch to worker (HTTP /jobs or RabbitMQ) — implementation chosen at startup.
	if err := s.publisher.Publish(job); err != nil {
		log.Printf("scan job publish failed scanId=%d: %v", scan.ID, err)
		_ = s.scans.UpdateStatus(scan.ID, models.ScanStatusFailed)
		return nil, err
	}

	if err := s.scans.UpdateStatus(scan.ID, models.ScanStatusQueued); err != nil {
		return nil, err
	}

	log.Printf("scan job accepted scanId=%d domain=%s mode=async", scan.ID, company.Domain)
	return s.scans.FindByID(scan.ID)
}

func (s *ScanService) List() ([]models.Scan, error) {
	return s.scans.FindAll()
}

func (s *ScanService) GetByID(id uint) (*models.Scan, error) {
	scan, err := s.scans.FindByID(id)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrScanMissing
	}
	return scan, err
}
