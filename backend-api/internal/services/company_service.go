package services

import (
	"context"
	"errors"
	"fmt"
	"net"
	"regexp"
	"strings"

	"github.com/cyberwatch/backend-api/internal/cache"
	"github.com/cyberwatch/backend-api/internal/models"
	"github.com/cyberwatch/backend-api/internal/repositories"
)

var (
	ErrInvalidInput   = errors.New("invalid input")
	ErrCompanyExists  = errors.New("company domain already exists")
	ErrCompanyMissing = errors.New("company not found")
	ErrScanMissing    = errors.New("scan not found")
)

var domainRegex = regexp.MustCompile(`^(?i)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$`)

type CreateCompanyInput struct {
	Name   string
	Domain string
}

type UpdateCompanyInput struct {
	Name   string
	Domain string
}

type DashboardStats struct {
	SecurityScore          int   `json:"securityScore"`
	Companies              int64 `json:"companies"`
	ActiveScans            int64 `json:"activeScans"`
	CriticalVulnerabilities int64 `json:"criticalVulnerabilities"`
}

type CompanyService struct {
	companies *repositories.CompanyRepository
	cache     cache.Cache
}

func NewCompanyService(companies *repositories.CompanyRepository, c cache.Cache) *CompanyService {
	if c == nil {
		c = cache.NewNoop()
	}
	return &CompanyService{companies: companies, cache: c}
}

func (s *CompanyService) Create(input CreateCompanyInput) (*models.Company, error) {
	name := strings.TrimSpace(input.Name)
	domain := strings.ToLower(strings.TrimSpace(input.Domain))

	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	if domain == "" {
		return nil, fmt.Errorf("%w: domain is required", ErrInvalidInput)
	}
	if !isValidDomain(domain) {
		return nil, fmt.Errorf("%w: invalid domain format", ErrInvalidInput)
	}

	exists, err := s.companies.ExistsByDomain(domain)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCompanyExists
	}

	company := &models.Company{
		Name:   name,
		Domain: domain,
	}
	if err := s.companies.Create(company); err != nil {
		return nil, err
	}
	cache.InvalidateCompanyMutation(s.cache, company.ID)
	return company, nil
}

func (s *CompanyService) List() ([]models.Company, error) {
	ctx := context.Background()
	var cached []models.Company
	if s.cache.Get(ctx, cache.KeyCompaniesList, &cached) {
		return cached, nil
	}

	companies, err := s.companies.FindAll()
	if err != nil {
		return nil, err
	}
	s.cache.Set(ctx, cache.KeyCompaniesList, companies, cache.TTLCompanies)
	return companies, nil
}

func (s *CompanyService) GetByID(id uint) (*models.Company, error) {
	ctx := context.Background()
	key := cache.CompanyKey(id)
	var cached models.Company
	if s.cache.Get(ctx, key, &cached) {
		return &cached, nil
	}

	company, err := s.companies.FindByID(id)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrCompanyMissing
	}
	if err != nil {
		return nil, err
	}
	s.cache.Set(ctx, key, company, cache.TTLCompanies)
	return company, nil
}

func (s *CompanyService) Update(id uint, input UpdateCompanyInput) (*models.Company, error) {
	company, err := s.companies.FindByID(id)
	if errors.Is(err, repositories.ErrNotFound) {
		return nil, ErrCompanyMissing
	}
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(input.Name)
	domain := strings.ToLower(strings.TrimSpace(input.Domain))

	if name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	if domain == "" {
		return nil, fmt.Errorf("%w: domain is required", ErrInvalidInput)
	}
	if !isValidDomain(domain) {
		return nil, fmt.Errorf("%w: invalid domain format", ErrInvalidInput)
	}

	exists, err := s.companies.ExistsByDomainExcludingID(domain, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCompanyExists
	}

	company.Name = name
	company.Domain = domain

	if err := s.companies.Update(company); err != nil {
		return nil, err
	}
	cache.InvalidateCompanyMutation(s.cache, id)
	return company, nil
}

func (s *CompanyService) Delete(id uint) error {
	if err := s.companies.Delete(id); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return ErrCompanyMissing
		}
		return err
	}
	cache.InvalidateCompanyMutation(s.cache, id)
	return nil
}

func isValidDomain(domain string) bool {
	if len(domain) > 253 || strings.Contains(domain, "://") || strings.ContainsAny(domain, "/ ") {
		return false
	}
	if !domainRegex.MatchString(domain) {
		return false
	}
	// Reject purely numeric hostnames that look like IPs unless they parse as IPs intentionally unused here.
	if ip := net.ParseIP(domain); ip != nil {
		return false
	}
	return true
}
