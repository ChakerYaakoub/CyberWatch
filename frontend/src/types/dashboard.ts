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
}

export interface VulnerabilityDistribution {
  severity: RiskLevel
  count: number
}
