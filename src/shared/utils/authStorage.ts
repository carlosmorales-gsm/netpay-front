import type { AuthUser } from '@/modules/auth/types'

export const AUTH_PERSIST_KEY = 'netpay.auth'

export type AuthPersistShape = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
}

const EMPTY: AuthPersistShape = {
  accessToken: null,
  refreshToken: null,
  user: null,
}

/** Migra tokens viejos de sessionStorage → localStorage (una vez) */
function migrateLegacySession(): AuthPersistShape | null {
  const accessToken = sessionStorage.getItem('accessToken')
  const refreshToken = sessionStorage.getItem('refreshToken')
  const rawUser = sessionStorage.getItem('authUser')
  if (!accessToken && !refreshToken && !rawUser) return null

  let user: AuthUser | null = null
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as AuthUser
    } catch {
      user = null
    }
  }

  const migrated: AuthPersistShape = {
    accessToken,
    refreshToken,
    user,
  }
  localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify(migrated))
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('authUser')
  return migrated
}

export function readAuthPersist(): AuthPersistShape {
  try {
    const raw = localStorage.getItem(AUTH_PERSIST_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthPersistShape>
      return {
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null,
        user: parsed.user ?? null,
      }
    }
  } catch {
    // ignore
  }

  return migrateLegacySession() ?? { ...EMPTY }
}

export function writeAuthPersist(partial: Partial<AuthPersistShape>) {
  const current = readAuthPersist()
  const next: AuthPersistShape = {
    accessToken: partial.accessToken !== undefined ? partial.accessToken : current.accessToken,
    refreshToken: partial.refreshToken !== undefined ? partial.refreshToken : current.refreshToken,
    user: partial.user !== undefined ? partial.user : current.user,
  }
  localStorage.setItem(AUTH_PERSIST_KEY, JSON.stringify(next))
}

export function clearAuthPersist() {
  localStorage.removeItem(AUTH_PERSIST_KEY)
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('authUser')
}

type TokenListener = (
  accessToken: string,
  refreshToken: string,
  user?: AuthUser | null,
) => void
let tokenListener: TokenListener | null = null

export function onAuthTokensUpdated(listener: TokenListener) {
  tokenListener = listener
}

export function notifyAuthTokensUpdated(
  accessToken: string,
  refreshToken: string,
  user?: AuthUser | null,
) {
  writeAuthPersist({
    accessToken,
    refreshToken,
    ...(user !== undefined ? { user } : {}),
  })
  tokenListener?.(accessToken, refreshToken, user)
}
