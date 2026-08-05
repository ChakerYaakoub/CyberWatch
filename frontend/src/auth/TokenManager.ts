import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { authConfig } from './authConfig'

let userManager: UserManager | null = null
let callbackPromise: Promise<User | null> | null = null

export function getUserManager(): UserManager {
  if (!userManager) {
    userManager = new UserManager({
      ...authConfig,
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    })
  }
  return userManager
}

export async function getAccessToken(): Promise<string | null> {
  const user = await getUserManager().getUser()
  if (!user || user.expired) {
    return null
  }
  return user.access_token
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await getUserManager().getUser()
  } catch {
    return null
  }
}

export async function loginRedirect(): Promise<void> {
  await getUserManager().signinRedirect()
}

/** Ensures React Strict Mode does not consume the auth code twice. */
export async function handleRedirectCallback(): Promise<User | null> {
  if (!callbackPromise) {
    callbackPromise = getUserManager()
      .signinRedirectCallback()
      .catch(async (error) => {
        console.warn('signinRedirectCallback failed, trying existing session', error)
        return getUserManager().getUser()
      })
  }
  return callbackPromise
}

export async function logoutRedirect(): Promise<void> {
  await getUserManager().signoutRedirect()
}

export async function renewToken(): Promise<User | null> {
  try {
    return await getUserManager().signinSilent()
  } catch {
    return null
  }
}

export function clearStaleState(): Promise<void> {
  return getUserManager().clearStaleState()
}
