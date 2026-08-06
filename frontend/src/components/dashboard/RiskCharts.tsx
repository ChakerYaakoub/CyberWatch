import type { ReactElement, ReactNode } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useBreakpointValue,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  RiskEvolutionPoint,
  VulnerabilityDistribution,
} from "../../types";
import { riskColorMap } from "../common/StatusBadge";

const chartColors: Record<string, string> = {
  CRITICAL: "#E30613",
  HIGH: "#EA580C",
  MEDIUM: "#D97706",
  LOW: "#80B942",
  INFO: "#0284C7",
};

const BRAND = "#80B942";

interface RiskChartsProps {
  evolution: RiskEvolutionPoint[];
  distribution: VulnerabilityDistribution[];
  averageScore: number;
}

/** Ensures Recharts gets a real width on phone (flex/grid children often start at 0). */
function ChartFrame({
  children,
  height,
}: {
  children: ReactElement;
  height: number;
}) {
  return (
    <Box w="100%" minW={0} maxW="100%" h={`${height}px`} overflow="hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {children}
      </ResponsiveContainer>
    </Box>
  );
}

/** Theme-aware tooltip — Recharts default stays white in dark mode. */
function ChartTooltipBox({
  children,
  panel,
  border,
}: {
  children: ReactNode;
  panel: string;
  border: string;
}) {
  return (
    <Box
      bg={panel}
      borderWidth="1px"
      borderColor={border}
      borderRadius="md"
      px={3}
      py={2}
      boxShadow="md"
      maxW="220px"
      color="cyber.text"
      // Prevent transparent Recharts parent from flashing white underneath
      sx={{ backgroundColor: `${panel} !important` }}
    >
      {children}
    </Box>
  );
}

