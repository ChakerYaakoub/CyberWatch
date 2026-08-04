import type {
  DashboardStats,
  RiskEvolutionPoint,
  Scan,
  VulnerabilityDistribution,
} from '../types'

export const mockDashboardStats: DashboardStats = {
  securityScore: 78,
  activeScans: 5,
  criticalVulnerabilities: 3,
  monitoredCompanies: 12,
}

export const mockRiskEvolution: RiskEvolutionPoint[] = [
  { date: 'Feb', score: 62 },
  { date: 'Mar', score: 65 },
  { date: 'Apr', score: 70 },
  { date: 'May', score: 68 },
  { date: 'Jun', score: 74 },
  { date: 'Jul', score: 76 },
  { date: 'Aug', score: 78 },
]

export const mockVulnerabilityDistribution: VulnerabilityDistribution[] = [
  { severity: 'CRITICAL', count: 3 },
  { severity: 'HIGH', count: 8 },
  { severity: 'MEDIUM', count: 15 },
  { severity: 'LOW', count: 22 },
  { severity: 'INFO', count: 11 },
]

export const mockScans: Scan[] = [
  {
    id: 'scan-1',
    companyId: '1',
    companyName: 'Demo Corporation',
    domain: 'demo.com',
    status: 'Completed',
    riskLevel: 'HIGH',
    securityScore: 72,
    date: '2026-08-04',
    findings: [
      {
        id: 'f1',
        severity: 'HIGH',
        title: 'Missing security headers',
        description:
          'Critical HTTP security headers (CSP, HSTS) are not present on the public web server.',
        category: 'HTTP Security',
      },
      {
        id: 'f2',
        severity: 'MEDIUM',
        title: 'Exposed service detected',
        description:
          'SSH service (port 22) is publicly reachable and may increase the attack surface.',
        category: 'Exposure',
      },
      {
        id: 'f3',
        severity: 'LOW',
        title: 'Technology information exposed',
        description:
          'Server headers reveal Nginx and React versions that aid reconnaissance.',
        category: 'Technology Detection',
      },
    ],
  },
  {
    id: 'scan-2',
    companyId: '2',
    companyName: 'SecureTech SAS',
    domain: 'securetech.fr',
    status: 'Completed',
    riskLevel: 'MEDIUM',
    securityScore: 81,
    date: '2026-08-03',
    findings: [
      {
        id: 'f4',
        severity: 'MEDIUM',
        title: 'Missing Content-Security-Policy',
        description: 'CSP header is absent, increasing XSS risk.',
        category: 'HTTP Security',
      },
      {
        id: 'f5',
        severity: 'LOW',
        title: 'Open HTTPS service',
        description: 'Port 443 is open and serving HTTPS as expected.',
        category: 'Exposure',
      },
    ],
  },
  {
    id: 'scan-3',
    companyId: '3',
    companyName: 'NovaCloud Inc',
    domain: 'novacloud.io',
    status: 'Running',
    riskLevel: 'MEDIUM',
    securityScore: 0,
    date: '2026-08-04',
    findings: [],
  },
  {
    id: 'scan-4',
    companyId: '4',
    companyName: 'FinGuard Solutions',
    domain: 'finguard.com',
    status: 'Completed',
    riskLevel: 'CRITICAL',
    securityScore: 48,
    date: '2026-08-02',
    findings: [
      {
        id: 'f6',
        severity: 'CRITICAL',
        title: 'Database port exposed',
        description: 'PostgreSQL port 5432 is publicly accessible.',
        category: 'Exposure',
      },
      {
        id: 'f7',
        severity: 'HIGH',
        title: 'Missing HSTS header',
        description: 'Strict-Transport-Security is not configured.',
        category: 'HTTP Security',
      },
      {
        id: 'f8',
        severity: 'MEDIUM',
        title: 'Admin panel discovered',
        description: 'Public /admin path returns a login form.',
        category: 'Exposure',
      },
    ],
  },
  {
    id: 'scan-5',
    companyId: '6',
    companyName: 'CyberEdge GmbH',
    domain: 'cyberedge.de',
    status: 'Completed',
    riskLevel: 'LOW',
    securityScore: 91,
    date: '2026-08-01',
    findings: [
      {
        id: 'f9',
        severity: 'LOW',
        title: 'Server banner disclosure',
        description: 'HTTP Server header discloses software stack.',
        category: 'Technology Detection',
      },
    ],
  },
  {
    id: 'scan-6',
    companyId: '9',
    companyName: 'PulsePay Systems',
    domain: 'pulsepay.io',
    status: 'Failed',
    riskLevel: 'INFO',
    securityScore: 0,
    date: '2026-07-30',
    findings: [],
  },
  {
    id: 'scan-7',
    companyId: '8',
    companyName: 'Horizon Health',
    domain: 'horizonhealth.org',
    status: 'Pending',
    riskLevel: 'INFO',
    securityScore: 0,
    date: '2026-08-04',
    findings: [],
  },
  {
    id: 'scan-8',
    companyId: '10',
    companyName: 'NorthStar Logistics',
    domain: 'northstar-log.com',
    status: 'Completed',
    riskLevel: 'HIGH',
    securityScore: 64,
    date: '2026-07-28',
    findings: [
      {
        id: 'f10',
        severity: 'HIGH',
        title: 'Missing X-Frame-Options',
        description: 'Clickjacking protection header is not set.',
        category: 'HTTP Security',
      },
      {
        id: 'f11',
        severity: 'MEDIUM',
        title: 'RDP service exposed',
        description: 'Port 3389 appears open from the public internet.',
        category: 'Exposure',
      },
    ],
  },
]
