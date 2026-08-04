import { Card, CardBody, CardHeader, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RiskEvolutionPoint, VulnerabilityDistribution } from '../../types'
import { riskColorMap } from '../common/StatusBadge'

const chartColors: Record<string, string> = {
  CRITICAL: '#F43F5E',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#22C55E',
  INFO: '#38BDF8',
}

interface RiskChartsProps {
  evolution: RiskEvolutionPoint[]
  distribution: VulnerabilityDistribution[]
}

export function RiskCharts({ evolution, distribution }: RiskChartsProps) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
      <Card>
        <CardHeader pb={0}>
          <Heading size="sm">Risk Evolution</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            Security score trend over recent months
          </Text>
        </CardHeader>
        <CardBody>
          {evolution.length === 0 ? (
            <Text color="cyber.muted" fontSize="sm" py={16} textAlign="center">
              No completed scans yet
            </Text>
          ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #1E293B',
                  borderRadius: 8,
                  color: '#E2E8F0',
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#00D4AA"
                strokeWidth={2}
                fill="url(#scoreFill)"
                name="Security Score"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader pb={0}>
          <Heading size="sm">Vulnerability Distribution</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            Findings grouped by severity
          </Text>
        </CardHeader>
        <CardBody>
          {distribution.every((item) => item.count === 0) ? (
            <Text color="cyber.muted" fontSize="sm" py={16} textAlign="center">
              No vulnerabilities yet
            </Text>
          ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribution}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="severity" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #1E293B',
                  borderRadius: 8,
                  color: '#E2E8F0',
                }}
              />
              <Bar dataKey="count" name="Findings" radius={[4, 4, 0, 0]}>
                {distribution.map((entry) => (
                  <Cell
                    key={entry.severity}
                    fill={chartColors[entry.severity] ?? riskColorMap[entry.severity]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </SimpleGrid>
  )
}
