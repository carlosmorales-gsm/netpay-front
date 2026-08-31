import { http } from '@/shared/api/http'
import type { RefundsResponse, VoidResult } from '../types'

export const refundsApi = {
  list(params: Record<string, string>) {
    return http.get<RefundsResponse>('/admin/refunds', { params })
  },
  voidPayment(id: number, timeZone?: string) {
    return http.post<VoidResult>(`/admin/refunds/${id}/void`, undefined, {
      params: timeZone ? { timeZone } : undefined,
    })
  },
}
