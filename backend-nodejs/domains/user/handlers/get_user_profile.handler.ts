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
import { parseErrorCode } from '../errors/errors.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';

export async function getUserProfileHandler(
  deps: HandlerDependencies,
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 1. 获取用户 ID（从 JWT Token 中提取）
    const userId = requireUserId(req);

    // 2. 转换为 Domain Input
    const input = toGetUserProfileInput(userId);

    // 3. 调用 Domain Service
    const output = await deps.userService.getUserProfile(req, input);

    // 4. 转换为 HTTP 响应
    reply.code(200).send(toGetUserProfileResponse(output.user));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '获取用户资料失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'USER_NOT_FOUND') {
    return 404;
  }
  if (errorCode === 'UNAUTHORIZED') {
    return 401;
  }
  return 500;
}

