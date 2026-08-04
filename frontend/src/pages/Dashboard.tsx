import { Heading, Stack, Text, VStack } from '@chakra-ui/react'
import { OverviewCards } from '../components/dashboard/RiskScoreCard'
import { RiskCharts } from '../components/dashboard/RiskCharts'
import { ScanHistoryTable } from '../components/dashboard/ScanHistoryTable'
import { LoadingState } from '../components/common/PageStates'
import {
  useDashboardStats,
  useRiskEvolution,
  useScans,
  useVulnerabilityDistribution,
} from '../hooks/useApi'

export function Dashboard() {
  const statsQuery = useDashboardStats()
  const evolutionQuery = useRiskEvolution()
  const distributionQuery = useVulnerabilityDistribution()
  const scansQuery = useScans()

  const isLoading =
    statsQuery.isLoading ||
    evolutionQuery.isLoading ||
    distributionQuery.isLoading ||
    scansQuery.isLoading

  if (isLoading) {
    return <LoadingState label="Loading security overview…" />
  }

  if (!statsQuery.data || !evolutionQuery.data || !distributionQuery.data || !scansQuery.data) {
    return <LoadingState label="Unable to load dashboard data" />
  }

  return (
    <VStack align="stretch" spacing={6}>
      <Stack spacing={1}>
        <Heading size="lg" letterSpacing="tight">
          Security Overview
        </Heading>
        <Text color="cyber.muted" fontSize="sm">
          Monitor attack surface risk across all companies under surveillance
        </Text>
      </Stack>

      <OverviewCards stats={statsQuery.data} />
      <RiskCharts evolution={evolutionQuery.data} distribution={distributionQuery.data} />
      <ScanHistoryTable scans={scansQuery.data} />
    </VStack>
  )
}
