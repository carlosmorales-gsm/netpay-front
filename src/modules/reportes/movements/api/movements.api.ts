import { http } from '@/shared/api/http'
import type { MovementsResponse } from '../types'

export const movementsApi = {
  list(params: Record<string, string>) {
    return http.get<MovementsResponse>('/admin/movements', { params })
  },
}
