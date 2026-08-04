package database

import (
	"fmt"
	"log"

	"github.com/cyberwatch/backend-api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

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

	return db, nil
}

func AutoMigrate(db *gorm.DB) error {
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
