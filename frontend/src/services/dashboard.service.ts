import type { DashboardStats } from '../types'
import { api, unwrapData } from './api'

export async function getDashboard(): Promise<DashboardStats> {
  return unwrapData(api.get('/dashboard'))
}
