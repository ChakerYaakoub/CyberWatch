import { Heading, Stack, Text, VStack } from '@chakra-ui/react'
import { OverviewCards } from '../components/dashboard/RiskScoreCard'
import { RiskCharts } from '../components/dashboard/RiskCharts'
import { ScanHistoryTable } from '../components/dashboard/ScanHistoryTable'
import { EmptyState, ErrorState, LoadingState } from '../components/common/PageStates'
import { useDashboard, useDashboardCharts } from '../hooks/useDashboard'
import { useScans } from '../hooks/useScans'
import { getErrorMessage } from '../services/api'

export function Dashboard() {
  const statsQuery = useDashboard()
  const chartsQuery = useDashboardCharts()
  const scansQuery = useScans()

  const isLoading = statsQuery.isLoading || chartsQuery.isLoading || scansQuery.isLoading
  const error = statsQuery.error ?? chartsQuery.error ?? scansQuery.error

  if (isLoading) {
    return <LoadingState label="Loading security overview…" />
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} />
  }

  if (!statsQuery.data || !chartsQuery.data || !scansQuery.data) {
    return <EmptyState title="No dashboard data" description="Create a company and start a scan to populate the overview." />
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
      <RiskCharts evolution={chartsQuery.data.evolution} distribution={chartsQuery.data.distribution} />
      {scansQuery.data.length === 0 ? (
        <EmptyState title="No scans yet" description="Start a scan from the Companies page to see history here." />
      ) : (
        <ScanHistoryTable scans={scansQuery.data} />
      )}
    </VStack>
  )
}
