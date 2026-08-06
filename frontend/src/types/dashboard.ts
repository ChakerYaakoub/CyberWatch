import type { RiskLevel } from './scan'

export interface DashboardStats {
  securityScore: number
  companies: number
  activeScans: number
  criticalVulnerabilities: number
}

export interface RiskEvolutionPoint {
  date: string
  score: number
  companyName: string
  domain: string
  scanId: number
}

export interface VulnerabilityDistribution {
  severity: RiskLevel
  count: number
}
