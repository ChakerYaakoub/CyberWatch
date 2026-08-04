import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <Box as="svg" viewBox="0 0 24 24" w="18px" h="18px" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </Box>
    )
  }

  return (
    <Box as="svg" viewBox="0 0 24 24" w="18px" h="18px" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Box>
  )
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('analyst@cyberwatch.io')
  const [password, setPassword] = useState('demo')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      bgGradient="radial(circle at top, #132033 0%, #0B1220 55%)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.08}
        backgroundImage="linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px)"
        backgroundSize="48px 48px"
        pointerEvents="none"
      />

      <Box
        w="full"
        maxW="420px"
        bg="cyber.panel"
        borderWidth="1px"
        borderColor="cyber.border"
        borderRadius="xl"
        p={{ base: 6, md: 8 }}
        position="relative"
        zIndex={1}
      >
        <VStack align="stretch" spacing={6}>
          <Box textAlign="center">
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="brand.500"
              letterSpacing="0.14em"
              textTransform="uppercase"
              mb={2}
            >
              External Attack Surface Monitoring
            </Text>
            <Heading size="lg" letterSpacing="tight">
              CyberWatch
            </Heading>
            <Text color="cyber.muted" mt={2} fontSize="sm">
              Sign in to access the security operations console
            </Text>
          </Box>

          {error ? (
            <Alert status="error" borderRadius="md" bg="red.900" color="red.100">
              <AlertIcon />
              {error}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="cyber.muted">
                  Email
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  autoComplete="username"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" color="cyber.muted">
                  Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    pr="12"
                  />
                  <InputRightElement h="full">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((prev) => !prev)}
                      icon={<EyeIcon open={showPassword} />}
                      color="cyber.muted"
                      _hover={{ color: 'cyber.text', bg: 'transparent' }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button type="submit" size="lg" w="full" isLoading={isSubmitting} loadingText="Signing in">
                Sign in
              </Button>
            </Stack>
          </form>

          <Text fontSize="xs" color="cyber.muted" textAlign="center">
            Keycloak SSO will be integrated in a later phase. Use any credentials for this demo.
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}
