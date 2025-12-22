/**
 * DTO 转换层
 * HTTP DTO ↔ Domain Input/Output 的转换
 */

import type { User } from '../model/user.js';
import type {
  GetUserProfileResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../http/dto/user.js';
import type {
  GetUserProfileInput,
  UpdateUserProfileInput,
  ChangePasswordInput,
} from '../service/user_service.js';

// ========================================
// GetUserProfile 转换
// ========================================

export function toGetUserProfileInput(userId: string): GetUserProfileInput {
  return { userId };
}

export function toGetUserProfileResponse(user: User): GetUserProfileResponse {
  const response: GetUserProfileResponse = {
    user_id: user.id,
    email: user.email,
    status: user.status,
    email_verified: user.emailVerified,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };

  if (user.username) {
    response.username = user.username;
  }
  if (user.fullName) {
    response.full_name = user.fullName;
  }
  if (user.avatarURL) {
    response.avatar_url = user.avatarURL;
  }
  if (user.lastLoginAt) {
    response.last_login_at = user.lastLoginAt.toISOString();
  }

  return response;
}

// ========================================
// UpdateUserProfile 转换
// ========================================

export function toUpdateUserProfileInput(
  userId: string,
  req: UpdateUserProfileRequest
): UpdateUserProfileInput {
  return {
    userId,
    username: req.username,
    fullName: req.full_name,
    avatarURL: req.avatar_url,
  };
}

export function toUpdateUserProfileResponse(user: User): UpdateUserProfileResponse {
  const response: UpdateUserProfileResponse = {
    user_id: user.id,
    updated_at: user.updatedAt.toISOString(),
  };

  if (user.username) {
    response.username = user.username;
  }
  if (user.fullName) {
    response.full_name = user.fullName;
  }
  if (user.avatarURL) {
    response.avatar_url = user.avatarURL;
  }

  return response;
}

// ========================================
// ChangePassword 转换
// ========================================

export function toChangePasswordInput(
  userId: string,
  req: ChangePasswordRequest
): ChangePasswordInput {
  return {
    userId,
    oldPassword: req.old_password,
    newPassword: req.new_password,
  };
}

export function toChangePasswordResponse(
  success: boolean,
  message: string
): ChangePasswordResponse {
  return {
    success,
    message,
  };
}
