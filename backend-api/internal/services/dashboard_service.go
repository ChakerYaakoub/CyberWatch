package services

import (
	"math"

	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
)

type DashboardService struct {
	companies      *repositories.CompanyRepository
	scans          *repositories.ScanRepository
	vulnerabilities *repositories.VulnerabilityRepository
}

func NewDashboardService(
	companies *repositories.CompanyRepository,
	scans *repositories.ScanRepository,
	vulnerabilities *repositories.VulnerabilityRepository,
) *DashboardService {
	return &DashboardService{
		companies:       companies,
		scans:           scans,
		vulnerabilities: vulnerabilities,
	}
}

func (s *DashboardService) GetStats() (*DashboardStats, error) {
	companyCount, err := s.companies.Count()
	if err != nil {
		return nil, err
	}

	activeScans, err := s.scans.CountByStatuses([]models.ScanStatus{
		models.ScanStatusPending,
		models.ScanStatusQueued,
		models.ScanStatusRunning,
	})
	if err != nil {
		return nil, err
	}

	criticalCount, err := s.vulnerabilities.CountBySeverity(models.SeverityCritical)
	if err != nil {
		return nil, err
	}

	avgScore, err := s.scans.AverageCompletedRiskScore()
	if err != nil {
		return nil, err
	}

	securityScore := 0
	if avgScore > 0 {
		securityScore = int(math.Round(avgScore))
	}

	return &DashboardStats{
		SecurityScore:           securityScore,
		Companies:               companyCount,
		ActiveScans:             activeScans,
		CriticalVulnerabilities: criticalCount,
	}, nil
}
