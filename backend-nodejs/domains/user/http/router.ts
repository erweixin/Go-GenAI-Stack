/**
 * User 路由注册
 * 注册所有 User 相关的 HTTP 路由
 */

import type { FastifyInstance } from 'fastify';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import type { UpdateUserProfileRequest, ChangePasswordRequest } from './dto/user.js';
import { UpdateUserProfileRequestSchema, ChangePasswordRequestSchema } from './dto/user.js';
import { getUserProfileHandler } from '../handlers/get_user_profile.handler.js';
import { updateUserProfileHandler } from '../handlers/update_user_profile.handler.js';
import { changePasswordHandler } from '../handlers/change_password.handler.js';
import type { createAuthMiddleware } from '../../../infrastructure/middleware/auth.js';

/**
 * 注册 User 路由
 */
export function registerUserRoutes(
  app: FastifyInstance,
  deps: HandlerDependencies,
  authMiddleware: ReturnType<typeof createAuthMiddleware>
): void {
  // GET /api/users/me - 获取当前用户资料（需要认证）
  app.get('/api/users/me', { preHandler: authMiddleware }, async (req, reply) => {
    await getUserProfileHandler(deps, req, reply);
  });

  // PUT /api/users/me - 更新用户资料（需要认证）
  app.put<{ Body: UpdateUserProfileRequest }>(
    '/api/users/me',
    {
      preHandler: authMiddleware,
      schema: {
        body: UpdateUserProfileRequestSchema,
      },
    },
    async (req, reply) => {
      await updateUserProfileHandler(deps, req, reply);
    }
  );

  // POST /api/users/me/change-password - 修改密码（需要认证）
  app.post<{ Body: ChangePasswordRequest }>(
    '/api/users/me/change-password',
    {
      preHandler: authMiddleware,
      schema: {
        body: ChangePasswordRequestSchema,
      },
    },
    async (req, reply) => {
      await changePasswordHandler(deps, req, reply);
    }
  );
}
