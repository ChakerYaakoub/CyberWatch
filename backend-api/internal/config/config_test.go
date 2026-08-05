package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

// TestLoadRequiresDatabaseEnv ensures the API refuses to start without DB settings.
func TestLoadRequiresDatabaseEnv(t *testing.T) {
	clearEnv(t)

	_, err := Load()
	require.Error(t, err)
	require.Contains(t, err.Error(), "DATABASE_")
}

// TestLoadFromEnv checks happy-path parsing of required + optional vars.
func TestLoadFromEnv(t *testing.T) {
	clearEnv(t)

	t.Setenv("DATABASE_HOST", "db.internal")
	t.Setenv("DATABASE_PORT", "5432")
	t.Setenv("DATABASE_USER", "cyber")
	t.Setenv("DATABASE_PASSWORD", "secret")
	t.Setenv("DATABASE_NAME", "cyberwatch")
	t.Setenv("KEYCLOAK_URL", "http://localhost:8081")
	t.Setenv("KEYCLOAK_REALM", "CyberWatch")
	t.Setenv("KEYCLOAK_CLIENT_ID", "cyberwatch-api")
	t.Setenv("SCAN_MODE", "http")
	t.Setenv("WORKER_URL", "http://localhost:8001")
	t.Setenv("APP_PORT", "9090")
	t.Setenv("CORS_ORIGIN", "http://localhost:5173")

	cfg, err := Load()
	require.NoError(t, err)
	require.Equal(t, "db.internal", cfg.DBHost)
	require.Equal(t, "secret", cfg.DBPassword)
	require.Equal(t, "9090", cfg.AppPort)
	require.Equal(t, "CyberWatch", cfg.KeycloakRealm)
	require.Equal(t, "http", cfg.ScanMode)
	require.Contains(t, cfg.DSN(), "host=db.internal")
	require.Contains(t, cfg.DSN(), "password=secret")
	require.NotContains(t, cfg.DSN(), "password=password")
}

func clearEnv(t *testing.T) {
	t.Helper()
	keys := []string{
		"DATABASE_HOST",
		"DATABASE_PORT",
		"DATABASE_USER",
		"DATABASE_PASSWORD",
		"DATABASE_NAME",
		"DATABASE_SSLMODE",
		"KEYCLOAK_URL",
		"KEYCLOAK_REALM",
		"KEYCLOAK_CLIENT_ID",
		"APP_PORT",
		"APP_ENV",
		"CORS_ORIGIN",
		"SCAN_MODE",
		"WORKER_URL",
		"RABBITMQ_URL",
	}
	for _, key := range keys {
		require.NoError(t, os.Unsetenv(key))
	}
}
