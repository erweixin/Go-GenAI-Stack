/**
 * DTO 转换层
 * HTTP DTO ↔ Domain Input/Output 的转换
 */

import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../http/dto/auth.js';
import type {
  RegisterInput,
  RegisterOutput,
  LoginInput,
  LoginOutput,
  RefreshTokenInput,
  RefreshTokenOutput,
} from '../service/auth_service.js';

// ========================================
// Register 转换
// ========================================

export function toRegisterInput(req: RegisterRequest): RegisterInput {
  return {
    email: req.email,
    password: req.password,
    username: req.username,
    fullName: req.full_name,
  };
}

export function toRegisterResponse(output: RegisterOutput): RegisterResponse {
  return {
    user_id: output.userId,
    email: output.email,
    access_token: output.accessToken,
    refresh_token: output.refreshToken,
    expires_in: output.expiresIn,
  };
}

// ========================================
// Login 转换
// ========================================

export function toLoginInput(req: LoginRequest): LoginInput {
  return {
    email: req.email,
    password: req.password,
  };
}

export function toLoginResponse(output: LoginOutput): LoginResponse {
  return {
    user_id: output.userId,
    email: output.email,
    access_token: output.accessToken,
    refresh_token: output.refreshToken,
    expires_in: output.expiresIn,
  };
}

// ========================================
// RefreshToken 转换
// ========================================

export function toRefreshTokenInput(req: RefreshTokenRequest): RefreshTokenInput {
  return {
    refreshToken: req.refresh_token,
  };
}

export function toRefreshTokenResponse(output: RefreshTokenOutput): RefreshTokenResponse {
  return {
    access_token: output.accessToken,
    refresh_token: output.refreshToken,
    expires_in: output.expiresIn,
  };
}
