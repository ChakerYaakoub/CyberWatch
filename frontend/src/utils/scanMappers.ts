import type {
  FindingView,
  RiskEvolutionPoint,
  RiskLevel,
  Scan,
  ScanListItem,
  Severity,
  VulnerabilityDistribution,
} from '../types'

const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export function riskLevelFromScore(score: number | null, status: Scan['status']): RiskLevel {
  if (score === null || status === 'PENDING' || status === 'RUNNING' || status === 'FAILED') {
    return 'INFO'
  }
  if (score < 40) return 'CRITICAL'
  if (score < 60) return 'HIGH'
  if (score < 80) return 'MEDIUM'
  return 'LOW'
}

export function toScanListItem(scan: Scan): ScanListItem {
  const securityScore = scan.riskScore ?? 0
  return {
    id: scan.id,
    companyId: scan.companyId,
    companyName: scan.company?.name ?? `Company #${scan.companyId}`,
    domain: scan.company?.domain ?? '—',
    status: scan.status,
    riskLevel: riskLevelFromScore(scan.riskScore, scan.status),
    securityScore,
    date: scan.finishedAt ?? scan.createdAt,
    findings: (scan.vulnerabilities ?? []).map(toFindingView),
  }
}

export function toFindingView(vuln: Scan['vulnerabilities'][number]): FindingView {
  return {
    id: vuln.id,
    severity: vuln.severity,
    title: vuln.title,
    description: vuln.description,
    category: 'Finding',
  }
}

export function buildRiskEvolution(scans: Scan[]): RiskEvolutionPoint[] {
  const completed = scans
    .filter((scan) => scan.status === 'COMPLETED' && scan.riskScore !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  if (completed.length === 0) {
    return []
  }

  return completed.map((scan) => ({
    date: formatShortDate(scan.finishedAt ?? scan.createdAt),
    score: scan.riskScore ?? 0,
  }))
}

export function buildVulnerabilityDistribution(scans: Scan[]): VulnerabilityDistribution[] {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  }

  for (const scan of scans) {
    for (const vuln of scan.vulnerabilities ?? []) {
      counts[vuln.severity] += 1
    }
  }

  return severityOrder.map((severity) => ({
    severity,
    count: counts[severity],
  }))
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10)
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function formatDisplayDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    const [year, month, day] = iso.slice(0, 10).split('-')
    if (year && month && day) return `${day}/${month}/${year}`
    return iso
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
