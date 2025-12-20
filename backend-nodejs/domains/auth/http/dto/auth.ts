/**
 * Auth HTTP DTO
 * 定义 HTTP 请求和响应的数据结构
 */

import { z } from 'zod';

// ========================================
// Register
// ========================================

export const RegisterRequestSchema = z.object({
  email: z.string().email('邮箱格式无效').min(1, '邮箱不能为空'),
  password: z.string().min(8, '密码至少 8 个字符').max(128, '密码最多 128 个字符'),
  username: z.string().min(3, '用户名至少 3 个字符').max(30, '用户名最多 30 个字符').regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线').optional(),
  full_name: z.string().max(100, '全名最多 100 个字符').optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export interface RegisterResponse {
  user_id: string;
  email: string;
  access_token: string;
  refresh_token: string;
  expires_in: number; // 秒
}

// ========================================
// Login
// ========================================

export const LoginRequestSchema = z.object({
  email: z.string().email('邮箱格式无效').min(1, '邮箱不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface LoginResponse {
  user_id: string;
  email: string;
  access_token: string;
  refresh_token: string;
  expires_in: number; // 秒
}

// ========================================
// RefreshToken
// ========================================

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh Token 不能为空'),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // 秒
}

