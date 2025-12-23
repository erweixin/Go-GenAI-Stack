/**
 * JWT 认证中间件
 * 验证请求中的 Bearer Token 并提取用户信息
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTService } from '../../domains/auth/service/jwt_service.js';

// 扩展 FastifyRequest 类型，添加 user_id 和 email
// 注意：traceId 和 requestId 在 tracing.ts 中定义
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    email?: string;
    traceId?: string;
    requestId?: string;
  }
}

/**
 * 创建认证中间件
 */
export function createAuthMiddleware(jwtService: JWTService) {
  return async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // 1. 从 Header 中获取 Token
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: '缺少 Authorization 请求头',
        },
      });
      return;
    }

    // 2. 解析 Bearer Token
    if (!authHeader.startsWith('Bearer ')) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization 格式无效（应为 Bearer <token>）',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 3. 验证 JWT Token
    try {
      const claims = jwtService.verifyAccessToken(token);

      // 4. 提取用户信息并存储到请求对象
      request.userId = claims.user_id;
      request.email = claims.email;
    } catch (error) {
      reply.code(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: error instanceof Error ? error.message : 'Token 无效或已过期',
        },
      });
      return;
    }
  };
}

/**
 * 可选认证中间件
 * 如果有 Token 则验证，没有 Token 则放行
 * 用途：支持匿名访问的接口，但可以识别已登录用户
 */
export function createOptionalAuthMiddleware(jwtService: JWTService) {
  return async function optionalAuthMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const claims = jwtService.verifyAccessToken(token);
        // Token 有效，提取用户信息
        request.userId = claims.user_id;
        request.email = claims.email;
      } catch {
        // Token 无效时，不阻止请求，继续放行
      }
    }
  };
}

/**
 * 从请求中获取用户 ID
 */
export function getUserId(request: FastifyRequest): string | undefined {
  return request.userId;
}

/**
 * 要求用户 ID 存在（用于需要认证的端点）
 */
export function requireUserId(request: FastifyRequest): string {
  const userId = request.userId;
  if (!userId) {
    throw new Error('UNAUTHORIZED: 未授权访问');
  }
  return userId;
}
