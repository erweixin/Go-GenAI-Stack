/**
 * 错误码到 HTTP 状态码映射
 * 提供统一的错误码映射逻辑，避免代码重复
 */

/**
 * 根据错误码确定 HTTP 状态码
 *
 * 这个映射基于常见的错误码命名规范
 *
 * @param code 错误码（如 "TASK_NOT_FOUND", "UNAUTHORIZED"）
 * @returns HTTP 状态码
 *
 * @example
 * ```typescript
 * getHTTPStatusCode('TASK_NOT_FOUND') // => 404
 * getHTTPStatusCode('UNAUTHORIZED') // => 401
 * getHTTPStatusCode('VALIDATION_ERROR') // => 400
 * ```
 */
export function getHTTPStatusCode(code: string): number {
  // 根据错误码前缀或关键词判断
  const upperCode = code.toUpperCase();

  // 400 Bad Request
  if (
    upperCode.includes('INVALID_') ||
    upperCode.includes('EMPTY') ||
    upperCode.includes('TOO_LONG') ||
    upperCode.includes('TOO_MANY') ||
    upperCode.includes('DUPLICATE') ||
    upperCode.includes('ALREADY_') ||
    upperCode === 'VALIDATION_ERROR' ||
    upperCode === 'WEAK_PASSWORD'
  ) {
    return 400;
  }

  // 401 Unauthorized
  if (
    upperCode.includes('UNAUTHORIZED') ||
    upperCode.includes('INVALID_CREDENTIALS') ||
    upperCode.includes('INVALID_TOKEN') ||
    upperCode.includes('EXPIRED_')
  ) {
    return 401;
  }

  // 403 Forbidden
  if (
    upperCode.includes('FORBIDDEN') ||
    upperCode.includes('ACCESS') ||
    upperCode === 'USER_BANNED'
  ) {
    return 403;
  }

  // 404 Not Found
  if (upperCode.endsWith('_NOT_FOUND') || upperCode === 'NOT_FOUND') {
    return 404;
  }

  // 409 Conflict
  if (upperCode.endsWith('_EXISTS') || upperCode === 'CONFLICT') {
    return 409;
  }

  // 429 Too Many Requests
  if (upperCode.includes('RATE_LIMIT') || upperCode.includes('TOO_FREQUENT')) {
    return 429;
  }

  // 500 Internal Server Error
  if (
    upperCode.includes('_FAILED') ||
    upperCode === 'INTERNAL_ERROR' ||
    upperCode === 'INTERNAL_SERVER_ERROR' ||
    upperCode === 'DATABASE_ERROR' ||
    upperCode === 'SERVICE_ERROR'
  ) {
    return 500;
  }

  // 502 Bad Gateway
  if (upperCode.includes('EXTERNAL_')) {
    return 502;
  }

  // 503 Service Unavailable
  if (upperCode.includes('UNAVAILABLE')) {
    return 503;
  }

  // 默认 500
  return 500;
}
