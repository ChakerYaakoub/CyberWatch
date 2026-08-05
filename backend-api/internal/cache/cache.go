package cache

import (
	"context"
	"fmt"
	"log"
	"time"
)

// Cache key names (Phase 6).
const (
	KeyDashboardStats = "dashboard:stats"
	KeyCompaniesList  = "companies:list"
)

// TTLs.
const (
	TTLDashboard   = 60 * time.Second
	TTLCompanies   = 5 * time.Minute
	TTLScanStatus  = 10 * time.Second
	TTLScanDetails = 30 * time.Second
)

func CompanyKey(id uint) string {
	return fmt.Sprintf("company:%d", id)
}

func ScanKey(id uint) string {
	return fmt.Sprintf("scan:%d", id)
}

func ScanStatusKey(id uint) string {
	return fmt.Sprintf("scan:status:%d", id)
}

// NewNoop returns a disabled cache (Redis unset or unavailable).
func NewNoop() Cache {
	return noopCache{}
}

type noopCache struct{}

func (noopCache) Get(_ context.Context, _ string, _ any) bool { return false }
func (noopCache) Set(_ context.Context, _ string, _ any, _ time.Duration) {
}
func (noopCache) Delete(_ context.Context, _ ...string) {}
func (noopCache) Ping(_ context.Context) error          { return nil }
func (noopCache) Close() error                          { return nil }

// Invalidate helpers — always log; never fail callers.

func InvalidateDashboard(c Cache) {
	if c == nil {
		return
	}
	log.Printf("cache: invalidate key=%s", KeyDashboardStats)
	c.Delete(context.Background(), KeyDashboardStats)
}

func InvalidateCompaniesList(c Cache) {
	if c == nil {
		return
	}
	log.Printf("cache: invalidate key=%s", KeyCompaniesList)
	c.Delete(context.Background(), KeyCompaniesList)
}

func InvalidateCompany(c Cache, id uint) {
	if c == nil {
		return
	}
	key := CompanyKey(id)
	log.Printf("cache: invalidate key=%s", key)
	c.Delete(context.Background(), key)
}

func InvalidateScan(c Cache, id uint) {
	if c == nil {
		return
	}
	detail := ScanKey(id)
	status := ScanStatusKey(id)
	log.Printf("cache: invalidate keys=%s,%s", detail, status)
	c.Delete(context.Background(), detail, status)
}

func InvalidateCompanyMutation(c Cache, id uint) {
	InvalidateCompaniesList(c)
	InvalidateCompany(c, id)
	InvalidateDashboard(c)
}

func InvalidateScanMutation(c Cache, id uint) {
	InvalidateScan(c, id)
	InvalidateDashboard(c)
}
