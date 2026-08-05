import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
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
  CRITICAL: '#E30613',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#80B942',
  INFO: '#0284C7',
}

const BRAND = '#80B942'

interface RiskChartsProps {
  evolution: RiskEvolutionPoint[]
  distribution: VulnerabilityDistribution[]
}

export function RiskCharts({ evolution, distribution }: RiskChartsProps) {
  const grid = useColorModeValue('#E5E5E5', '#2A517A')
  const muted = useColorModeValue('#5A6570', '#9BB0C9')
  const panel = useColorModeValue('#FFFFFF', '#1B334D')
  const text = useColorModeValue('#333333', '#E8EEF5')

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
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={muted} fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke={muted} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: panel,
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    color: text,
                    boxShadow: '0 4px 12px rgba(11, 26, 46, 0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={BRAND}
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
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="severity" stroke={muted} fontSize={11} tickLine={false} />
                <YAxis stroke={muted} fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: panel,
                    border: `1px solid ${grid}`,
                    borderRadius: 8,
                    color: text,
                    boxShadow: '0 4px 12px rgba(11, 26, 46, 0.08)',
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
