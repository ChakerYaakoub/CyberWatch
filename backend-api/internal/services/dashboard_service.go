package services

import (
	"context"
	"math"

	"github.com/cyberwatch/backend-api/internal/cache"
	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
)

type DashboardService struct {
	companies       *repositories.CompanyRepository
	scans           *repositories.ScanRepository
	vulnerabilities *repositories.VulnerabilityRepository
	cache           cache.Cache
}

func NewDashboardService(
	companies *repositories.CompanyRepository,
	scans *repositories.ScanRepository,
	vulnerabilities *repositories.VulnerabilityRepository,
	c cache.Cache,
) *DashboardService {
	if c == nil {
		c = cache.NewNoop()
	}
	return &DashboardService{
		companies:       companies,
		scans:           scans,
		vulnerabilities: vulnerabilities,
		cache:           c,
	}
}

func (s *DashboardService) GetStats() (*DashboardStats, error) {
	ctx := context.Background()
	var cached DashboardStats
	if s.cache.Get(ctx, cache.KeyDashboardStats, &cached) {
		return &cached, nil
	}

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

	stats := &DashboardStats{
		SecurityScore:           securityScore,
		Companies:               companyCount,
		ActiveScans:             activeScans,
		CriticalVulnerabilities: criticalCount,
	}
	s.cache.Set(ctx, cache.KeyDashboardStats, stats, cache.TTLDashboard)
	return stats, nil
}
