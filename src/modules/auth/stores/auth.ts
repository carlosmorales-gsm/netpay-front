import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  clearAuthPersist,
  onAuthTokensUpdated,
  readAuthPersist,
  writeAuthPersist,
} from '@/shared/utils/authStorage'
import { authApi } from '../api/auth.api'
import type { AuthUser, LoginResponse } from '../types'

const initial = readAuthPersist()

export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref<string | null>(initial.accessToken)
    const refreshToken = ref<string | null>(initial.refreshToken)
    const user = ref<AuthUser | null>(initial.user)
    const loading = ref(false)
    const error = ref<string | null>(null)

    onAuthTokensUpdated((nextAccess, nextRefresh) => {
      accessToken.value = nextAccess
      refreshToken.value = nextRefresh
    })

    const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))
    const permissions = computed(() => user.value?.permissions ?? [])

    function hasPermission(code: string) {
      return permissions.value.includes(code)
    }

    function hasAnyPermission(...codes: string[]) {
      return codes.some((c) => hasPermission(c))
    }

    function persist(data: LoginResponse) {
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      user.value = data.user
      error.value = null
      writeAuthPersist({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      })
    }

    function clearSession() {
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      clearAuthPersist()
    }

    async function login(email: string, password: string) {
      loading.value = true
      error.value = null
      try {
        const { data } = await authApi.login(email, password)
        if (!data?.accessToken || !data?.user) {
          error.value = 'Respuesta de login inválida'
          throw new Error(error.value)
        }
        persist(data)
        return data.user
      } catch (e: unknown) {
        clearSession()
        const status = (
          e as { response?: { status?: number; data?: { message?: string | string[] } } }
        )?.response?.status
        const apiMessage = (e as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message
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
      if (!accessToken.value && !readAuthPersist().accessToken) return null
      const { data } = await authApi.me()
      user.value = data
      writeAuthPersist({ user: data })
      return data
    }

    function logout() {
      clearSession()
    }

    function setTokens(nextAccess: string, nextRefresh: string) {
      accessToken.value = nextAccess
      refreshToken.value = nextRefresh
      writeAuthPersist({
        accessToken: nextAccess,
        refreshToken: nextRefresh,
      })
    }

    return {
      accessToken,
      refreshToken,
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
  },
  {
    persist: {
      key: 'netpay.auth',
      storage: localStorage,
      pick: ['accessToken', 'refreshToken', 'user'],
    },
  },
)
