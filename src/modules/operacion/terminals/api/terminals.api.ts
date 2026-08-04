import { http } from '@/shared/api/http'
import type { OdooUserLookup } from '@/shared/types/odooUser'
import type { Terminal, TerminalPayload, TerminalUserOption } from '../types'

export const terminalsApi = {
  list(params: Record<string, string | boolean>) {
    return http.get<Terminal[]>('/admin/terminals', { params })
  },
  userOptions() {
    return http.get<TerminalUserOption[]>('/admin/terminals/options/users')
  },
  searchOdooUsers(reference: string) {
    return http.get<OdooUserLookup[]>(
      `/admin/terminals/odoo-users/${encodeURIComponent(reference.trim())}`,
    )
  },
  create(payload: TerminalPayload) {
    return http.post('/admin/terminals', payload)
  },
  update(id: number, payload: Partial<TerminalPayload>) {
    return http.patch(`/admin/terminals/${id}`, payload)
  },
  deactivate(id: number) {
    return http.delete(`/admin/terminals/${id}`)
  },
  testCharge(id: number) {
    return http.post(`/admin/terminals/${id}/test-charge`)
  },
}