export function RiskCharts({
  evolution,
  distribution,
  averageScore,
}: RiskChartsProps) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const grid = useColorModeValue("#E5E5E5", "#2A517A");
  const muted = useColorModeValue("#5A6570", "#9BB0C9");
  const panel = useColorModeValue("#FFFFFF", "#1B334D");

  // Kill Recharts' default white tooltip chrome in dark mode
  const tooltipShell = {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
    padding: 0,
  } as const;
  const barHoverCursor = {
    fill: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
  };

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const chartHeight = useBreakpointValue({ base: 240, md: 280 }) ?? 240;
  const circleSize =
    useBreakpointValue({ base: "120px", md: "160px" }) ?? "120px";
  const pieInner = useBreakpointValue({ base: 42, md: 58 }) ?? 42;
  const pieOuter = useBreakpointValue({ base: 70, md: 90 }) ?? 70;
  const tickFont = isMobile ? 11 : 12;
  // Keep left margin positive so Y-axis numbers are never clipped
  const chartMargin = isMobile
    ? { top: 12, right: 8, left: 4, bottom: 8 }
    : { top: 12, right: 16, left: 8, bottom: 8 };
  const yAxisWidth = isMobile ? 36 : 44;

  const scoreColor =
    averageScore >= 80
      ? "brand.500"
      : averageScore >= 60
        ? "yellow.400"
        : averageScore >= 40
          ? "orange.400"
          : "red.400";

  const pieData = distribution.filter((d) => d.count > 0);
  const totalFindings = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <SimpleGrid
      columns={{ base: 1, lg: 2 }}
      spacing={{ base: 3, md: 4 }}
      w="full"
      minW={0}
    >
      <Card overflow="visible" minW={0}>
        <CardHeader pb={0} px={{ base: 3, md: 5 }}>
          <Heading size="sm">Risk evolution</Heading>
          <Text fontSize={{ base: "xs", md: "sm" }} color="cyber.muted" mt={1}>
            Completed scan scores over time
          </Text>
        </CardHeader>
        <CardBody px={{ base: 2, md: 5 }} overflow="visible">
          {evolution.length === 0 ? (
            <Text color="cyber.muted" fontSize="sm" py={12} textAlign="center">
              No completed scans yet
            </Text>
          ) : (
            <ChartFrame height={chartHeight}>
              <AreaChart data={evolution} margin={chartMargin}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke={muted}
                  fontSize={tickFont}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={isMobile ? 28 : 40}
                  angle={isMobile ? -30 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 52 : 32}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={muted}
                  fontSize={tickFont}
                  tickLine={false}
                  width={yAxisWidth}
                  tickMargin={4}
                />
                <Tooltip
                  cursor={false}
                  wrapperStyle={tooltipShell}
                  contentStyle={tooltipShell}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const first = payload[0];
                    if (!first?.payload) return null;
                    const point = first.payload as RiskEvolutionPoint;
                    return (
                      <ChartTooltipBox panel={panel} border={grid}>
                        <Text fontWeight="600" fontSize="sm">
                          {point.companyName}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="cyber.muted"
                          fontFamily="mono"
                        >
                          {point.domain}
                        </Text>
                        <Text fontSize="sm" mt={1} fontFamily="mono">
                          Score: {point.score}/100
                        </Text>
                        <Text fontSize="xs" color="cyber.muted">
                          {point.date} · scan #{point.scanId}
                        </Text>
                      </ChartTooltipBox>
                    );
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
            </ChartFrame>
          )}
        </CardBody>
      </Card>

      <Card overflow="visible" minW={0}>
        <CardHeader pb={0} px={{ base: 3, md: 5 }}>
          <Heading size="sm">Vulnerability distribution</Heading>
          <Text fontSize={{ base: "xs", md: "sm" }} color="cyber.muted" mt={1}>
            Findings grouped by severity
          </Text>
        </CardHeader>
        <CardBody px={{ base: 2, md: 5 }} overflow="visible">
          {distribution.every((item) => item.count === 0) ? (
            <Text color="cyber.muted" fontSize="sm" py={12} textAlign="center">
              No vulnerabilities yet
            </Text>
          ) : (
            <ChartFrame height={chartHeight}>
              <BarChart data={distribution} margin={chartMargin}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="severity"
                  stroke={muted}
                  fontSize={tickFont}
                  tickLine={false}
                  interval={0}
                  angle={isMobile ? -20 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 52 : 32}
                />
                <YAxis
                  stroke={muted}
                  fontSize={tickFont}
                  tickLine={false}
                  allowDecimals={false}
                  width={yAxisWidth}
                  tickMargin={4}
                />
                <Tooltip
                  cursor={barHoverCursor}
                  wrapperStyle={tooltipShell}
                  contentStyle={tooltipShell}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const first = payload[0];
                    if (!first) return null;
                    return (
                      <ChartTooltipBox panel={panel} border={grid}>
                        <Text fontWeight="600" fontSize="sm" color="cyber.text">
                          {String(label)}
                        </Text>
                        <Text
                          fontSize="sm"
                          fontFamily="mono"
                          mt={1}
                          color="cyber.text"
                        >
                          {Number(first.value)} findings
                        </Text>
                      </ChartTooltipBox>
                    );
                  }}
                />
                <Bar dataKey="count" name="Findings" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry) => (
                    <Cell
                      key={entry.severity}
                      fill={
                        chartColors[entry.severity] ??
                        riskColorMap[entry.severity]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
          )}
        </CardBody>
      </Card>

      <Card overflow="hidden" minW={0}>
        <CardHeader pb={0} px={{ base: 3, md: 5 }}>
          <Heading size="sm">Average security score</Heading>
          <Text fontSize={{ base: "xs", md: "sm" }} color="cyber.muted" mt={1}>
            Mean of all completed scans (not a single company)
          </Text>
        </CardHeader>
        <CardBody px={{ base: 3, md: 5 }}>
          <Flex
            align="center"
            justify="center"
            py={{ base: 3, md: 4 }}
            minH={{ base: "160px", md: "220px" }}
          >
            <CircularProgress
              value={averageScore}
              size={circleSize}
              thickness="10px"
              color={scoreColor}
              trackColor="cyber.border"
            >
              <CircularProgressLabel>
                <Text
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="700"
                  fontFamily="mono"
                  lineHeight="1"
                >
                  {averageScore}
                </Text>
                <Text fontSize="xs" color="cyber.muted" mt={1}>
                  /100
                </Text>
              </CircularProgressLabel>
            </CircularProgress>
          </Flex>
        </CardBody>
      </Card>

      <Card overflow="hidden" minW={0}>
        <CardHeader pb={0} px={{ base: 3, md: 5 }}>
          <Heading size="sm">Findings by severity</Heading>
          <Text fontSize={{ base: "xs", md: "sm" }} color="cyber.muted" mt={1}>
            All stored findings across scans
          </Text>
        </CardHeader>
        <CardBody px={{ base: 2, md: 5 }}>
          {totalFindings === 0 ? (
            <Text color="cyber.muted" fontSize="sm" py={12} textAlign="center">
              No vulnerabilities yet
            </Text>
          ) : (
            <ChartFrame height={chartHeight}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  innerRadius={pieInner}
                  outerRadius={pieOuter}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.severity}
                      fill={
                        chartColors[entry.severity] ??
                        riskColorMap[entry.severity]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  wrapperStyle={tooltipShell}
                  contentStyle={tooltipShell}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const first = payload[0];
                    if (!first) return null;
                    return (
                      <ChartTooltipBox panel={panel} border={grid}>
                        <Text fontWeight="600" fontSize="sm">
                          {String(first.name)}
                        </Text>
                        <Text fontSize="sm" fontFamily="mono" mt={1}>
                          {Number(first.value)} findings
                        </Text>
                      </ChartTooltipBox>
                    );
                  }}
                />
              </PieChart>
            </ChartFrame>
          )}
        </CardBody>
      </Card>
    </SimpleGrid>
  );
}
