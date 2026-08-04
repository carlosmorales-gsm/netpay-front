export type RoleOption = {
  id: number
  nombre: string
}

export type User = {
  id: number
  email: string
  nombre: string
  odooUserId: number | null
  roleId: number
  roleNombre: string | null
  activo: boolean
}

export type UserForm = {
  email: string
  password: string
  nombre: string
  odooUserId: string | number
  roleId: string | number
  activo: boolean
}
