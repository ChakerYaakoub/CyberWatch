/** Per-company scan rollups for Home / Companies / Company detail. */

import type { Company, RiskLevel, ScanListItem, ScanStatus } from '../types'

const ACTIVE: ScanStatus[] = ['PENDING', 'QUEUED', 'RUNNING']

export interface CompanyOverview {
  company: Company
  scans: ScanListItem[]
  scanCount: number
  latestScan: ScanListItem | null
  latestCompleted: ScanListItem | null
  hasActiveScan: boolean
  neverScanned: boolean
  /** Never scanned, failed latest, or last completed score is HIGH/CRITICAL risk. */
  needsAttention: boolean
  attentionReason: string | null
}

function isWorseRisk(a: RiskLevel, b: RiskLevel): boolean {
  const order: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
  return order.indexOf(a) < order.indexOf(b)
}

export function scansForCompany(scans: ScanListItem[], companyId: number): ScanListItem[] {
  return scans
    .filter((s) => s.companyId === companyId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function buildCompanyOverview(company: Company, allScans: ScanListItem[]): CompanyOverview {
  const scans = scansForCompany(allScans, company.id)
  const latestScan = scans[0] ?? null
  const latestCompleted =
    scans.find((s) => s.status === 'COMPLETED' && s.riskLevel !== 'INFO') ??
    scans.find((s) => s.status === 'COMPLETED') ??
    null
  const hasActiveScan = scans.some((s) => ACTIVE.includes(s.status))
  const neverScanned = scans.length === 0

  let needsAttention = false
  let attentionReason: string | null = null

  if (neverScanned) {
    needsAttention = true
    attentionReason = 'Never scanned'
  } else if (latestScan?.status === 'FAILED') {
    needsAttention = true
    attentionReason = 'Latest scan failed'
  } else if (
    latestCompleted &&
    (latestCompleted.riskLevel === 'CRITICAL' || latestCompleted.riskLevel === 'HIGH')
  ) {
    needsAttention = true
    attentionReason = `Latest risk: ${latestCompleted.riskLevel}`
  }

  return {
    company,
    scans,
    scanCount: scans.length,
    latestScan,
    latestCompleted,
    hasActiveScan,
    neverScanned,
    needsAttention,
    attentionReason,
  }
}

export function buildCompanyOverviews(
  companies: Company[],
  allScans: ScanListItem[],
): CompanyOverview[] {
  return companies
    .map((c) => buildCompanyOverview(c, allScans))
    .sort((a, b) => a.company.name.localeCompare(b.company.name))
}

/** Companies that need action, worst risk first, then never scanned. */
export function attentionQueue(overviews: CompanyOverview[]): CompanyOverview[] {
  return overviews
    .filter((o) => o.needsAttention)
    .sort((a, b) => {
      const aRisk = a.latestCompleted?.riskLevel ?? 'INFO'
      const bRisk = b.latestCompleted?.riskLevel ?? 'INFO'
      if (a.neverScanned !== b.neverScanned) return a.neverScanned ? 1 : -1
      if (aRisk !== bRisk) return isWorseRisk(aRisk, bRisk) ? -1 : 1
      return a.company.name.localeCompare(b.company.name)
    })
}

export function activeScans(scans: ScanListItem[]): ScanListItem[] {
  return scans
    .filter((s) => ACTIVE.includes(s.status))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function recentScans(scans: ScanListItem[], limit = 8): ScanListItem[] {
  return [...scans].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}
