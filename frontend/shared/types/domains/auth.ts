// Code generated from Go structs. DO NOT EDIT manually.
// Source: backend/domains/auth/http/dto
// Generated: 2025-11-27

// ============================================
// Auth Domain Types
// ============================================

/**
 * 登录请求
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user_id: string
  email: string
  access_token: string
  refresh_token: string
  expires_in: number // 过期时间（秒）
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string
  password: string
  username?: string
  full_name?: string
}

/**
 * 注册响应
 */
export interface RegisterResponse {
  user_id: string
  email: string
  access_token: string
  refresh_token: string
  expires_in: number // 过期时间（秒）
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  refresh_token: string
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number // 过期时间（秒）
}
