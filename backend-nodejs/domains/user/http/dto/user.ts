/**
 * User HTTP DTO
 * 定义 HTTP 请求和响应的数据结构
 */

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

export interface UpdateUserProfileRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

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

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

