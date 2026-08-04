package models

import "time"

type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "PENDING"
	ScanStatusRunning   ScanStatus = "RUNNING"
	ScanStatusCompleted ScanStatus = "COMPLETED"
	ScanStatusFailed    ScanStatus = "FAILED"
)

type Severity string

const (
	SeverityLow      Severity = "LOW"
	SeverityMedium   Severity = "MEDIUM"
	SeverityHigh     Severity = "HIGH"
	SeverityCritical Severity = "CRITICAL"
)

type Company struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	Domain    string    `gorm:"size:255;not null;uniqueIndex" json:"domain"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Scans     []Scan    `gorm:"foreignKey:CompanyID" json:"scans,omitempty"`
}

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

type Vulnerability struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ScanID      uint      `gorm:"not null;index" json:"scanId"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Severity    Severity  `gorm:"size:32;not null;index" json:"severity"`
	Description string    `gorm:"type:text;not null" json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}
