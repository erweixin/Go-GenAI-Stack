/**
 * 统一错误处理机制
 * 定义领域错误类型和错误码，与 Go 后端保持一致
 */

/**
 * 领域错误类
 * 包含错误码、消息、HTTP 状态码和可选的元数据
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }

  /**
   * 序列化为日志友好格式
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * 错误码定义
 * 与 Go 后端的错误码保持一致
 */
export const ErrorCodes = {
  // Auth 错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',

  // User 错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_BANNED: 'USER_BANNED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  INVALID_EMAIL: 'INVALID_EMAIL',

  // Task 错误
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_TITLE_EMPTY: 'TASK_TITLE_EMPTY',
  TASK_ALREADY_COMPLETED: 'TASK_ALREADY_COMPLETED',
  TASK_ALREADY_DELETED: 'TASK_ALREADY_DELETED',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  INVALID_STATUS: 'INVALID_STATUS',

  // 通用错误
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

/**
 * 错误码类型
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 默认 HTTP 状态码映射
 */
const DEFAULT_STATUS_CODES: Record<string, number> = {
  // Auth 错误
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  INVALID_CREDENTIALS: 401,
  TOKEN_EXPIRED: 401,
  REFRESH_TOKEN_INVALID: 401,

  // User 错误
  USER_NOT_FOUND: 404,
  USER_BANNED: 403,
  EMAIL_ALREADY_EXISTS: 409,
  PASSWORD_TOO_SHORT: 400,
  INVALID_EMAIL: 400,

  // Task 错误
  TASK_NOT_FOUND: 404,
  TASK_TITLE_EMPTY: 400,
  TASK_ALREADY_COMPLETED: 400,
  TASK_ALREADY_DELETED: 400,
  INVALID_PRIORITY: 400,
  INVALID_STATUS: 400,

  // 通用错误
  INTERNAL_SERVER_ERROR: 500,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
};

/**
 * 创建领域错误
 *
 * @param code 错误码（ErrorCodes 中的键）
 * @param message 错误消息
 * @param statusCode 可选的 HTTP 状态码（如果不提供，使用默认值）
 * @param metadata 可选的错误元数据（如 userId, resourceId 等）
 * @returns DomainError 实例
 *
 * @example
 * ```typescript
 * throw createError('TASK_NOT_FOUND', 'Task with id 123 not found');
 * throw createError('UNAUTHORIZED', 'Invalid credentials', 401);
 * throw createError('TASK_NOT_FOUND', 'Task not found', undefined, { taskId: '123' });
 * ```
 */
export function createError(
  code: keyof typeof ErrorCodes,
  message: string,
  statusCode?: number,
  metadata?: Record<string, unknown>
): DomainError {
  const errorCode = ErrorCodes[code];
  const httpStatusCode = statusCode || DEFAULT_STATUS_CODES[errorCode] || 400;

  return new DomainError(errorCode, message, httpStatusCode, metadata);
}

/**
 * 检查错误是否为 DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * 从错误消息解析错误码和消息
 * 支持格式：ERROR_CODE: message
 *
 * @example
 * ```typescript
 * parseError('TASK_NOT_FOUND: Task with id 123 not found')
 * // => { code: 'TASK_NOT_FOUND', message: 'Task with id 123 not found' }
 * ```
 */
export function parseError(errorMessage: string): { code: string; message: string } {
  const colonIndex = errorMessage.indexOf(':');
  if (colonIndex === -1) {
    return { code: 'INTERNAL_SERVER_ERROR', message: errorMessage };
  }

  const code = errorMessage.substring(0, colonIndex).trim();
  const message = errorMessage.substring(colonIndex + 1).trim();

  return { code, message };
}

/**
 * 从错误消息创建 DomainError
 * 支持格式：ERROR_CODE: message
 *
 * @example
 * ```typescript
 * throw fromErrorMessage('TASK_NOT_FOUND: Task with id 123 not found');
 * ```
 */
export function fromErrorMessage(errorMessage: string): DomainError {
  const { code, message } = parseError(errorMessage);

  // 检查是否是已知的错误码
  const knownCode = Object.keys(ErrorCodes).find(
    key => ErrorCodes[key as keyof typeof ErrorCodes] === code
  ) as keyof typeof ErrorCodes | undefined;

  if (knownCode) {
    return createError(knownCode, message);
  }

  // 未知错误码，使用默认状态码
  return new DomainError(code, message, DEFAULT_STATUS_CODES[code] || 400);
}
