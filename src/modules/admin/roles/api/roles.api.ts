import { http } from '@/shared/api/http'
import type { Permission, Role } from '../types'

export const rolesApi = {
  list() {
    return http.get<Role[]>('/admin/roles')
  },
  permissions() {
    return http.get<Permission[]>('/admin/permissions')
  },
  create(payload: { nombre: string; descripcion: string }) {
    return http.post<Role>('/admin/roles', payload)
  },
  update(id: number, payload: { nombre: string; descripcion: string }) {
    return http.patch(`/admin/roles/${id}`, payload)
  },
  setPermissions(id: number, permissionIds: number[]) {
    return http.put(`/admin/roles/${id}/permissions`, { permissionIds })
  },
}
