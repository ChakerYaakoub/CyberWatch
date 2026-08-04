import { Alert, AlertIcon, Box, Spinner, Text, VStack } from '@chakra-ui/react'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <VStack py={16} spacing={3}>
      <Spinner color="brand.500" size="lg" thickness="3px" />
      <Text color="cyber.muted" fontSize="sm">
        {label}
      </Text>
    </VStack>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Box py={12} textAlign="center">
      <Text fontWeight="600" mb={1}>
        {title}
      </Text>
      {description ? (
        <Text color="cyber.muted" fontSize="sm">
          {description}
        </Text>
      ) : null}
    </Box>
  )
}

interface ErrorStateProps {
  message: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Alert status="error" borderRadius="md" bg="red.900" color="red.100">
      <AlertIcon />
      {message}
    </Alert>
  )
}

export { formatDisplayDate as formatDate } from '../../utils/scanMappers'
