export type Permission = {
  id: number
  codigo: string
  pantalla: string
  descripcion: string
}

export type Role = {
  id: number
  nombre: string
  descripcion: string | null
  permissions: Permission[]
}

export type RoleForm = {
  nombre: string
  descripcion: string
  permissionIds: number[]
}
