/**
 * ChangePassword Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { ChangePasswordRequest } from '../http/dto/user.js';
import { toChangePasswordInput, toChangePasswordResponse } from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * ChangePassword Handler
 * HTTP 适配层：处理修改密码的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function changePasswordHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: ChangePasswordRequest }>,
  reply: FastifyReply
): Promise<void> {
  const userId = requireUserId(req);

  const input = toChangePasswordInput(userId, req.body);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.userService.changePassword(ctx, input);

  reply.code(200).send(toChangePasswordResponse(output.success, output.message));
}
