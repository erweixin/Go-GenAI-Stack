// Code generated from Go structs. DO NOT EDIT manually.
// Source: backend/domains/user/http/dto
// Generated: 2025-11-27

// ============================================
// User Domain Types
// ============================================

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'inactive' | 'suspended'

/**
 * 获取用户资料响应
 */
export interface GetUserProfileResponse {
  user_id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  status: UserStatus
  email_verified: boolean
  created_at: string // ISO 8601 格式
  updated_at: string // ISO 8601 格式
  last_login_at?: string // ISO 8601 格式
}

/**
 * 更新用户资料请求
 */
export interface UpdateUserProfileRequest {
  username?: string
  full_name?: string
  avatar_url?: string
}

/**
 * 更新用户资料响应
 */
export interface UpdateUserProfileResponse {
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  updated_at: string // ISO 8601 格式
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

/**
 * 修改密码响应
 */
export interface ChangePasswordResponse {
  success: boolean
  message: string
}
