import type { Company, CreateCompanyPayload } from '../types'
import { api, unwrapData } from './api'

export async function getCompanies(): Promise<Company[]> {
  return unwrapData(api.get('/companies'))
}

export async function getCompany(id: number): Promise<Company> {
  return unwrapData(api.get(`/companies/${id}`))
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  return unwrapData(api.post('/companies', payload))
}
