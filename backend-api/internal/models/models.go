// Package models defines GORM entities shared with the database schema.
package models

import "time"

// ScanStatus lifecycle (API creates PENDING→QUEUED; worker sets RUNNING/COMPLETED/FAILED).
type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "PENDING"
	ScanStatusQueued    ScanStatus = "QUEUED"
	ScanStatusRunning   ScanStatus = "RUNNING"
	ScanStatusCompleted ScanStatus = "COMPLETED"
	ScanStatusFailed    ScanStatus = "FAILED"
)

type Severity string

const (
	SeverityInfo     Severity = "INFO"
	SeverityLow      Severity = "LOW"
	SeverityMedium   Severity = "MEDIUM"
	SeverityHigh     Severity = "HIGH"
	SeverityCritical Severity = "CRITICAL"
)

// Company is a monitored organization (unique public domain).
type Company struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	Domain    string    `gorm:"size:255;not null;uniqueIndex" json:"domain"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Scans     []Scan    `gorm:"foreignKey:CompanyID" json:"scans,omitempty"`
}

// Scan is one analysis run for a company. risk_score is filled by the worker.
type Scan struct {
	ID              uint            `gorm:"primaryKey" json:"id"`
	CompanyID       uint            `gorm:"not null;index" json:"companyId"`
	Company         *Company        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"company,omitempty"`
	Status          ScanStatus      `gorm:"size:32;not null;index;default:PENDING" json:"status"`
	RiskScore       *int            `json:"riskScore"`
	StartedAt       *time.Time      `json:"startedAt"`
	FinishedAt      *time.Time      `json:"finishedAt"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Vulnerabilities []Vulnerability `gorm:"foreignKey:ScanID" json:"vulnerabilities,omitempty"`
}

// Vulnerability is a finding produced by the Python scanner for a scan.
type Vulnerability struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ScanID      uint      `gorm:"not null;index" json:"scanId"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Severity    Severity  `gorm:"size:32;not null;index" json:"severity"`
	Description string    `gorm:"type:text;not null" json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}
