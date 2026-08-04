import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  Link as ChakraLink,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import type { Scan } from '../../types'
import { formatDate } from '../common/PageStates'
import { RiskBadge, StatusBadge } from '../common/StatusBadge'

interface ScanHistoryTableProps {
  scans: Scan[]
}

export function ScanHistoryTable({ scans }: ScanHistoryTableProps) {
  return (
    <Card>
      <CardHeader pb={2}>
        <Heading size="sm">Recent Scans</Heading>
        <Text fontSize="sm" color="cyber.muted" mt={1}>
          Latest external attack surface assessments
        </Text>
      </CardHeader>
      <CardBody pt={0}>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Company</Th>
                <Th>Domain</Th>
                <Th>Status</Th>
                <Th>Risk Level</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {scans.map((scan) => (
                <Tr key={scan.id} _hover={{ bg: 'whiteAlpha.50' }}>
                  <Td>
                    <ChakraLink
                      as={Link}
                      to={`/scans/${scan.id}`}
                      color="brand.500"
                      fontWeight="600"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {scan.companyName}
                    </ChakraLink>
                  </Td>
                  <Td fontFamily="mono" fontSize="sm" color="cyber.muted">
                    {scan.domain}
                  </Td>
                  <Td>
                    <StatusBadge status={scan.status} />
                  </Td>
                  <Td>
                    <RiskBadge level={scan.riskLevel} />
                  </Td>
                  <Td fontFamily="mono" fontSize="sm">
                    {formatDate(scan.date)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  )
}
