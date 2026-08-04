package repositories

import (
	"errors"

	"github.com/cyberwatch/backend-api/internal/models"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("resource not found")

type CompanyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) *CompanyRepository {
	return &CompanyRepository{db: db}
}

func (r *CompanyRepository) Create(company *models.Company) error {
	return r.db.Create(company).Error
}

func (r *CompanyRepository) FindAll() ([]models.Company, error) {
	var companies []models.Company
	err := r.db.Order("created_at DESC").Find(&companies).Error
	return companies, err
}

func (r *CompanyRepository) FindByID(id uint) (*models.Company, error) {
	var company models.Company
	err := r.db.First(&company, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *CompanyRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.Company{}).Count(&count).Error
	return count, err
}

func (r *CompanyRepository) ExistsByDomain(domain string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Company{}).Where("domain = ?", domain).Count(&count).Error
	return count > 0, err
}

func (r *CompanyRepository) ExistsByDomainExcludingID(domain string, id uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Company{}).
		Where("domain = ? AND id <> ?", domain, id).
		Count(&count).Error
	return count > 0, err
}

func (r *CompanyRepository) Update(company *models.Company) error {
	return r.db.Save(company).Error
}

func (r *CompanyRepository) Delete(id uint) error {
	result := r.db.Delete(&models.Company{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}
