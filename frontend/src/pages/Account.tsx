import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useAuth } from '../auth/useAuth'

export function Account() {
  const { user, isAdmin, isAnalyst, logout } = useAuth()

  if (!user) {
    return (
      <Text color="cyber.muted">No session loaded. Sign in again if this persists.</Text>
    )
  }

  return (
    <VStack align="stretch" spacing={{ base: 4, md: 6 }} w="full" minW={0}>
      <Stack spacing={1}>
        <Heading size={{ base: 'md', md: 'lg' }} letterSpacing="tight">
          Account
        </Heading>
        <Text color="cyber.muted" fontSize="sm">
          Your Keycloak session for CyberWatch — passwords are managed in the identity provider
        </Text>
      </Stack>

      <Card>
        <CardBody>
          <HStack spacing={4} align="start">
            <Avatar size="lg" name={user.name || user.email} bg="brand.500" color="white" />
            <Stack spacing={1} flex="1">
              <Text fontSize="xl" fontWeight="700">
                {user.name || 'User'}
              </Text>
              <Text fontFamily="mono" fontSize="sm" color="cyber.muted">
                {user.email || '—'}
              </Text>
              <HStack spacing={2} pt={2} flexWrap="wrap">
                {user.roles.length === 0 ? (
                  <Badge colorScheme="gray">No app roles</Badge>
                ) : (
                  user.roles.map((role) => (
                    <Badge key={role} bg="brand.500" color="white">
                      {role}
                    </Badge>
                  ))
                )}
              </HStack>
            </Stack>
          </HStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Text fontSize="sm" color="cyber.muted" mb={2}>
            Permissions in this app
          </Text>
          <Stack spacing={1} fontSize="sm" color="cyber.muted">
            <Text>• View dashboard & companies: yes</Text>
            <Text>• Start scans: {isAnalyst ? 'yes' : 'no'}</Text>
            <Text>• Manage companies: {isAdmin ? 'yes' : 'no'}</Text>
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Heading size="sm" mb={2}>
            Sign out
          </Heading>
          <Text fontSize="sm" color="cyber.muted" mb={4}>
            Ends the CyberWatch session and returns you to Keycloak logout.
          </Text>
          <Button
            variant="outline"
            colorScheme="red"
            onClick={() => {
              void logout()
            }}
          >
            Sign out
          </Button>
        </CardBody>
      </Card>
    </VStack>
  )
}
