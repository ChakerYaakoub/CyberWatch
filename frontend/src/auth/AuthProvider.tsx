import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'oidc-client-ts'
import {
  clearStaleState,
  getCurrentUser,
  getUserManager,
  loginRedirect,
  logoutRedirect,
} from './TokenManager'

export type AppRole = 'ADMIN' | 'ANALYST'

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: AppRole[]
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  authError: string | null
  isAdmin: boolean
  isAnalyst: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  completeLogin: (oidcUser: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function extractRoles(profile: User['profile']): AppRole[] {
  const roles = new Set<AppRole>()

  const realmAccess = profile.realm_access as { roles?: string[] } | undefined
  for (const role of realmAccess?.roles ?? []) {
    if (role === 'ADMIN' || role === 'ANALYST') {
      roles.add(role)
    }
  }

  const resourceAccess = profile.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined
  if (resourceAccess) {
    for (const client of Object.values(resourceAccess)) {
      for (const role of client.roles ?? []) {
        if (role === 'ADMIN' || role === 'ANALYST') {
          roles.add(role)
        }
      }
    }
  }

  return Array.from(roles)
}

function extractRolesFromToken(accessToken: string): AppRole[] {
  try {
    const payloadPart = accessToken.split('.')[1]
    if (!payloadPart) return []
    const json = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'))) as {
      realm_access?: { roles?: string[] }
      resource_access?: Record<string, { roles?: string[] }>
    }
    return extractRoles(json as User['profile'])
  } catch {
    return []
  }
}

export function mapOidcUser(oidcUser: User): AuthUser {
  const profile = oidcUser.profile
  const rolesFromProfile = extractRoles(profile)
  const rolesFromToken = extractRolesFromToken(oidcUser.access_token)
  const roles = Array.from(new Set([...rolesFromProfile, ...rolesFromToken]))

  return {
    id: profile.sub,
    email: String(profile.email ?? profile.preferred_username ?? ''),
    name: String(profile.name ?? profile.preferred_username ?? profile.email ?? 'User'),
    roles,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const syncUser = useCallback(async () => {
    const current = await getCurrentUser()
    if (current && !current.expired) {
      setUser(mapOidcUser(current))
      return
    }
    setUser(null)
  }, [])

  const completeLogin = useCallback((oidcUser: User) => {
    setUser(mapOidcUser(oidcUser))
    setAuthError(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let active = true
    const manager = getUserManager()

    async function bootstrap() {
      try {
        // Do not clear state while returning from Keycloak with ?code=
        const params = new URLSearchParams(window.location.search)
        const isCallback = params.has('code') && params.has('state')
        if (!isCallback) {
          await clearStaleState()
          await syncUser()
        }
      } catch (error) {
        console.error('Auth bootstrap failed', error)
        if (active) {
          setUser(null)
          setAuthError('Authentication failed. Please try again.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void bootstrap()

    const onUserLoaded = (loaded: User) => setUser(mapOidcUser(loaded))
    const onUserUnloaded = () => setUser(null)
    const onAccessTokenExpired = () => {
      void manager.signinSilent().catch(() => {
        setUser(null)
      })
    }

    manager.events.addUserLoaded(onUserLoaded)
    manager.events.addUserUnloaded(onUserUnloaded)
    manager.events.addAccessTokenExpired(onAccessTokenExpired)

    return () => {
      active = false
      manager.events.removeUserLoaded(onUserLoaded)
      manager.events.removeUserUnloaded(onUserUnloaded)
      manager.events.removeAccessTokenExpired(onAccessTokenExpired)
    }
  }, [syncUser])

  const login = useCallback(async () => {
    setAuthError(null)
    await loginRedirect()
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    await logoutRedirect()
  }, [])

  const getAccessToken = useCallback(async () => {
    const current = await getCurrentUser()
    if (!current || current.expired) {
      return null
    }
    return current.access_token
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      authError,
      isAdmin: Boolean(user?.roles.includes('ADMIN')),
      isAnalyst: Boolean(user?.roles.includes('ANALYST') || user?.roles.includes('ADMIN')),
      login,
      logout,
      getAccessToken,
      completeLogin,
    }),
    [user, isLoading, authError, login, logout, getAccessToken, completeLogin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
