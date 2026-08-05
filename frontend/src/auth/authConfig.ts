const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL
const realm = import.meta.env.VITE_KEYCLOAK_REALM
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID

if (!keycloakUrl || !realm || !clientId) {
  throw new Error(
    'Missing Keycloak env. Set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID in infrastructure/.env',
  )
}

export const authConfig = {
  authority: `${keycloakUrl}/realms/${realm}`,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  silent_redirect_uri: `${window.location.origin}/silent-renew`,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  // Session iframe checks often fail on hosted IdPs and can cause auth loops
  monitorSession: false,
  loadUserInfo: true,
} as const

export const keycloakEnv = {
  url: keycloakUrl,
  realm,
  clientId,
}
