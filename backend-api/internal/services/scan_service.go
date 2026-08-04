package services

import (
	"errors"

	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
)

type ScanService struct {
	scans     *repositories.ScanRepository
	companies *repositories.CompanyRepository
}

func NewScanService(scans *repositories.ScanRepository, companies *repositories.CompanyRepository) *ScanService {
	return &ScanService{
		scans:     scans,
		companies: companies,
	}
}

func (s *ScanService) Create(input CreateScanInput) (*models.Scan, error) {
	if input.CompanyID == 0 {
		return nil, ErrInvalidInput
	}

	if _, err := s.companies.FindByID(input.CompanyID); err != nil {
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
