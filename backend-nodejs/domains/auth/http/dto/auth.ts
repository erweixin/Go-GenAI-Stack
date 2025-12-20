/**
 * Auth HTTP DTO
 * 定义 HTTP 请求和响应的数据结构
 */

// ========================================
// Register
// ========================================

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

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

export interface LoginRequest {
  email: string;
  password: string;
}

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

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // 秒
}

