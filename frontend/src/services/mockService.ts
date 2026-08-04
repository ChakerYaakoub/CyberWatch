import type {
  Company,
  CreateCompanyPayload,
  DashboardStats,
  LoginCredentials,
  RiskEvolutionPoint,
  Scan,
  VulnerabilityDistribution,
} from '../types'
import { mockCompanies } from '../mocks/companies'
import {
  mockDashboardStats,
  mockRiskEvolution,
  mockScans,
  mockVulnerabilityDistribution,
} from '../mocks/scans'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

let companiesStore: Company[] = [...mockCompanies]

export async function login(credentials: LoginCredentials): Promise<{ token: string; email: string }> {
  await delay(600)
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required')
  }
  return {
    token: 'mock-jwt-token',
    email: credentials.email,
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay()
  return {
    ...mockDashboardStats,
    monitoredCompanies: companiesStore.length,
  }
}

export async function fetchRiskEvolution(): Promise<RiskEvolutionPoint[]> {
  await delay()
  return mockRiskEvolution
}

export async function fetchVulnerabilityDistribution(): Promise<VulnerabilityDistribution[]> {
  await delay()
  return mockVulnerabilityDistribution
}

export async function fetchScans(): Promise<Scan[]> {
  await delay()
  return mockScans
}

export async function fetchScanById(id: string): Promise<Scan | undefined> {
  await delay()
  return mockScans.find((scan) => scan.id === id)
}

export async function fetchCompanies(): Promise<Company[]> {
  await delay()
  return [...companiesStore]
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  await delay(500)
  const company: Company = {
    id: String(Date.now()),
    name: payload.name,
    domain: payload.domain,
    createdAt: new Date().toISOString().slice(0, 10),
    status: 'Pending',
  }
  companiesStore = [company, ...companiesStore]
  return company
}
