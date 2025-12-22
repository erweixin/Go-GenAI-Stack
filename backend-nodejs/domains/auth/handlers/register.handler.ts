/**
 * Register Handler
 * HTTP 适配层：处理用户注册的 HTTP 请求
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { RegisterRequest } from '../http/dto/auth.js';
import { toRegisterInput, toRegisterResponse } from './converters.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * Register Handler
 * HTTP 适配层：处理用户注册的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function registerHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
): Promise<void> {
  // 1. 转换为 Domain Input
  const input = toRegisterInput(req.body);

  // 2. 创建请求上下文
  const ctx = createContextFromRequest({ ...req });

  // 3. 调用 Domain Service（错误会自动向上抛出，由全局错误处理中间件处理）
  const output = await deps.authService.register(ctx, input);

  // 3. 转换为 HTTP 响应
  reply.code(201).send(toRegisterResponse(output));
}
