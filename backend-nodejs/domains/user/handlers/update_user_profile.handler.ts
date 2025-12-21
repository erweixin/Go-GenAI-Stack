/**
 * UpdateUserProfile Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { UpdateUserProfileRequest } from '../http/dto/user.js';
import {
  toUpdateUserProfileInput,
  toUpdateUserProfileResponse,
} from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * UpdateUserProfile Handler
 * HTTP 适配层：处理更新用户资料的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function updateUserProfileHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: UpdateUserProfileRequest }>,
  reply: FastifyReply
): Promise<void> {
  const userId = requireUserId(req);

  const input = toUpdateUserProfileInput(userId, req.body);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.userService.updateUserProfile(ctx, input);

  reply.code(200).send(toUpdateUserProfileResponse(output.user));
}

