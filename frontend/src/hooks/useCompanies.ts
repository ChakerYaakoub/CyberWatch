import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompany,
  updateCompany,
} from '../services/company.service'
import type { CreateCompanyPayload, UpdateCompanyPayload } from '../types'

function invalidateCompanyQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['companies'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  void queryClient.invalidateQueries({ queryKey: ['scans'] })
}

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
    onSuccess: () => invalidateCompanyQueries(queryClient),
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCompanyPayload }) =>
      updateCompany(id, payload),
    onSuccess: () => invalidateCompanyQueries(queryClient),
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteCompany(id),
    onSuccess: () => invalidateCompanyQueries(queryClient),
  })
}
