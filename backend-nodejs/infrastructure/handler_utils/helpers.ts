/**
 * Handler 工具函数
 * 提供统一的错误处理、上下文提取等辅助功能
 * 
 * 功能：
 *   - 统一错误处理（HandleDomainError）
 *   - 错误码到 HTTP 状态码的自动映射
 *   - 从请求中提取用户 ID
 *   - 获取必需的路径参数
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { isDomainError, createError } from '../../shared/errors/errors.js';
import type { Logger } from '../../infrastructure/monitoring/logger/logger.js';

/**
 * HTTP 错误响应格式
 */
export interface ErrorResponse {
  error: string;              // 错误码
  message: string;            // 错误消息
  details?: string;          // 详细信息（可选）
  requestId?: string;        // 请求 ID（用于追踪）
}

/**
 * 统一处理领域错误，转换为 HTTP 响应
 * 
 * 支持两种错误格式：
 * 1. DomainError - 结构化错误（推荐）
 * 2. "ERROR_CODE: message" - 字符串格式错误（兼容现有代码）
 * 
 * @param reply Fastify Reply 对象
 * @param err 错误对象
 * @param logger 可选的 Logger 实例（用于记录错误日志）
 * 
 * @example
 * ```typescript
 * const output = await service.createTask(ctx, input);
 * if (err) {
 *   handleDomainError(reply, err, logger);
 *   return;
 * }
 * ```
 */
export function handleDomainError(
  reply: FastifyReply,
  err: unknown,
  logger?: Logger
): void {
  if (!err) {
    return;
  }

  // 获取请求 ID（用于追踪）
  const requestId = reply.request.id;

  // 1. 尝试解析为 DomainError
  if (isDomainError(err)) {
    // 记录错误日志
    if (logger) {
      logger.error('Domain error occurred', {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        metadata: err.metadata,
        requestId,
        path: reply.request.url,
        method: reply.request.method,
        // 只在非 4xx 错误时记录堆栈（减少日志噪音）
        stack: err.statusCode >= 500 ? err.stack : undefined,
      });
    }

    const response: ErrorResponse = {
      error: err.code,
      message: err.message,
      requestId,
    };
    reply.code(err.statusCode).send(response);
    return;
  }

  // 2. 尝试解析字符串格式错误 "ERROR_CODE: message"
  if (err instanceof Error) {
    const errMsg = err.message;
    const { code, message } = extractErrorFromString(errMsg);
    const statusCode = getHTTPStatusCode(code);

    // 记录错误日志
    if (logger) {
      logger.error('Error occurred', {
        code,
        message,
        statusCode,
        requestId,
        path: reply.request.url,
        method: reply.request.method,
        stack: statusCode >= 500 ? err.stack : undefined,
      });
    }

    const response: ErrorResponse = {
      error: code,
      message: message,
      requestId,
    };
    reply.code(statusCode).send(response);
    return;
  }

  // 3. 未知错误类型，返回 500
  if (logger) {
    logger.error('Unknown error occurred', {
      error: String(err),
      requestId,
      path: reply.request.url,
      method: reply.request.method,
    });
  }

  const response: ErrorResponse = {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    requestId,
  };
  reply.code(500).send(response);
}

/**
 * 从上下文中提取用户 ID
 * 
 * 从 JWT 中间件注入的上下文中获取 user_id
 * 
 * @param request Fastify Request 对象
 * @returns 用户 ID
 * @throws {DomainError} 如果用户未认证，抛出 UNAUTHORIZED 错误
 * 
 * @example
 * ```typescript
 * const userId = getUserIDFromRequest(request);
 * ```
 */
export function getUserIDFromRequest(request: FastifyRequest): string {
  // 从认证中间件注入的 request.userId 中获取
  // 认证中间件将用户 ID 存储在 request.userId（见 infrastructure/middleware/auth.ts）
  const userId = (request as FastifyRequest & { userId?: string }).userId;
  
  if (!userId) {
    throw createError('UNAUTHORIZED', 'User not authenticated');
  }

  const userIdStr = typeof userId === 'string' ? userId : String(userId);
  if (!userIdStr || userIdStr.trim() === '') {
    throw createError('INTERNAL_SERVER_ERROR', 'User ID type error', 500);
  }

  return userIdStr;
}

