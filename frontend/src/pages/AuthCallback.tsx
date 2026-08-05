import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertIcon, Button, VStack } from '@chakra-ui/react'
import { LoadingState } from '../components/common/PageStates'
import { useAuth } from '../auth/AuthProvider'
import { handleRedirectCallback } from '../auth/TokenManager'

/**
 * OIDC redirect target — must stay outside ProtectedRoute
 * to avoid login redirect loops during callback handling.
 */
export function AuthCallback() {
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function finishLogin() {
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get('error')) {
          throw new Error(params.get('error_description') || params.get('error') || 'Login failed')
        }

        const oidcUser = await handleRedirectCallback()
        if (!oidcUser) {
          throw new Error('No session after Keycloak callback')
        }
        if (!active) return
        completeLogin(oidcUser)
        navigate('/', { replace: true })
      } catch (err) {
        console.error(err)
        if (active) {
          setError(err instanceof Error ? err.message : 'Login callback failed')
        }
      }
    }

    void finishLogin()
    return () => {
      active = false
    }
  }, [completeLogin, navigate])

  if (error) {
    return (
      <VStack py={16} spacing={4}>
        <Alert status="error" maxW="lg" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
        <Button onClick={() => navigate('/', { replace: true })}>Back to app</Button>
      </VStack>
    )
  }

  return <LoadingState label="Completing Keycloak login…" />
}
