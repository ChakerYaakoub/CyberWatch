package repositories

import (
	"errors"

	"github.com/cyberwatch/backend-api/internal/models"
	"gorm.io/gorm"
)

type ScanRepository struct {
	db *gorm.DB
}

func NewScanRepository(db *gorm.DB) *ScanRepository {
	return &ScanRepository{db: db}
}

func (r *ScanRepository) Create(scan *models.Scan) error {
	return r.db.Create(scan).Error
}

func (r *ScanRepository) FindAll() ([]models.Scan, error) {
	var scans []models.Scan
	err := r.db.
		Preload("Company").
		Order("created_at DESC").
		Find(&scans).Error
	return scans, err
}

func (r *ScanRepository) FindByID(id uint) (*models.Scan, error) {
	var scan models.Scan
	err := r.db.
		Preload("Company").
		Preload("Vulnerabilities", func(db *gorm.DB) *gorm.DB {
			return db.Order("CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 ELSE 5 END")
		}).
		First(&scan, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &scan, nil
}

func (r *ScanRepository) UpdateStatus(id uint, status models.ScanStatus) error {
	return r.db.Model(&models.Scan{}).Where("id = ?", id).Update("status", status).Error
}

func (r *ScanRepository) CountByStatuses(statuses []models.ScanStatus) (int64, error) {
	var count int64
	err := r.db.Model(&models.Scan{}).Where("status IN ?", statuses).Count(&count).Error
	return count, err
}

func (r *ScanRepository) AverageCompletedRiskScore() (float64, error) {
	var avg *float64
	err := r.db.Model(&models.Scan{}).
		Where("status = ? AND risk_score IS NOT NULL", models.ScanStatusCompleted).
		Select("AVG(risk_score)").
		Scan(&avg).Error
	if err != nil {
		return 0, err
	}
	if avg == nil {
		return 0, nil
	}
	return *avg, nil
}
