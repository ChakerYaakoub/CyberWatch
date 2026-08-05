import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody, ApiResponse } from '../types'
import { getAccessToken, loginRedirect } from '../auth/TokenManager'

const apiBaseURL = import.meta.env.VITE_API_URL

if (!apiBaseURL) {
  throw new Error(
    'Missing VITE_API_URL. Set it in infrastructure/.env (copy from infrastructure/.env.example).',
  )
}

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      await loginRedirect()
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>
    if (axiosError.response?.status === 401) {
      return 'Your session expired. Please sign in again.'
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.'
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }
    if (axiosError.response?.status === 404) {
      return 'Resource not found'
    }
    if (axiosError.response?.status === 500) {
      return 'Internal server error'
    }
    if (!axiosError.response) {
      return 'Unable to reach the API. Is the backend running?'
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export async function unwrapData<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}
