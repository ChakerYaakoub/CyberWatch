import { Alert, AlertIcon, Box, Flex, Spinner, Text } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

interface LoadingStateProps {
  label?: string
  /** Full viewport (auth / redirect). Default fills the main content area. */
  fullScreen?: boolean
}

const softPulse = keyframes`
  0%, 100% { transform: scale(0.92); opacity: 0.18; }
  50% { transform: scale(1.08); opacity: 0.28; }
`

export function LoadingState({
  label = 'Loading…',
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <Flex
      role="status"
      aria-live="polite"
      aria-busy="true"
      direction="column"
      align="center"
      justify="center"
      w="full"
      minH={
        fullScreen
          ? '100dvh'
          : { base: 'calc(100dvh - 7rem)', md: 'calc(100dvh - 9rem)' }
      }
      gap={5}
      px={4}
    >
      <Box
        position="relative"
        w="72px"
        h="72px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          position="absolute"
          inset="0"
          borderRadius="full"
          bg="brand.500"
          animation={`${softPulse} 1.8s ease-in-out infinite`}
        />
        <Spinner
          color="brand.500"
          emptyColor="cyber.border"
          size="xl"
          thickness="3px"
          speed="0.7s"
        />
      </Box>
      <Text
        color="cyber.muted"
        fontSize="sm"
        fontWeight="500"
        letterSpacing="0.02em"
        textAlign="center"
        maxW="xs"
      >
        {label}
      </Text>
    </Flex>
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
