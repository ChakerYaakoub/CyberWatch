import axios, { AxiosError } from 'axios'
import type { ApiErrorBody, ApiResponse } from '../types'

const apiBaseURL = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cyberwatch_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>
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
