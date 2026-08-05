package services

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/cyberwatch/backend-api/internal/cache"
	"github.com/cyberwatch/backend-api/internal/messaging"
	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
)

type ScanService struct {
	scans     *repositories.ScanRepository
	companies *repositories.CompanyRepository
	publisher messaging.ScanPublisher
	cache     cache.Cache
}

func NewScanService(
	scans *repositories.ScanRepository,
	companies *repositories.CompanyRepository,
	publisher messaging.ScanPublisher,
	c cache.Cache,
) *ScanService {
	if publisher == nil {
		publisher = messaging.NoopPublisher{}
	}
	if c == nil {
		c = cache.NewNoop()
	}
	return &ScanService{
		scans:     scans,
		companies: companies,
		publisher: publisher,
		cache:     c,
	}
}

type scanStatusPayload struct {
	Status models.ScanStatus `json:"status"`
}

type CreateScanCommand struct {
	CompanyID   uint
	RequestedBy string
}

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

	if err := s.publisher.Publish(job); err != nil {
		log.Printf("scan job publish failed scanId=%d: %v", scan.ID, err)
		_ = s.scans.UpdateStatus(scan.ID, models.ScanStatusFailed)
		cache.InvalidateScanMutation(s.cache, scan.ID)
		return nil, err
	}

	if err := s.scans.UpdateStatus(scan.ID, models.ScanStatusQueued); err != nil {
		return nil, err
	}

	log.Printf("scan job accepted scanId=%d domain=%s mode=async", scan.ID, company.Domain)
	result, err := s.scans.FindByID(scan.ID)
	if err != nil {
		return nil, err
	}
	cache.InvalidateScanMutation(s.cache, scan.ID)
	s.storeScanCache(result)
	return result, nil
}

func (s *ScanService) List() ([]models.Scan, error) {
	return s.scans.FindAll()
}

func (s *ScanService) GetByID(id uint) (*models.Scan, error) {
	ctx := context.Background()
	key := cache.ScanKey(id)
	var cached models.Scan
	if s.cache.Get(ctx, key, &cached) {
		return &cached, nil
	}

	scan, err := s.scans.FindByID(id)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrScanMissing
	}
	if err != nil {
		return nil, err
	}

	s.storeScanCache(scan)

	// Worker writes COMPLETED/FAILED directly to PostgreSQL; refresh dashboard when we observe it.
	if scan.Status == models.ScanStatusCompleted || scan.Status == models.ScanStatusFailed {
		cache.InvalidateDashboard(s.cache)
	}

	return scan, nil
}

func (s *ScanService) GetStatus(id uint) (models.ScanStatus, error) {
	ctx := context.Background()
	key := cache.ScanStatusKey(id)
	var cached scanStatusPayload
	if s.cache.Get(ctx, key, &cached) {
		return cached.Status, nil
	}

	scan, err := s.scans.FindByID(id)
	if errors.Is(err, repositories.ErrNotFound) {
		return "", ErrScanMissing
	}
	if err != nil {
		return "", err
	}

	s.storeScanCache(scan)
	if scan.Status == models.ScanStatusCompleted || scan.Status == models.ScanStatusFailed {
		cache.InvalidateDashboard(s.cache)
	}
	return scan.Status, nil
}

func (s *ScanService) storeScanCache(scan *models.Scan) {
	if scan == nil {
		return
	}
	ctx := context.Background()
	s.cache.Set(ctx, cache.ScanKey(scan.ID), scan, cache.TTLScanDetails)
	s.cache.Set(ctx, cache.ScanStatusKey(scan.ID), scanStatusPayload{Status: scan.Status}, cache.TTLScanStatus)
}
