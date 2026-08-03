import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/api/http'
import type { AuthUser, LoginResponse } from '@/types/auth'

const TOKEN_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'
const USER_KEY = 'authUser'

function readStoredUser(): AuthUser | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(sessionStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(readStoredUser())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
  const permissions = computed(() => user.value?.permissions ?? [])

  function hasPermission(code: string) {
    return permissions.value.includes(code)
  }

  function hasAnyPermission(...codes: string[]) {
    return codes.some((c) => hasPermission(c))
  }

  function persist(data: LoginResponse) {
    sessionStorage.setItem(TOKEN_KEY, data.accessToken)
    sessionStorage.setItem(REFRESH_KEY, data.refreshToken)
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user))
    accessToken.value = data.accessToken
    user.value = data.user
    error.value = null
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(USER_KEY)
    accessToken.value = null
    user.value = null
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await http.post<LoginResponse>('/auth/login', { email, password })
      if (!data?.accessToken || !data?.user) {
        error.value = 'Respuesta de login inválida'
        throw new Error(error.value)
      }
      persist(data)
      return data.user
    } catch (e: unknown) {
      clearSession()
      const status = (e as { response?: { status?: number; data?: { message?: string | string[] } } })
        ?.response?.status
      const apiMessage = (e as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message
      if (status === 401) {
        error.value = 'Credenciales inválidas'
      } else if (!status && !(e instanceof Error && e.message === 'Respuesta de login inválida')) {
        error.value = `No se pudo conectar al API (${import.meta.env.VITE_API_URL || 'sin URL'}). ¿Está corriendo api-netpay?`
      } else if (!error.value) {
        error.value = Array.isArray(apiMessage)
          ? apiMessage.join(', ')
          : apiMessage || `Error del servidor (${status})`
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!accessToken.value && !sessionStorage.getItem(TOKEN_KEY)) return null
    const { data } = await http.get<AuthUser>('/auth/me')
    user.value = data
    sessionStorage.setItem(USER_KEY, JSON.stringify(data))
    return data
  }

  function logout() {
    clearSession()
  }

  function setTokens(nextAccess: string, nextRefresh: string) {
    sessionStorage.setItem(TOKEN_KEY, nextAccess)
    sessionStorage.setItem(REFRESH_KEY, nextRefresh)
    accessToken.value = nextAccess
  }

  return {
    accessToken,
    user,
    loading,
    error,
    isAuthenticated,
    permissions,
    hasPermission,
    hasAnyPermission,
    login,
    fetchMe,
    logout,
    setTokens,
    clearSession,
  }
})
