/**
 * Auth 领域错误定义
 * 遵循 "ERROR_CODE: message" 格式
 */

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// 错误定义
export const AuthErrors = {
  INVALID_CREDENTIALS: new AuthError('INVALID_CREDENTIALS', '邮箱或密码错误'),
  INVALID_TOKEN: new AuthError('INVALID_TOKEN', 'Token 无效或已过期'),
  INVALID_REFRESH_TOKEN: new AuthError('INVALID_REFRESH_TOKEN', 'Refresh Token 无效或已过期'),
  INVALID_TOKEN_TYPE: new AuthError('INVALID_TOKEN_TYPE', 'Token 类型无效'),
  INVALID_SIGNING_METHOD: new AuthError('INVALID_SIGNING_METHOD', '签名算法无效'),
  INVALID_ISSUER: new AuthError('INVALID_ISSUER', 'Issuer 不匹配'),
};

/**
 * 解析错误码
 */
export function parseErrorCode(error: unknown): string {
  if (error instanceof AuthError) {
    return error.code;
  }
  if (error instanceof Error) {
    // 尝试从错误消息中提取错误码（格式：ERROR_CODE: message）
    const match = error.message.match(/^([A-Z_]+):/);
    if (match) {
      return match[1];
    }
  }
  return 'INTERNAL_ERROR';
}

