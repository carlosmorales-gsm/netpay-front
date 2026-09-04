import { http } from '@/shared/api/http'
import type { ReverseConsultResult, ReverseUserOption, ReversesResponse } from '../types'

export const reversesApi = {
  list(params: Record<string, string>) {
    return http.get<ReversesResponse>('/admin/reverses', { params })
  },
  users() {
    return http.get<ReverseUserOption[]>('/admin/reverses/users')
  },
  consult(id: number) {
    return http.post<ReverseConsultResult>(`/admin/reverses/${id}/consult`)
  },
}
