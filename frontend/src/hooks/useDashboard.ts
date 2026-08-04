import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../services/dashboard.service'
import { getScans } from '../services/scan.service'
import { buildRiskEvolution, buildVulnerabilityDistribution } from '../utils/scanMappers'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
}

/** Chart series derived from real scans (no dedicated chart API yet). */
export function useDashboardCharts() {
  return useQuery({
    queryKey: ['scans', 'charts'],
    queryFn: async () => {
      const scans = await getScans()
      return {
        evolution: buildRiskEvolution(scans),
        distribution: buildVulnerabilityDistribution(scans),
      }
    },
  })
}
