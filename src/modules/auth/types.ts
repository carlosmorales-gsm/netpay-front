export type AuthUser = {
  id: number
  email: string
  nombre: string
  odooUserId: number | null
  roleId: number
  roleNombre: string
  permissions: string[]
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}
