/**
 * Company detail — one asset’s posture + full scan history.
 * Security score here = latest completed scan for THIS company only.
 */
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Link as ChakraLink,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  formatDate,
  LoadingState,
} from "../components/common/PageStates";
import { RiskBadge, StatusBadge } from "../components/common/StatusBadge";
import { useAuth } from "../auth/useAuth";
import { useCompany } from "../hooks/useCompanies";
import { useCreateScan, useScans } from "../hooks/useScans";
import { getErrorMessage } from "../services/api";
import { buildCompanyOverview } from "../utils/companyOverview";

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const companyId = id ? Number(id) : NaN;
  const { isAnalyst } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const companyQuery = useCompany(
    Number.isFinite(companyId) ? companyId : undefined,
  );
  const scansQuery = useScans();
  const createScan = useCreateScan();

  const isLoading = companyQuery.isLoading || scansQuery.isLoading;
  const error = companyQuery.error ?? scansQuery.error;

  if (isLoading) {
    return <LoadingState label="Loading company…" />;
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} />;
  }

  if (!companyQuery.data) {
    return (
      <VStack align="stretch" spacing={4}>
        <EmptyState
          title="Company not found"
          description="This company does not exist or was removed."
        />
        <Button
          as={Link}
          to="/companies"
          variant="outline"
          alignSelf="flex-start"
        >
          Back to companies
        </Button>
      </VStack>
    );
  }

  const overview = buildCompanyOverview(
    companyQuery.data,
    scansQuery.data ?? [],
  );
  const { company, scans, latestCompleted, hasActiveScan } = overview
  const inProgress = scans.filter(
    (s) => s.status === 'PENDING' || s.status === 'QUEUED' || s.status === 'RUNNING',
  )

  async function handleStartScan() {
    try {
      const scan = await createScan.mutateAsync(company.id);
      toast({
        title: "Scan started",
        description: `${company.name} scan is ${scan.status}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(`/scans/${scan.id}`);
    } catch (err) {
      toast({
        title: "Unable to start scan",
        description: getErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} w="full" minW={0}>
      <Flex
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <Stack spacing={1}>
          <Text fontSize="sm" color="cyber.muted">
            Company
          </Text>
          <Heading size={{ base: 'md', md: 'lg' }} letterSpacing="tight">
            {company.name}
          </Heading>
          <Text fontFamily="mono" color="brand.500" fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-all">
            {company.domain}
          </Text>
        </Stack>
        <HStack spacing={2} flexWrap="wrap">
          <Button as={Link} to="/companies" variant="outline">
            All companies
          </Button>
          {isAnalyst ? (
            <Button
              onClick={() => void handleStartScan()}
              isLoading={createScan.isPending}
              isDisabled={hasActiveScan}
              title={
                hasActiveScan ? "A scan is already in progress" : undefined
              }
            >
              Start scan
            </Button>
          ) : null}
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <Text fontSize="sm" color="cyber.muted" mb={2}>
              Scans
            </Text>
            <Text fontFamily="mono" fontSize="2xl" fontWeight="700">
              {overview.scanCount}
            </Text>
            <Text fontSize="xs" color="cyber.muted" mt={1}>
              Total runs for this domain
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text fontSize="sm" color="cyber.muted" mb={2}>
              Latest status
            </Text>
            {overview.latestScan ? (
              <StatusBadge status={overview.latestScan.status} />
            ) : (
              <Text fontSize="sm" color="cyber.muted">
                Never scanned
              </Text>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text fontSize="sm" color="cyber.muted" mb={2}>
              Latest security score
            </Text>
            {latestCompleted ? (
              <>
                <HStack justify="space-between" mb={2}>
                  <Text fontFamily="mono" fontSize="2xl" fontWeight="700">
                    {latestCompleted.securityScore}
                    <Text as="span" fontSize="md" color="cyber.muted">
                      /100
                    </Text>
                  </Text>
                  <RiskBadge level={latestCompleted.riskLevel} />
                </HStack>
                <Progress
                  value={latestCompleted.securityScore}
                  size="sm"
                  borderRadius="full"
                  colorScheme={
                    latestCompleted.securityScore >= 70
                      ? "green"
                      : latestCompleted.securityScore >= 50
                        ? "yellow"
                        : "red"
                  }
                  bg="cyber.border"
                />
                <Text fontSize="xs" color="cyber.muted" mt={2}>
                  From scan #{latestCompleted.id} · this company only
                </Text>
              </>
            ) : (
              <Text fontSize="sm" color="cyber.muted">
                No completed scan yet
              </Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {inProgress.length > 0 ? (
        <Card>
          <CardHeader pb={2}>
            <Heading size="sm">Scans in progress</Heading>
            <Text fontSize="sm" color="cyber.muted" mt={1}>
              Live jobs for {company.domain}
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <TableContainer overflowX="auto" maxW="100%">
              <Table variant="simple" size="sm" minW={{ base: '360px', md: 'auto' }}>
                <Thead>
                  <Tr>
                    <Th>Scan</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {inProgress.map((scan) => (
                    <Tr key={scan.id} _hover={{ bg: 'blackAlpha.50' }}>
                      <Td>
                        <ChakraLink
                          as={Link}
                          to={`/scans/${scan.id}`}
                          color="brand.500"
                          fontWeight="600"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          #{scan.id}
                        </ChakraLink>
                      </Td>
                      <Td>
                        <StatusBadge status={scan.status} />
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
      ) : null}

      <Card>
        <CardHeader pb={2}>
          <Heading size="sm">Scan history</Heading>
          <Text fontSize="sm" color="cyber.muted" mt={1}>
            All scans for {company.domain}
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          {scans.length === 0 ? (
            <EmptyState
              title="No scans yet"
              description="Start a scan to assess this company’s public attack surface."
            />
          ) : (
            <TableContainer overflowX="auto" maxW="100%">
              <Table variant="simple" size="sm" minW={{ base: '480px', md: 'auto' }}>
                <Thead>
                  <Tr>
                    <Th>Scan</Th>
                    <Th>Status</Th>
                    <Th>Risk</Th>
                    <Th>Score</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {scans.map((scan) => (
                    <Tr key={scan.id} _hover={{ bg: "blackAlpha.50" }}>
                      <Td>
                        <ChakraLink
                          as={Link}
                          to={`/scans/${scan.id}`}
                          color="brand.500"
                          fontWeight="600"
                          _hover={{ textDecoration: "underline" }}
                        >
                          #{scan.id}
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
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}
