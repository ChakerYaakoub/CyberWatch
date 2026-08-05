import type { Company, CreateCompanyPayload, UpdateCompanyPayload } from '../types'
import { api, unwrapData } from './api'

/** Company CRUD against Go `/api/companies`. */
export async function getCompanies(): Promise<Company[]> {
  return unwrapData(api.get('/companies'))
}

export async function getCompany(id: number): Promise<Company> {
  return unwrapData(api.get(`/companies/${id}`))
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  return unwrapData(api.post('/companies', payload))
}

export async function updateCompany(id: number, payload: UpdateCompanyPayload): Promise<Company> {
  return unwrapData(api.put(`/companies/${id}`, payload))
}

export async function deleteCompany(id: number): Promise<void> {
  await unwrapData(api.delete(`/companies/${id}`))
}
