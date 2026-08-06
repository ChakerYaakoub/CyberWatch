/**
 * Home = operations overview across companies.
 * Per-company / per-scan security scores live on Company detail and Scan detail — not here.
 */
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  formatDate,
  LoadingState,
} from "../components/common/PageStates";
import { RiskBadge, StatusBadge } from "../components/common/StatusBadge";
import { RiskCharts } from "../components/dashboard/RiskCharts";
import { useCompanies } from "../hooks/useCompanies";
import { useDashboard, useDashboardCharts } from "../hooks/useDashboard";
import { useScans } from "../hooks/useScans";
import { getErrorMessage } from "../services/api";
import type { ScanListItem } from "../types";
import {
  attentionQueue,
  buildCompanyOverviews,
  recentScans,
} from "../utils/companyOverview";

function OpsStat({
  label,
  value,
  hint,
  accent = "brand.500",
}: {
  label: string;
  value: number | string;
  hint: string;
  accent?: string;
}) {
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
          <StatHelpText color="cyber.muted" mb={0}>
            {hint}
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
}

function ScanRows({
  scans,
  showCompany,
}: {
  scans: ScanListItem[];
  showCompany: boolean;
}) {
  return (
    <TableContainer overflowX="auto" maxW="100%">
      <Table variant="simple" size="sm" minW={{ base: "520px", md: "auto" }}>
        <Thead>
          <Tr>
            {showCompany ? <Th>Company</Th> : null}
            <Th>Domain</Th>
            <Th>Status</Th>
            <Th>Risk</Th>
            <Th>Score</Th>
            <Th>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {scans.map((scan) => (
            <Tr key={scan.id} _hover={{ bg: "blackAlpha.50" }}>
              {showCompany ? (
                <Td>
                  <ChakraLink
                    as={Link}
                    to={`/companies/${scan.companyId}`}
                    color="brand.500"
                    fontWeight="600"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {scan.companyName}
                  </ChakraLink>
                </Td>
              ) : null}
              <Td>
                <ChakraLink
                  as={Link}
                  to={`/scans/${scan.id}`}
                  fontFamily="mono"
                  fontSize="sm"
                  color="cyber.muted"
                  _hover={{ color: "brand.500" }}
                >
                  {scan.domain}
                </ChakraLink>
              </Td>
              <Td>
                <StatusBadge status={scan.status} />
              </Td>
              <Td>
                <RiskBadge level={scan.riskLevel} />
              </Td>
              <Td fontFamily="mono" fontSize="sm">
                {scan.status === "COMPLETED"
                  ? `${scan.securityScore}/100`
                  : "—"}
              </Td>
              <Td fontFamily="mono" fontSize="sm">
                {formatDate(scan.date)}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

export function Dashboard() {
  const statsQuery = useDashboard();
  const chartsQuery = useDashboardCharts();
  const companiesQuery = useCompanies();
  const scansQuery = useScans();

  const isLoading =
    statsQuery.isLoading ||
    chartsQuery.isLoading ||
    companiesQuery.isLoading ||
    scansQuery.isLoading;
  const error =
    statsQuery.error ??
    chartsQuery.error ??
    companiesQuery.error ??
    scansQuery.error;

  if (isLoading) {
    return <LoadingState label="Loading operations overview…" />;
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} />;
  }

  const companies = companiesQuery.data ?? [];
  const scans = scansQuery.data ?? [];
  const overviews = buildCompanyOverviews(companies, scans);
  const attention = attentionQueue(overviews);
  const recent = recentScans(scans);
  const neverScanned = overviews.filter((o) => o.neverScanned).length;
  const criticalFindings = statsQuery.data?.criticalVulnerabilities ?? 0;
  const averageScore = statsQuery.data?.securityScore ?? 0;
  const charts = chartsQuery.data ?? { evolution: [], distribution: [] };

  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} w="full" minW={0}>
      <Stack spacing={1}>
        <Heading size={{ base: "md", md: "lg" }} letterSpacing="tight">
          Operations
        </Heading>
        <Text color="cyber.muted" fontSize="sm">
          Attention queue, activity, and trends. Per-company scores stay on each
          company page.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
        <OpsStat
          label="Companies"
          value={companies.length}
          hint="Assets under watch"
          accent="brand.500"
        />
        <OpsStat
          label="Never scanned"
          value={neverScanned}
          hint="No scan history yet"
          accent={neverScanned > 0 ? "orange.400" : "brand.500"}
        />
        <OpsStat
          label="Critical findings"
          value={criticalFindings}
          hint="Total CRITICAL rows in the database"
          accent={criticalFindings > 0 ? "red.400" : "brand.500"}
        />
      </SimpleGrid>

      <RiskCharts
        evolution={charts.evolution}
        distribution={charts.distribution}
        averageScore={averageScore}
      />

      <Card>
        <CardHeader pb={2}>
          <Heading size="sm">Needs attention</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            Never scanned, failed latest run, or last completed risk is HIGH /
            CRITICAL
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          {attention.length === 0 ? (
            <Box py={4}>
              <Text fontSize="sm" color="cyber.muted">
                Nothing urgent — no high-risk or unscanned companies right now.
              </Text>
            </Box>
          ) : (
            <TableContainer overflowX="auto" maxW="100%">
              <Table
                variant="simple"
                size="sm"
                minW={{ base: "480px", md: "auto" }}
              >
                <Thead>
                  <Tr>
                    <Th>Company</Th>
                    <Th>Domain</Th>
                    <Th>Why</Th>
                    <Th>Latest score</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {attention.map((item) => (
                    <Tr key={item.company.id} _hover={{ bg: "blackAlpha.50" }}>
                      <Td>
                        <ChakraLink
                          as={Link}
                          to={`/companies/${item.company.id}`}
                          color="brand.500"
                          fontWeight="600"
                          _hover={{ textDecoration: "underline" }}
                        >
                          {item.company.name}
                        </ChakraLink>
                      </Td>
                      <Td fontFamily="mono" fontSize="sm" color="cyber.muted">
                        {item.company.domain}
                      </Td>
                      <Td fontSize="sm">{item.attentionReason}</Td>
                      <Td>
                        {item.latestCompleted ? (
                          <HStack spacing={2}>
                            <Text fontFamily="mono" fontSize="sm">
                              {item.latestCompleted.securityScore}/100
                            </Text>
                            <RiskBadge level={item.latestCompleted.riskLevel} />
                          </HStack>
                        ) : (
                          <Text fontSize="sm" color="cyber.muted">
                            —
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader pb={2}>
          <Heading size="sm">Recent activity</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            Latest scan runs across all companies
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          {recent.length === 0 ? (
            <EmptyState
              title="No scans yet"
              description="Add a company and start a scan to see activity here."
            />
          ) : (
            <ScanRows scans={recent} showCompany />
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}
