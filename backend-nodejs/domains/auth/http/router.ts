/**
 * Auth 路由注册
 * 注册所有 Auth 相关的 HTTP 路由
 */

import type { FastifyInstance } from 'fastify';
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

/**
 * 注册 Auth 路由
 */
export function registerAuthRoutes(
  app: FastifyInstance,
  deps: HandlerDependencies
): void {
  // POST /api/auth/register - 用户注册
  app.post<{ Body: RegisterRequest }>(
    '/api/auth/register',
    {
      schema: {
        body: RegisterRequestSchema,
      },
    },
    async (req, reply) => {
      await registerHandler(deps, req, reply);
    }
  );

  // POST /api/auth/login - 用户登录
  app.post<{ Body: LoginRequest }>(
    '/api/auth/login',
    {
      schema: {
        body: LoginRequestSchema,
      },
    },
    async (req, reply) => {
      await loginHandler(deps, req, reply);
    }
  );

  // POST /api/auth/refresh - 刷新 Token
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

