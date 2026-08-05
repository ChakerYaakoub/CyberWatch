import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createScan, getScan, getScans } from '../services/scan.service'
import { toScanListItem } from '../utils/scanMappers'

export function useScans() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: getScans,
    select: (scans) => scans.map(toScanListItem),
  })
}

export function useScan(id: string | undefined) {
  const numericId = id ? Number(id) : NaN

  return useQuery({
    queryKey: ['scans', numericId],
    queryFn: () => getScan(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
    select: toScanListItem,
    // Live progress without WebSockets: poll while the worker is still running.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'PENDING' || status === 'QUEUED' || status === 'RUNNING') {
        return 3000
      }
      return false
    },
  })
}

export function useCreateScan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId: number) => createScan({ companyId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['scans'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
