/**
 * User 领域错误定义
 * 遵循 "ERROR_CODE: message" 格式
 */

export class UserError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'UserError';
  }
}

// 错误定义
export const UserErrors = {
  INVALID_EMAIL: new UserError('INVALID_EMAIL', '邮箱格式无效'),
  EMAIL_ALREADY_EXISTS: new UserError('EMAIL_ALREADY_EXISTS', '邮箱已被占用'),
  USERNAME_ALREADY_EXISTS: new UserError('USERNAME_ALREADY_EXISTS', '用户名已被占用'),
  INVALID_USERNAME: new UserError('INVALID_USERNAME', '用户名格式无效（3-30 字符，仅字母数字下划线）'),
  WEAK_PASSWORD: new UserError('WEAK_PASSWORD', '密码强度不足（至少 8 字符）'),
  PASSWORD_TOO_LONG: new UserError('PASSWORD_TOO_LONG', '密码过长（最多 128 字符）'),
  INVALID_PASSWORD: new UserError('INVALID_PASSWORD', '密码错误'),
  USER_NOT_FOUND: new UserError('USER_NOT_FOUND', '用户不存在'),
  USER_BANNED: new UserError('USER_BANNED', '用户已被禁用'),
  USER_INACTIVE: new UserError('USER_INACTIVE', '用户未激活'),
  FULL_NAME_TOO_LONG: new UserError('FULL_NAME_TOO_LONG', '全名过长（最多 100 字符）'),
  INVALID_AVATAR_URL: new UserError('INVALID_AVATAR_URL', '头像 URL 格式无效'),
};

/**
 * 解析错误码
 */
export function parseErrorCode(error: unknown): string {
  if (error instanceof UserError) {
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

