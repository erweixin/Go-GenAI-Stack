import { api } from '@/lib/api-client'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@go-genai-stack/types'

/**
 * Auth API
 *
 * 对齐后端 backend/domains/auth
 * API Prefix: /api/auth
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/login', data)
  },

  /**
   * 用户注册
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/api/auth/register', data)
  },

  /**
   * 刷新令牌
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return api.post<RefreshTokenResponse>('/api/auth/refresh', data)
  },

  /**
   * 用户登出
   */
  logout: async (): Promise<void> => {
    return api.post('/api/auth/logout')
  },
}
