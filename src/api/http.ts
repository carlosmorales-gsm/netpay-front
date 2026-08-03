import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3017'

export const http = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshing: Promise<string | null> | null = null

function getAccessToken() {
  return sessionStorage.getItem('accessToken')
}

function getRefreshToken() {
  return sessionStorage.getItem('refreshToken')
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const url = original?.url || ''

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    original._retry = true

    if (!refreshing) {
      refreshing = (async () => {
        const refreshToken = getRefreshToken()
        if (!refreshToken) return null
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          sessionStorage.setItem('accessToken', data.accessToken)
          sessionStorage.setItem('refreshToken', data.refreshToken)
          return data.accessToken as string
        } catch {
          sessionStorage.removeItem('accessToken')
          sessionStorage.removeItem('refreshToken')
          sessionStorage.removeItem('authUser')
          return null
        } finally {
          refreshing = null
        }
      })()
    }

    const newToken = await refreshing
    if (!newToken) {
      if (!window.location.pathname.includes('/login')) {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    original.headers.Authorization = `Bearer ${newToken}`
    return http(original)
  },
)
