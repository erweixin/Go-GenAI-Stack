/**
 * Login Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { LoginRequest } from '../http/dto/auth.js';
import { toLoginInput, toLoginResponse } from './converters.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * Login Handler
 * HTTP 适配层：处理用户登录的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function loginHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
): Promise<void> {
  const input = toLoginInput(req.body);
  const ctx = createContextFromRequest({ ...req });
  const output = await deps.authService.login(ctx, input);

  reply.code(200).send(toLoginResponse(output));
}
