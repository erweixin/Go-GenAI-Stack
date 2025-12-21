/**
 * User HTTP DTO
 * 定义 HTTP 请求和响应的数据结构
 */

import { z } from 'zod';

// ========================================
// GetUserProfile
// ========================================

export interface GetUserProfileResponse {
  user_id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  status: string;
  email_verified: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  last_login_at?: string; // ISO 8601
}

// ========================================
// UpdateUserProfile
// ========================================

export const UpdateUserProfileRequestSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(30, '用户名最多 30 个字符').regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线').optional(),
  full_name: z.string().max(100, '全名最多 100 个字符').optional(),
  avatar_url: z.string().url('头像 URL 格式无效').optional(),
});

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileRequestSchema>;

export interface UpdateUserProfileResponse {
  user_id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at: string; // ISO 8601
}

// ========================================
// ChangePassword
// ========================================

export const ChangePasswordRequestSchema = z.object({
  old_password: z.string().min(1, '旧密码不能为空'),
  new_password: z.string().min(8, '新密码至少 8 个字符').max(128, '新密码最多 128 个字符'),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

