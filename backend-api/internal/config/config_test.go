package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLoadRequiresDatabaseEnv(t *testing.T) {
	clearDBEnv(t)

	_, err := Load()
	require.Error(t, err)
	require.Contains(t, err.Error(), "DATABASE_")
}

func TestLoadFromEnv(t *testing.T) {
	clearDBEnv(t)

	t.Setenv("DATABASE_HOST", "db.internal")
	t.Setenv("DATABASE_PORT", "5432")
	t.Setenv("DATABASE_USER", "cyber")
	t.Setenv("DATABASE_PASSWORD", "secret")
	t.Setenv("DATABASE_NAME", "cyberwatch")
	t.Setenv("APP_PORT", "9090")
	t.Setenv("CORS_ORIGIN", "http://localhost:5173")

	cfg, err := Load()
	require.NoError(t, err)
	require.Equal(t, "db.internal", cfg.DBHost)
	require.Equal(t, "secret", cfg.DBPassword)
	require.Equal(t, "9090", cfg.AppPort)
	require.Contains(t, cfg.DSN(), "host=db.internal")
	require.Contains(t, cfg.DSN(), "password=secret")
	require.NotContains(t, cfg.DSN(), "password=password")
}

func clearDBEnv(t *testing.T) {
	t.Helper()
	keys := []string{
		"DATABASE_HOST",
		"DATABASE_PORT",
		"DATABASE_USER",
		"DATABASE_PASSWORD",
		"DATABASE_NAME",
		"DATABASE_SSLMODE",
		"APP_PORT",
		"APP_ENV",
		"CORS_ORIGIN",
	}
	for _, key := range keys {
		require.NoError(t, os.Unsetenv(key))
	}
}
