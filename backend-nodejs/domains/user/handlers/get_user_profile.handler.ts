/**
 * GetUserProfile Handler
 * HTTP 适配层：处理获取用户资料的 HTTP 请求
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import {
  toGetUserProfileInput,
  toGetUserProfileResponse,
} from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * GetUserProfile Handler
 * HTTP 适配层：处理获取用户资料的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function getUserProfileHandler(
  deps: HandlerDependencies,
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. 获取用户 ID（从 JWT Token 中提取）
  const userId = requireUserId(req);

  // 2. 转换为 Domain Input
  const input = toGetUserProfileInput(userId);

  // 3. 创建请求上下文
  const ctx = createContextFromRequest({ userId, ...req });

  // 4. 调用 Domain Service（错误会自动向上抛出，由全局错误处理中间件处理）
  const output = await deps.userService.getUserProfile(ctx, input);

  // 4. 转换为 HTTP 响应
  reply.code(200).send(toGetUserProfileResponse(output.user));
}

