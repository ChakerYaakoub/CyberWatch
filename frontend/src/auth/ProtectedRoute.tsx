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
    return <LoadingState label="Checking authentication…" />
  }

  if (authError) {
    return (
      <VStack py={16} spacing={4}>
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
    return <LoadingState label="Redirecting to Keycloak…" />
  }

  return <Outlet />
}
