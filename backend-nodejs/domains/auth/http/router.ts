/**
 * Auth 路由注册
 * 注册所有 Auth 相关的 HTTP 路由
 */

import type { FastifyInstance } from 'fastify';
import type { RedisClientType } from 'redis';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import type { RegisterRequest, LoginRequest, RefreshTokenRequest } from './dto/auth.js';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
} from './dto/auth.js';
import { registerHandler } from '../handlers/register.handler.js';
import { loginHandler } from '../handlers/login.handler.js';
import { refreshTokenHandler } from '../handlers/refresh_token.handler.js';
import {
  createLoginRateLimitMiddleware,
  createRegisterRateLimitMiddleware,
} from '../../../infrastructure/middleware/ratelimit.js';

/**
 * 注册 Auth 路由
 *
 * @param app Fastify 实例
 * @param deps Handler 依赖
 * @param redis Redis 客户端（可选，用于限流）
 */
export function registerAuthRoutes(
  app: FastifyInstance,
  deps: HandlerDependencies,
  redis: RedisClientType | null = null
): void {
  // 创建限流中间件
  const loginRateLimit = createLoginRateLimitMiddleware(redis);
  const registerRateLimit = createRegisterRateLimitMiddleware(redis);

  // POST /api/auth/register - 用户注册（限流：每小时最多 3 次）
  app.post<{ Body: RegisterRequest }>(
    '/api/auth/register',
    {
      preHandler: [registerRateLimit],
      schema: {
        body: RegisterRequestSchema,
      },
    },
    async (req, reply) => {
      await registerHandler(deps, req, reply);
    }
  );

  // POST /api/auth/login - 用户登录（限流：每分钟最多 5 次）
  app.post<{ Body: LoginRequest }>(
    '/api/auth/login',
    {
      preHandler: [loginRateLimit],
      schema: {
        body: LoginRequestSchema,
      },
    },
    async (req, reply) => {
      await loginHandler(deps, req, reply);
    }
  );

  // POST /api/auth/refresh - 刷新 Token（不需要限流，因为需要有效的 refresh token）
  app.post<{ Body: RefreshTokenRequest }>(
    '/api/auth/refresh',
    {
      schema: {
        body: RefreshTokenRequestSchema,
      },
    },
    async (req, reply) => {
      await refreshTokenHandler(deps, req, reply);
    }
  );
}