/**
 * 获取必需的路径参数
 * 
 * 如果参数不存在或为空，返回错误
 * 
 * @param request Fastify Request 对象
 * @param paramName 参数名称
 * @returns 参数值
 * @throws {DomainError} 如果参数不存在或为空，抛出 INVALID_INPUT 错误
 * 
 * @example
 * ```typescript
 * const taskId = getRequiredPathParam(request, 'id');
 * ```
 */
export function getRequiredPathParam(
  request: FastifyRequest<{ Params: Record<string, string> }>,
  paramName: string
): string {
  const params = request.params as Record<string, string>;
  const value = params[paramName];

  if (!value || value.trim() === '') {
    throw createError('VALIDATION_ERROR', `Parameter ${paramName} cannot be empty`, 400);
  }

  return value;
}

/**
 * 获取必需的查询参数
 * 
 * @param request Fastify Request 对象
 * @param paramName 参数名称
 * @returns 参数值
 * @throws {DomainError} 如果参数不存在或为空，抛出 INVALID_INPUT 错误
 */
export function getRequiredQueryParam(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  paramName: string
): string {
  const query = request.query as Record<string, string>;
  const value = query[paramName];

  if (!value || value.trim() === '') {
    throw createError('VALIDATION_ERROR', `Query parameter ${paramName} cannot be empty`, 400);
  }

  return value;
}

/**
 * 获取可选的查询参数（带默认值）
 * 
 * @param request Fastify Request 对象
 * @param paramName 参数名称
 * @param defaultValue 默认值
 * @returns 参数值或默认值
 */
export function getOptionalQueryParam<T>(
  request: FastifyRequest<{ Querystring: Record<string, string> }>,
  paramName: string,
  defaultValue: T
): T {
  const query = request.query as Record<string, string>;
  const value = query[paramName];

  if (!value || value.trim() === '') {
    return defaultValue;
  }

  // 尝试类型转换
  if (typeof defaultValue === 'number') {
    const num = Number(value);
    return (isNaN(num) ? defaultValue : num) as T;
  }

  if (typeof defaultValue === 'boolean') {
    return (value === 'true' || value === '1') as T;
  }

  return value as T;
}

// ============================================
// 私有辅助函数
// ============================================

/**
 * 从错误消息中提取错误码和消息
 * 
 * 支持格式：
 * - "ERROR_CODE: message" → { code: "ERROR_CODE", message: "message" }
 * - "wrapper: ERROR_CODE: message" → { code: "ERROR_CODE", message: "message" }（递归提取）
 * - "message" → { code: "UNKNOWN_ERROR", message: "message" }
 */
function extractErrorFromString(errMsg: string): { code: string; message: string } {
  // 递归查找所有的冒号分隔的部分，找到第一个符合错误码格式的
  const parts = errMsg.split(':');
  
  for (const part of parts) {
    const code = part.trim();
    // 验证是否是大写下划线格式（错误码规范）
    if (isUpperSnakeCase(code) && code.length > 3) {
      // 找到错误码后，提取消息（最后一个冒号后的内容）
      const messageIndex = errMsg.lastIndexOf(':');
      const message = messageIndex > 0 && messageIndex < errMsg.length - 1
        ? errMsg.substring(messageIndex + 1).trim()
        : errMsg;
      
      return { code, message };
    }
  }

  // 没有找到错误码，返回未知错误
  return {
    code: 'UNKNOWN_ERROR',
    message: errMsg,
  };
}

/**
 * 根据错误码确定 HTTP 状态码
 * 
 * 这个映射基于常见的错误码命名规范
 */
function getHTTPStatusCode(code: string): number {
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

/**
 * 检查字符串是否是大写下划线格式（ERROR_CODE）
 */
function isUpperSnakeCase(s: string): boolean {
  if (s.length === 0) {
    return false;
  }

  for (const c of s) {
    if (!((c >= 'A' && c <= 'Z') || c === '_' || (c >= '0' && c <= '9'))) {
      return false;
    }
  }

  return true;
}

