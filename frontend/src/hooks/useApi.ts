import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCompany,
  fetchCompanies,
  fetchDashboardStats,
  fetchRiskEvolution,
  fetchScanById,
  fetchScans,
  fetchVulnerabilityDistribution,
} from '../services/mockService'
import type { CreateCompanyPayload } from '../types'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })
}

export function useRiskEvolution() {
  return useQuery({
    queryKey: ['risk-evolution'],
    queryFn: fetchRiskEvolution,
  })
}

export function useVulnerabilityDistribution() {
  return useQuery({
    queryKey: ['vulnerability-distribution'],
    queryFn: fetchVulnerabilityDistribution,
  })
}

export function useScans() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: fetchScans,
  })
}

export function useScan(id: string | undefined) {
  return useQuery({
    queryKey: ['scan', id],
    queryFn: () => fetchScanById(id!),
    enabled: Boolean(id),
  })
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => createCompany(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
