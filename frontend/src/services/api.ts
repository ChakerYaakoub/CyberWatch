import axios from 'axios'

/**
 * Axios instance prepared for the future Go API backend.
 * Phase 1 uses mock data — do not call real endpoints yet.
 */
export const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cyberwatch_token')
      localStorage.removeItem('cyberwatch_user')
    }
    return Promise.reject(error)
  },
)
