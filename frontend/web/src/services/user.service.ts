import { api } from '@/lib/api-client'

// 用户资料
export interface UserProfile {
  user_id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  status: string
  email_verified: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

// 更新用户资料请求
export interface UpdateUserProfileRequest {
  username?: string
  full_name?: string
  avatar_url?: string
}

// 更新用户资料响应
export interface UpdateUserProfileResponse {
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  updated_at: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// 修改密码响应
export interface ChangePasswordResponse {
  success: boolean
  message: string
}

// 用户服务
export const userService = {
  // 获取当前用户资料
  getProfile: async (): Promise<UserProfile> => {
    return api.get<UserProfile>('/api/users/me')
  },

  // 更新用户资料
  updateProfile: async (data: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> => {
    return api.put<UpdateUserProfileResponse>('/api/users/me', data)
  },

  // 修改密码
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    return api.post<ChangePasswordResponse>('/api/users/me/change-password', data)
  },
}

