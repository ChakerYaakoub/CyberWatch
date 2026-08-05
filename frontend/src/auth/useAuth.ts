/** Barrel: auth context, route gate, and token helpers used outside React. */
export { AuthProvider, useAuth } from './AuthProvider'
export type { AuthUser, AppRole } from './AuthProvider'
export { ProtectedRoute } from './ProtectedRoute'
export { getAccessToken, getUserManager } from './TokenManager'
