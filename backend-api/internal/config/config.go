package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort    string
	AppEnv     string
	CORSOrigin string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
}

// Load reads configuration from environment variables.
// Optional non-secret defaults exist only for APP_PORT / APP_ENV / CORS_ORIGIN / DATABASE_SSLMODE.
// Database credentials and connection target must come from the environment (.env).
func Load() (*Config, error) {
	loadDotEnv()

	cfg := &Config{
		AppPort:    getEnv("APP_PORT", "8080"),
		AppEnv:     getEnv("APP_ENV", "development"),
		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:5173"),
		DBHost:     mustGetEnv("DATABASE_HOST"),
		DBPort:     mustGetEnv("DATABASE_PORT"),
		DBUser:     mustGetEnv("DATABASE_USER"),
		DBPassword: mustGetEnv("DATABASE_PASSWORD"),
		DBName:     mustGetEnv("DATABASE_NAME"),
		DBSSLMode:  getEnv("DATABASE_SSLMODE", "disable"),
	}

	missing := missingRequired(cfg)
	if len(missing) > 0 {
		return nil, fmt.Errorf(
			"missing required environment variables: %s (copy .env.example to .env and fill values)",
			strings.Join(missing, ", "),
		)
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		c.DBHost,
		c.DBUser,
		c.DBPassword,
		c.DBName,
		c.DBPort,
		c.DBSSLMode,
	)
}

func loadDotEnv() {
	// Try common locations so `go run` works from repo root or backend-api/.
	_ = godotenv.Load(".env")
	_ = godotenv.Load("backend-api/.env")
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return fallback
}

func mustGetEnv(key string) string {
	if value, ok := os.LookupEnv(key); ok {
		return strings.TrimSpace(value)
	}
	return ""
}

func missingRequired(cfg *Config) []string {
	required := map[string]string{
		"DATABASE_HOST":     cfg.DBHost,
		"DATABASE_PORT":     cfg.DBPort,
		"DATABASE_USER":     cfg.DBUser,
		"DATABASE_PASSWORD": cfg.DBPassword,
		"DATABASE_NAME":     cfg.DBName,
	}

	var missing []string
	for key, value := range required {
		if value == "" {
			missing = append(missing, key)
		}
	}
	return missing
}
