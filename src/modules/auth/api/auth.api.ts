import { http } from '@/shared/api/http'
import type { AuthUser, LoginResponse } from '../types'

export const authApi = {
  login(email: string, password: string) {
    return http.post<LoginResponse>('/auth/login', { email, password })
  },
  me() {
    return http.get<AuthUser>('/auth/me')
  },
}
