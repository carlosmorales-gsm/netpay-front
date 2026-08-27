import { http } from '@/shared/api/http'
import type { MovementUserOption, MovementsResponse } from '../types'

export const movementsApi = {
  list(params: Record<string, string>) {
    return http.get<MovementsResponse>('/admin/movements', { params })
  },
  users() {
    return http.get<MovementUserOption[]>('/admin/movements/users')
  },
  reprint(id: number) {
    return http.post(`/admin/movements/${id}/reprint`)
  },
}
