import type { AuthSession, LoginCredentials } from '../types'

/**
 * Mock authentication only (Keycloak comes later).
 * Does not call the Go API.
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (!credentials.email.trim() || !credentials.password) {
    throw new Error('Email and password are required')
  }

  return {
    token: 'mock-jwt-token',
    email: credentials.email.trim(),
  }
}
