import { http } from '@/shared/api/http'
import type { OdooUserLookup } from '@/shared/types/odooUser'
import type { RoleOption, User } from '../types'

export const usersApi = {
  list() {
    return http.get<User[]>('/admin/users')
  },
  searchOdooUsers(reference: string) {
    return http.get<OdooUserLookup[]>(
      `/admin/users/odoo/${encodeURIComponent(reference.trim())}`,
    )
  },
  create(payload: Record<string, unknown>) {
    return http.post('/admin/users', payload)
  },
  update(id: number, payload: Record<string, unknown>) {
    return http.patch(`/admin/users/${id}`, payload)
  },
  deactivate(id: number) {
    return http.delete(`/admin/users/${id}`)
  },
  roleOptions() {
    return http.get<RoleOption[]>('/admin/roles/options')
  },
  roles() {
    return http.get<RoleOption[]>('/admin/roles')
  },
}
