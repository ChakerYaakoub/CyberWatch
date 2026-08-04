export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type RiskLevel = Severity | 'INFO'

export interface Vulnerability {
  id: number
  scanId: number
  title: string
  severity: Severity
  description: string
  createdAt: string
}

export interface ScanCompany {
  id: number
  name: string
  domain: string
}

export interface Scan {
  id: number
  companyId: number
  company?: ScanCompany
  status: ScanStatus
  riskScore: number | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
  vulnerabilities: Vulnerability[]
}

export interface CreateScanPayload {
  companyId: number
}

/** View helpers used by existing dashboard / scan UI */
export interface ScanListItem {
  id: number
  companyId: number
  companyName: string
  domain: string
  status: ScanStatus
  riskLevel: RiskLevel
  securityScore: number
  date: string
  findings: FindingView[]
}

export interface FindingView {
  id: number
  severity: RiskLevel
  title: string
  description: string
  category: string
}
