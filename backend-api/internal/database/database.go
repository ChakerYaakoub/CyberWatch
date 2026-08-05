// Package database opens PostgreSQL via GORM and applies AutoMigrate for models.
package database

import (
	"fmt"
	"log"

	"github.com/cyberwatch/backend-api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect opens a pooled GORM connection (shared DB with the Python worker).
func Connect(dsn string, isDev bool) (*gorm.DB, error) {
	logLevel := logger.Warn
	if isDev {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get sql db: %w", err)
	}

	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(25)
	// No SetConnMaxLifetime — fine for Compose; consider for long-lived cloud pools.

	return db, nil
}

// AutoMigrate creates/updates tables for Company, Scan, Vulnerability.
func AutoMigrate(db *gorm.DB) error {
	// Keep schema in sync with models (also documented in migrations/001_init.sql).
	if err := db.AutoMigrate(
		&models.Company{},
		&models.Scan{},
		&models.Vulnerability{},
	); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}

	log.Println("database schema migrated successfully")
	return nil
}
