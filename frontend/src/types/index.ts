export type { ApiResponse, ApiErrorBody } from './api'
export type { Company, CreateCompanyPayload } from './company'
export type {
  Scan,
  ScanStatus,
  Severity,
  RiskLevel,
  Vulnerability,
  CreateScanPayload,
  ScanListItem,
  FindingView,
} from './scan'
export type { DashboardStats, RiskEvolutionPoint, VulnerabilityDistribution } from './dashboard'
export type { LoginCredentials, AuthSession } from './auth'

/** @deprecated kept for StatusBadge company display */
export type CompanyStatus = 'Active' | 'Inactive' | 'Pending'
