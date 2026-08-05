package services_test

import (
	"context"
	"fmt"
	"testing"

	"github.com/cyberwatch/backend-api/internal/cache"
	"github.com/cyberwatch/backend-api/internal/messaging"
	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
	"github.com/cyberwatch/backend-api/internal/services"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupServices(t *testing.T, c cache.Cache) (*services.CompanyService, *services.ScanService, *services.DashboardService, *gorm.DB) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&models.Company{}, &models.Scan{}, &models.Vulnerability{}))

	companyRepo := repositories.NewCompanyRepository(db)
	scanRepo := repositories.NewScanRepository(db)
	vulnRepo := repositories.NewVulnerabilityRepository(db)

	return services.NewCompanyService(companyRepo, c),
		services.NewScanService(scanRepo, companyRepo, messaging.NoopPublisher{}, c),
		services.NewDashboardService(companyRepo, scanRepo, vulnRepo, c),
		db
}

func TestCompanyListCachePopulationAndInvalidation(t *testing.T) {
	mem := cache.NewMemory()
	companies, _, _, _ := setupServices(t, mem)

	created, err := companies.Create(services.CreateCompanyInput{Name: "Acme", Domain: "acme.test"})
	require.NoError(t, err)
	require.False(t, mem.Has(cache.KeyCompaniesList), "create should invalidate list")

	list, err := companies.List()
	require.NoError(t, err)
	require.Len(t, list, 1)
	require.True(t, mem.Has(cache.KeyCompaniesList))

	_, err = companies.Update(created.ID, services.UpdateCompanyInput{Name: "Acme Renamed", Domain: "acme.test"})
	require.NoError(t, err)
	require.False(t, mem.Has(cache.KeyCompaniesList))
	require.False(t, mem.Has(cache.CompanyKey(created.ID)))

	got, err := companies.GetByID(created.ID)
	require.NoError(t, err)
	require.Equal(t, "Acme Renamed", got.Name)
	require.True(t, mem.Has(cache.CompanyKey(created.ID)))
}

func TestDashboardCacheAndScanInvalidation(t *testing.T) {
	mem := cache.NewMemory()
	companies, scans, dashboard, _ := setupServices(t, mem)

	_, err := companies.Create(services.CreateCompanyInput{Name: "Beta", Domain: "beta.test"})
	require.NoError(t, err)

	stats, err := dashboard.GetStats()
	require.NoError(t, err)
	require.Equal(t, int64(1), stats.Companies)
	require.True(t, mem.Has(cache.KeyDashboardStats))

	company, err := companies.List()
	require.NoError(t, err)
	require.Len(t, company, 1)

	_, err = scans.Create(services.CreateScanCommand{CompanyID: company[0].ID, RequestedBy: "test"})
	require.NoError(t, err)
	require.False(t, mem.Has(cache.KeyDashboardStats), "scan create should invalidate dashboard")
}

func TestScanCacheFallbackWithNoop(t *testing.T) {
	companies, scans, _, _ := setupServices(t, cache.NewNoop())

	co, err := companies.Create(services.CreateCompanyInput{Name: "Gamma", Domain: "gamma.test"})
	require.NoError(t, err)

	scan, err := scans.Create(services.CreateScanCommand{CompanyID: co.ID})
	require.NoError(t, err)

	got, err := scans.GetByID(scan.ID)
	require.NoError(t, err)
	require.Equal(t, models.ScanStatusQueued, got.Status)

	status, err := scans.GetStatus(scan.ID)
	require.NoError(t, err)
	require.Equal(t, models.ScanStatusQueued, status)
}

func TestScanDetailsCachePopulation(t *testing.T) {
	mem := cache.NewMemory()
	companies, scans, _, _ := setupServices(t, mem)

	co, err := companies.Create(services.CreateCompanyInput{Name: "Delta", Domain: "delta.test"})
	require.NoError(t, err)
	scan, err := scans.Create(services.CreateScanCommand{CompanyID: co.ID})
	require.NoError(t, err)

	// Create invalidates then re-stores scan keys
	require.True(t, mem.Has(cache.ScanKey(scan.ID)))
	require.True(t, mem.Has(cache.ScanStatusKey(scan.ID)))

	mem.Delete(context.Background(), cache.ScanKey(scan.ID), cache.ScanStatusKey(scan.ID))
	got, err := scans.GetByID(scan.ID)
	require.NoError(t, err)
	require.Equal(t, scan.ID, got.ID)
	require.True(t, mem.Has(cache.ScanKey(scan.ID)))
}
