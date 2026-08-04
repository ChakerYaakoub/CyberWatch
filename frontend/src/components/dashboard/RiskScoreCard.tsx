import {
  Box,
  Card,
  CardBody,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react'
import type { DashboardStats } from '../../types'
import { VulnerabilityCard } from './VulnerabilityCard'

interface RiskScoreCardProps {
  score: number
}

export function RiskScoreCard({ score }: RiskScoreCardProps) {
  const color =
    score >= 80 ? 'brand.500' : score >= 60 ? 'yellow.400' : score >= 40 ? 'orange.400' : 'red.400'

  return (
    <Card h="full">
      <CardBody>
        <Flex align="center" justify="space-between" gap={4}>
          <Box>
            <Text fontSize="sm" color="cyber.muted" mb={1}>
              Security Score
            </Text>
            <Text fontSize="3xl" fontWeight="700" fontFamily="mono" lineHeight="1">
              {score}
              <Text as="span" fontSize="lg" color="cyber.muted" fontWeight="500">
                /100
              </Text>
            </Text>
            <Text fontSize="xs" color="cyber.muted" mt={2}>
              Aggregate risk posture
            </Text>
          </Box>
          <CircularProgress value={score} size="88px" thickness="8px" color={color} trackColor="cyber.border">
            <CircularProgressLabel fontSize="sm" fontWeight="700" fontFamily="mono">
              {score}%
            </CircularProgressLabel>
          </CircularProgress>
        </Flex>
      </CardBody>
    </Card>
  )
}

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  accent?: string
}

function StatCard({ label, value, hint, accent = 'brand.500' }: StatCardProps) {
  return (
    <Card h="full">
      <CardBody>
        <Stat>
          <StatLabel color="cyber.muted" fontSize="sm">
            {label}
          </StatLabel>
          <StatNumber fontFamily="mono" fontSize="3xl" color={accent}>
            {value}
          </StatNumber>
          {hint ? <StatHelpText color="cyber.muted" mb={0}>{hint}</StatHelpText> : null}
        </Stat>
      </CardBody>
    </Card>
  )
}

interface OverviewCardsProps {
  stats: DashboardStats
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
      <RiskScoreCard score={stats.securityScore} />
      <StatCard label="Active Scans" value={stats.activeScans} hint="Currently in progress" accent="cyan.300" />
      <VulnerabilityCard count={stats.criticalVulnerabilities} />
      <StatCard
        label="Monitored Companies"
        value={stats.monitoredCompanies}
        hint="Assets under watch"
        accent="brand.500"
      />
    </SimpleGrid>
  )
}
