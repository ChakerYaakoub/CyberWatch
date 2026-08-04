export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export type ScanStatus = 'Pending' | 'Running' | 'Completed' | 'Failed'

export type CompanyStatus = 'Active' | 'Inactive' | 'Pending'

export interface Company {
  id: string
  name: string
  domain: string
  createdAt: string
  status: CompanyStatus
}

export interface Finding {
  id: string
  severity: RiskLevel
  title: string
  description: string
  category: string
}

export interface Scan {
  id: string
  companyId: string
  companyName: string
  domain: string
  status: ScanStatus
  riskLevel: RiskLevel
  securityScore: number
  date: string
  findings: Finding[]
}

export interface DashboardStats {
  securityScore: number
  activeScans: number
  criticalVulnerabilities: number
  monitoredCompanies: number
}

export interface RiskEvolutionPoint {
  date: string
  score: number
}

export interface VulnerabilityDistribution {
  severity: RiskLevel
  count: number
}

export interface CreateCompanyPayload {
  name: string
  domain: string
}

export interface LoginCredentials {
  email: string
  password: string
}
