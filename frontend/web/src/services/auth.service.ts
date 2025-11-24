import { api } from '@/lib/api-client'

// 注册请求
export interface RegisterRequest {
  email: string
  password: string
  username?: string
  full_name?: string
}

// 注册响应
export interface RegisterResponse {
  user_id: string
  email: string
  access_token: string
  refresh_token: string
  expires_in: number
}

// 登录请求
export interface LoginRequest {
  email: string
  password: string
}

// 登录响应
export interface LoginResponse {
  user_id: string
  email: string
  access_token: string
  refresh_token: string
  expires_in: number
}

// 刷新 Token 请求
export interface RefreshTokenRequest {
  refresh_token: string
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

// 认证服务
export const authService = {
  // 注册
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/api/auth/register', data)
  },

  // 登录
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('/api/auth/login', data)
  },

  // 刷新 Token
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return api.post<RefreshTokenResponse>('/api/auth/refresh', data)
  },

  // 登出（清除本地 Token）
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_id')
  },
}

