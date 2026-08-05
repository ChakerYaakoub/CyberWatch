import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, formatDate, LoadingState } from '../components/common/PageStates'
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge'
import { useScan } from '../hooks/useScans'
import { getErrorMessage } from '../services/api'
import type { FindingView, RiskLevel } from '../types'

const severityOrder: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

function FindingItem({ finding }: { finding: FindingView }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="cyber.border"
      borderRadius="md"
      bg="cyber.panelAlt"
      p={4}
    >
      <HStack justify="space-between" align="start" mb={2}>
        <RiskBadge level={finding.severity} />
        <Text fontSize="xs" color="cyber.muted" fontFamily="mono">
          {finding.category}
        </Text>
      </HStack>
      <Text fontWeight="600" mb={1}>
        {finding.title}
      </Text>
      <Text fontSize="sm" color="cyber.muted">
        {finding.description}
      </Text>
    </Box>
  )
}

export function ScanDetails() {
  const { id } = useParams<{ id: string }>()
  const { data: scan, isLoading, error, isError } = useScan(id)

  if (isLoading) {
    return <LoadingState label="Loading scan analysis…" />
  }

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} />
  }

  if (!scan) {
    return (
      <VStack align="stretch" spacing={4}>
        <EmptyState title="Scan not found" description="This scan does not exist or was removed." />
        <Button as={Link} to="/" variant="outline" alignSelf="flex-start">
          Back to Dashboard
        </Button>
      </VStack>
    )
  }

  const sortedFindings = [...scan.findings].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  )
  const inProgress = scan.status === 'PENDING' || scan.status === 'QUEUED' || scan.status === 'RUNNING'

  return (
    <VStack align="stretch" spacing={6}>
      {inProgress ? (
        <Box
          borderWidth="1px"
          borderColor="brand.500"
          bg="brand.50"
          _dark={{ bg: 'whiteAlpha.100', borderColor: 'brand.400' }}
          borderRadius="md"
          px={4}
          py={3}
        >
          <Text fontSize="sm" fontWeight="600">
            Scan {scan.status.toLowerCase()}…
          </Text>
          <Text fontSize="sm" color="cyber.muted">
            Results refresh automatically every few seconds until the worker finishes.
          </Text>
        </Box>
      ) : null}

      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={3}
      >
        <Stack spacing={1}>
          <Text fontSize="sm" color="cyber.muted">
            Scan Analysis
          </Text>
          <Heading size="lg" letterSpacing="tight">
            {scan.companyName}
          </Heading>
          <Text fontFamily="mono" color="brand.500">
            {scan.domain}
          </Text>
        </Stack>
        <Button as={Link} to="/" variant="outline">
          Back to Dashboard
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <Text fontSize="sm" color="cyber.muted" mb={2}>
              Domain
            </Text>
            <Text fontFamily="mono" fontWeight="600">
              {scan.domain}
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text fontSize="sm" color="cyber.muted" mb={2}>
              Status
            </Text>
            <StatusBadge status={scan.status} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text fontSize="sm" color="cyber.muted" mb={2}>
              Security Score
            </Text>
            <HStack justify="space-between" mb={2}>
              <Text fontFamily="mono" fontSize="2xl" fontWeight="700">
                {scan.securityScore}
                <Text as="span" fontSize="md" color="cyber.muted">
                  /100
                </Text>
              </Text>
              <RiskBadge level={scan.riskLevel} />
            </HStack>
            <Progress
              value={scan.securityScore}
              size="sm"
              borderRadius="full"
              colorScheme={
                scan.securityScore >= 70 ? 'green' : scan.securityScore >= 50 ? 'yellow' : 'red'
              }
              bg="cyber.border"
            />
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardHeader pb={0}>
          <Heading size="sm">Findings</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            Detected on {formatDate(scan.date)} · {sortedFindings.length} issue
            {sortedFindings.length === 1 ? '' : 's'}
          </Text>
        </CardHeader>
        <CardBody>
          <Tabs variant="enclosed" colorScheme="brand">
            <TabList>
              <Tab>All ({sortedFindings.length})</Tab>
              {severityOrder.map((level) => {
                const count = sortedFindings.filter((f) => f.severity === level).length
                if (count === 0) return null
                return (
                  <Tab key={level}>
                    {level} ({count})
                  </Tab>
                )
              })}
            </TabList>
            <TabPanels>
              <TabPanel>
                {sortedFindings.length === 0 ? (
                  <EmptyState
                    title="No findings"
                    description="This scan completed without detectable issues, or is still in progress."
                  />
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {sortedFindings.map((finding) => (
                      <FindingItem key={finding.id} finding={finding} />
                    ))}
                  </VStack>
                )}
              </TabPanel>
              {severityOrder.map((level) => {
                const items = sortedFindings.filter((f) => f.severity === level)
                if (items.length === 0) return null
                return (
                  <TabPanel key={level}>
                    <VStack align="stretch" spacing={3}>
                      {items.map((finding) => (
                        <FindingItem key={finding.id} finding={finding} />
                      ))}
                    </VStack>
                  </TabPanel>
                )
              })}
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </VStack>
  )
}
