import { Badge } from '@chakra-ui/react'
import type { CompanyStatus, RiskLevel, ScanStatus } from '../../types'

const riskColorMap: Record<RiskLevel, string> = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'yellow',
  LOW: 'green',
  INFO: 'blue',
}

const statusColorMap: Record<ScanStatus | CompanyStatus, string> = {
  Completed: 'green',
  Running: 'cyan',
  Pending: 'yellow',
  Failed: 'red',
  Active: 'green',
  Inactive: 'gray',
}

interface StatusBadgeProps {
  status: ScanStatus | CompanyStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge colorScheme={statusColorMap[status]} variant="subtle" px={2} py={0.5} borderRadius="md">
      {status}
    </Badge>
  )
}

interface RiskBadgeProps {
  level: RiskLevel
}

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <Badge colorScheme={riskColorMap[level]} variant="solid" px={2} py={0.5} borderRadius="md" fontFamily="mono" fontSize="xs">
      {level}
    </Badge>
  )
}

export { riskColorMap }
