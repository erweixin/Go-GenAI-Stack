/**
 * 错误码常量
 * 与后端 backend/domains/shared/errors 保持一致
 */

export const ERROR_CODES = {
  /**
   * 通用错误
   */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',

  /**
   * 聊天相关错误
   */
  MESSAGE_EMPTY: 'MESSAGE_EMPTY',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  MESSAGE_FILTERED: 'MESSAGE_FILTERED',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  /**
   * LLM 相关错误
   */
  MODEL_NOT_AVAILABLE: 'MODEL_NOT_AVAILABLE',
  MODEL_TIMEOUT: 'MODEL_TIMEOUT',
  MODEL_RATE_LIMITED: 'MODEL_RATE_LIMITED',
  INVALID_SCHEMA: 'INVALID_SCHEMA',
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',

  /**
   * 限流和配额错误
   */
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  COST_LIMIT_EXCEEDED: 'COST_LIMIT_EXCEEDED',
} as const

/**
 * 错误码类型
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * 错误消息映射（中文）
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INTERNAL_ERROR: '服务器内部错误',
  INVALID_REQUEST: '请求参数无效',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '禁止访问',
  NOT_FOUND: '资源不存在',

  MESSAGE_EMPTY: '消息不能为空',
  MESSAGE_TOO_LONG: '消息过长',
  MESSAGE_FILTERED: '消息包含敏感内容',
  CONVERSATION_NOT_FOUND: '对话不存在',
  UNAUTHORIZED_ACCESS: '无权访问此对话',

  MODEL_NOT_AVAILABLE: '模型暂时不可用',
  MODEL_TIMEOUT: '模型响应超时',
  MODEL_RATE_LIMITED: '模型请求频率受限',
  INVALID_SCHEMA: 'Schema 格式无效',
  SCHEMA_VALIDATION_FAILED: 'Schema 验证失败',

  RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后再试',
  QUOTA_EXCEEDED: '已超出配额限制',
  COST_LIMIT_EXCEEDED: '已超出成本限制',
}

/**
 * 获取错误消息
 *
 * @example
 * getErrorMessage('MESSAGE_EMPTY') // "消息不能为空"
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || '未知错误'
}

/**
 * 判断是否为用户错误（4xx）
 */
export function isUserError(code: ErrorCode): boolean {
  const userErrors: ErrorCode[] = [
    'INVALID_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'MESSAGE_EMPTY',
    'MESSAGE_TOO_LONG',
    'MESSAGE_FILTERED',
    'CONVERSATION_NOT_FOUND',
    'UNAUTHORIZED_ACCESS',
  ]
  return userErrors.includes(code)
}

/**
 * 判断是否为服务器错误（5xx）
 */
export function isServerError(code: ErrorCode): boolean {
  const serverErrors: ErrorCode[] = ['INTERNAL_ERROR', 'MODEL_NOT_AVAILABLE', 'MODEL_TIMEOUT']
  return serverErrors.includes(code)
}

/**
 * 判断是否为限流错误
 */
export function isRateLimitError(code: ErrorCode): boolean {
  return [
    'RATE_LIMIT_EXCEEDED',
    'MODEL_RATE_LIMITED',
    'QUOTA_EXCEEDED',
    'COST_LIMIT_EXCEEDED',
  ].includes(code)
}
