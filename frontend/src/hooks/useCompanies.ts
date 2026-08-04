import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCompany, getCompanies, getCompany } from '../services/company.service'
import type { CreateCompanyPayload } from '../types'

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })
}

export function useCompany(id: number | undefined) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => getCompany(id!),
    enabled: typeof id === 'number' && id > 0,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => createCompany(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
