import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Alert, AlertIcon, Button, VStack } from '@chakra-ui/react'
import { LoadingState } from '../components/common/PageStates'
import { useAuth } from './AuthProvider'

/** Blocks app routes until Keycloak session exists; redirects to login if needed. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading, login, authError } = useAuth()
  const loginStarted = useRef(false)

  useEffect(() => {
    if (isLoading || isAuthenticated || authError) {
      return
    }
    if (loginStarted.current) {
      return
    }
    loginStarted.current = true
    void login()
  }, [isLoading, isAuthenticated, authError, login])

  if (isLoading) {
    return <LoadingState fullScreen label="Checking authentication…" />
  }

  if (authError) {
    return (
      <VStack minH="100dvh" justify="center" spacing={4} px={4}>
        <Alert status="error" maxW="lg" borderRadius="md">
          <AlertIcon />
          {authError}
        </Alert>
        <Button
          onClick={() => {
            loginStarted.current = false
            void login()
          }}
        >
          Try again
        </Button>
      </VStack>
    )
  }

  if (!isAuthenticated) {
    return <LoadingState fullScreen label="Redirecting to Keycloak…" />
  }

  return <Outlet />
}
