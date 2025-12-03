import { api } from '@/lib/api-client'
import type {
  GetUserProfileResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '@go-genai-stack/types'

/**
 * User API
 *
 * 对齐后端 backend/domains/user
 * API Prefix: /api/users
 */
export const userApi = {
  /**
   * 获取用户资料
   */
  getProfile: async (): Promise<GetUserProfileResponse> => {
    return api.get<GetUserProfileResponse>('/api/users/me')
  },

  /**
   * 更新用户资料
   */
  updateProfile: async (data: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> => {
    return api.put<UpdateUserProfileResponse>('/api/users/me', data)
  },

  /**
   * 修改密码
   */
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    return api.post<ChangePasswordResponse>('/api/users/me/change-password', data)
  },
}
