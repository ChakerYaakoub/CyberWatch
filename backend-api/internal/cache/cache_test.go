package cache_test

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/cyberwatch/backend-api/internal/cache"
	"github.com/stretchr/testify/require"
)

func TestMemoryPopulationAndInvalidation(t *testing.T) {
	mem := cache.NewMemory()
	ctx := context.Background()

	stats := map[string]int{"securityScore": 80}
	mem.Set(ctx, cache.KeyDashboardStats, stats, cache.TTLDashboard)
	require.True(t, mem.Has(cache.KeyDashboardStats))

	var got map[string]int
	require.True(t, mem.Get(ctx, cache.KeyDashboardStats, &got))
	require.Equal(t, 80, got["securityScore"])

	cache.InvalidateDashboard(mem)
	require.False(t, mem.Has(cache.KeyDashboardStats))
}

func TestMemoryExpiration(t *testing.T) {
	mem := cache.NewMemory()
	ctx := context.Background()

	mem.Set(ctx, cache.ScanStatusKey(1), "RUNNING", 20*time.Millisecond)
	require.True(t, mem.Has(cache.ScanStatusKey(1)))

	time.Sleep(40 * time.Millisecond)
	var status string
	require.False(t, mem.Get(ctx, cache.ScanStatusKey(1), &status))
}

func TestRedisHitMissAndFallback(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	defer mr.Close()

	c, err := cache.NewFromURL("redis://" + mr.Addr())
	require.NoError(t, err)
	defer c.Close()

	ctx := context.Background()
	payload := map[string]string{"name": "Acme"}
	c.Set(ctx, cache.CompanyKey(7), payload, cache.TTLCompanies)

	var hit map[string]string
	require.True(t, c.Get(ctx, cache.CompanyKey(7), &hit))
	require.Equal(t, "Acme", hit["name"])

	var miss map[string]string
	require.False(t, c.Get(ctx, cache.CompanyKey(99), &miss))

	mr.Close() // Redis offline

	var afterDown map[string]string
	require.False(t, c.Get(ctx, cache.CompanyKey(7), &afterDown))
	// Set must not panic / fail the caller
	c.Set(ctx, cache.KeyCompaniesList, []string{"x"}, cache.TTLCompanies)
}

func TestNewFromURLEmptyIsNoop(t *testing.T) {
	c, err := cache.NewFromURL("")
	require.NoError(t, err)
	require.False(t, c.Get(context.Background(), "anything", new(string)))
}

func TestRedisDownIsFast(t *testing.T) {
	// Nothing listening — first call may dial briefly, then circuit opens.
	c, err := cache.NewFromURL("redis://127.0.0.1:1")
	require.NoError(t, err)
	defer c.Close()

	ctx := context.Background()
	start := time.Now()
	for i := 0; i < 20; i++ {
		var dest map[string]int
		require.False(t, c.Get(ctx, cache.KeyDashboardStats, &dest))
		c.Set(ctx, cache.KeyDashboardStats, map[string]int{"n": 1}, cache.TTLDashboard)
	}
	elapsed := time.Since(start)
	require.Less(t, elapsed, 1500*time.Millisecond, "offline Redis must not stall requests (elapsed=%s)", elapsed)
}

func TestRedisTTLExpiration(t *testing.T) {
	mr, err := miniredis.Run()
	require.NoError(t, err)
	defer mr.Close()

	c, err := cache.NewFromURL("redis://" + mr.Addr())
	require.NoError(t, err)
	defer c.Close()

	ctx := context.Background()
	c.Set(ctx, cache.KeyDashboardStats, map[string]int{"n": 1}, time.Second)
	mr.FastForward(2 * time.Second)

	var dest map[string]int
	require.False(t, c.Get(ctx, cache.KeyDashboardStats, &dest))
}
