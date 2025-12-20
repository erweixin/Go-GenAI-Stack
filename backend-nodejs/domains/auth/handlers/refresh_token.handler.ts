/**
 * RefreshToken Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { RefreshTokenRequest } from '../http/dto/auth.js';
import {
  toRefreshTokenInput,
  toRefreshTokenResponse,
} from './converters.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * RefreshToken Handler
 * HTTP 适配层：处理刷新 Token 的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function refreshTokenHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: RefreshTokenRequest }>,
  reply: FastifyReply
): Promise<void> {
  const input = toRefreshTokenInput(req.body);
  const ctx = createContextFromRequest({ ...req });
  const output = await deps.authService.refreshToken(ctx, input);

  reply.code(200).send(toRefreshTokenResponse(output));
}

