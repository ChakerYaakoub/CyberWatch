export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthSession {
  token: string
  email: string
}
