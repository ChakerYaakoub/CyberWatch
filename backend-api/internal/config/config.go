package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

const (
	ScanModeHTTP     = "http"
	ScanModeRabbitMQ = "rabbitmq"
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

	KeycloakURL      string
	KeycloakRealm    string
	KeycloakClientID string

	ScanMode    string
	WorkerURL   string
	RabbitMQURL string

	RabbitExchange       string
	RabbitQueue          string
	RabbitDeadLetterEx   string
	RabbitDeadLetterQueue string
	RabbitRoutingKey     string
	RabbitMaxAttempts    int
}

func Load() (*Config, error) {
	loadDotEnv()

	cfg := &Config{
		AppPort:               getEnv("APP_PORT", "8080"),
		AppEnv:                getEnv("APP_ENV", "development"),
		CORSOrigin:            mustGetEnv("CORS_ORIGIN"),
		DBHost:                mustGetEnv("DATABASE_HOST"),
		DBPort:                mustGetEnv("DATABASE_PORT"),
		DBUser:                mustGetEnv("DATABASE_USER"),
		DBPassword:            mustGetEnv("DATABASE_PASSWORD"),
		DBName:                mustGetEnv("DATABASE_NAME"),
		DBSSLMode:             getEnv("DATABASE_SSLMODE", "disable"),
		KeycloakURL:           mustGetEnv("KEYCLOAK_URL"),
		KeycloakRealm:         mustGetEnv("KEYCLOAK_REALM"),
		KeycloakClientID:      mustGetEnv("KEYCLOAK_CLIENT_ID"),
		ScanMode:              strings.ToLower(getEnv("SCAN_MODE", ScanModeHTTP)),
		WorkerURL:             strings.TrimRight(getEnv("WORKER_URL", ""), "/"),
		RabbitMQURL:           getEnv("RABBITMQ_URL", ""),
		RabbitExchange:        getEnv("RABBITMQ_EXCHANGE", "cyberwatch.scans"),
		RabbitQueue:           getEnv("RABBITMQ_QUEUE", "scan_jobs"),
		RabbitDeadLetterEx:    getEnv("RABBITMQ_DEAD_LETTER_EXCHANGE", "cyberwatch.scans.dlx"),
		RabbitDeadLetterQueue: getEnv("RABBITMQ_DEAD_LETTER_QUEUE", "scan_dead_letter"),
		RabbitRoutingKey:      getEnv("RABBITMQ_ROUTING_KEY", "scan.start"),
		RabbitMaxAttempts:     getEnvInt("RABBITMQ_MAX_ATTEMPTS", 3),
	}

	missing := missingRequired(cfg)
	if len(missing) > 0 {
		return nil, fmt.Errorf(
			"missing required environment variables: %s (copy .env.example to .env and fill values)",
			strings.Join(missing, ", "),
		)
	}

	if cfg.ScanMode != ScanModeHTTP && cfg.ScanMode != ScanModeRabbitMQ {
		return nil, fmt.Errorf("SCAN_MODE must be %q or %q", ScanModeHTTP, ScanModeRabbitMQ)
	}
	if cfg.ScanMode == ScanModeHTTP && cfg.WorkerURL == "" {
		return nil, fmt.Errorf("WORKER_URL is required when SCAN_MODE=http")
	}
	if cfg.ScanMode == ScanModeRabbitMQ && cfg.RabbitMQURL == "" {
		return nil, fmt.Errorf("RABBITMQ_URL is required when SCAN_MODE=rabbitmq")
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
	_ = godotenv.Load(".env")
	_ = godotenv.Load("backend-api/.env")
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value)
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	raw := getEnv(key, "")
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 {
		return fallback
	}
	return n
}

func mustGetEnv(key string) string {
	if value, ok := os.LookupEnv(key); ok {
		return strings.TrimSpace(value)
	}
	return ""
}

func missingRequired(cfg *Config) []string {
	required := map[string]string{
		"CORS_ORIGIN":        cfg.CORSOrigin,
		"DATABASE_HOST":      cfg.DBHost,
		"DATABASE_PORT":      cfg.DBPort,
		"DATABASE_USER":      cfg.DBUser,
		"DATABASE_PASSWORD":  cfg.DBPassword,
		"DATABASE_NAME":      cfg.DBName,
		"KEYCLOAK_URL":       cfg.KeycloakURL,
		"KEYCLOAK_REALM":     cfg.KeycloakRealm,
		"KEYCLOAK_CLIENT_ID": cfg.KeycloakClientID,
	}

	var missing []string
	for key, value := range required {
		if value == "" {
			missing = append(missing, key)
		}
	}
	return missing
}
