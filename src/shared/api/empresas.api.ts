import { http } from '@/shared/api/http'
import type { Empresa } from '@/shared/types/empresa'

export const empresasApi = {
  list() {
    return http.get<Empresa[]>('/admin/empresas')
  },
}
