import {
  Box,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'

const whatWeScan = [
  {
    title: 'DNS',
    detail:
      'Resolve the public domain (A / CNAME / NS). Detect NXDOMAIN or broken DNS before scoring the rest.',
  },
  {
    title: 'HTTP / HTTPS',
    detail:
      'Probe reachability, redirects, status, timing, and TLS issues from the outside — HTTPS first, then HTTP.',
  },
  {
    title: 'Security headers',
    detail:
      'Check for HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
  },
  {
    title: 'Technologies',
    detail:
      'Fingerprint common stacks from headers and HTML (e.g. Nginx, WordPress, React) — info only, not exploits.',
  },
  {
    title: 'Common ports',
    detail:
      'Short TCP checks on ports like 80, 443, 22, 21, 3306, 5432, 6379, 5672. Risky services need a banner to avoid false positives.',
  },
  {
    title: 'Risk score',
    detail:
      'Combine findings into a 0–100 score (higher = safer) and a risk level for that scan.',
  },
]

const stack = [
  { name: 'React', role: 'UI — companies, scans, dashboard' },
  { name: 'Go API', role: 'REST, JWT / RBAC, job dispatch' },
  { name: 'PostgreSQL', role: 'Companies, scans, findings' },
  { name: 'RabbitMQ', role: 'Async scan jobs' },
  { name: 'Python worker', role: 'Passive external scanners' },
  { name: 'Keycloak', role: 'Login & roles (Cloud-IAM)' },
]

const roles = [
  {
    name: 'ADMIN',
    detail: 'Manage companies (create, edit, delete), start scans, view everything.',
  },
  {
    name: 'ANALYST',
    detail: 'View dashboard and companies, start scans. Cannot change company records.',
  },
]

export function About() {
  return (
    <VStack align="stretch" spacing={{ base: 6, md: 8 }} w="full" minW={0}>
      <Stack spacing={2}>
        <Heading size={{ base: 'md', md: 'lg' }} letterSpacing="tight">
          About CyberWatch
        </Heading>
        <Text color="cyber.muted" fontSize="md" lineHeight="1.7" maxW="4xl">
          CyberWatch is an{' '}
          <Text as="span" color="cyber.text" fontWeight="600">
            External Attack Surface Monitoring
          </Text>{' '}
          platform. You register companies by public domain; we run{' '}
          <Text as="span" color="cyber.text" fontWeight="600">
            passive
          </Text>{' '}
          checks from the outside (no login to the target, no exploit payloads), store findings in
          PostgreSQL, and show a risk score. Identity stays in Keycloak — this app never stores
          passwords.
        </Text>
      </Stack>

      <Box>
        <Heading size="sm" mb={2}>
          What we really do
        </Heading>
        <Text color="cyber.muted" fontSize="sm" mb={4} maxW="4xl">
          For each scan we look at the company’s public hostname only. We observe what the internet
          already exposes — DNS, web reachability, missing defenses, stack fingerprints, and a few
          common open ports — then score the result. We do{' '}
          <Text as="span" color="cyber.text" fontWeight="600">
            not
          </Text>{' '}
          break into systems, run authenticated tests, or attack the target.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {whatWeScan.map((item) => (
            <Card key={item.title} h="full">
              <CardBody>
                <Text fontWeight="700" mb={2} color="brand.500">
                  {item.title}
                </Text>
                <Text fontSize="sm" color="cyber.muted" lineHeight="1.6">
                  {item.detail}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Card>
        <CardBody>
          <Heading size="sm" mb={3}>
            In the product
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} color="cyber.muted" fontSize="sm">
            <Text>• Monitor organizations and their public domains</Text>
            <Text>• Start scans and follow PENDING → QUEUED → RUNNING → COMPLETED / FAILED</Text>
            <Text>• Review findings and a security score per scan</Text>
            <Text>• Use Home for trends and companies that need attention</Text>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Box>
        <Heading size="sm" mb={3}>
          How it fits together
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
          {stack.map((item) => (
            <Card key={item.name} h="full">
              <CardBody>
                <Text fontWeight="700" mb={1}>
                  {item.name}
                </Text>
                <Text fontSize="sm" color="cyber.muted">
                  {item.role}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Roles
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          {roles.map((role) => (
            <Card key={role.name} h="full">
              <CardBody>
                <Text fontFamily="mono" fontWeight="700" color="brand.500" mb={2}>
                  {role.name}
                </Text>
                <Text fontSize="sm" color="cyber.muted">
                  {role.detail}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Text fontSize="xs" color="cyber.muted">
        Passive observation only — no active exploitation. Full-stack cybersecurity monitoring demo.
      </Text>
    </VStack>
  )
}
