import { http } from '@/shared/api/http'
import type { MovementUserOption, MovementsResponse } from '../types'

export const movementsApi = {
  list(params: Record<string, string>) {
    return http.get<MovementsResponse>('/admin/movements', { params })
  },
  users() {
    return http.get<MovementUserOption[]>('/admin/movements/users')
  },
}
