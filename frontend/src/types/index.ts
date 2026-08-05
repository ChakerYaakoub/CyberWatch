export type { ApiResponse, ApiErrorBody } from './api'
export type { Company, CreateCompanyPayload, UpdateCompanyPayload } from './company'
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

/** Display-only company status badge values */
export type CompanyStatus = 'Active' | 'Inactive' | 'Pending'
