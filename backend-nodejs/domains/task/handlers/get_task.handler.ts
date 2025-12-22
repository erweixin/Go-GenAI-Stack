/**
 * GetTask Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import { toGetTaskInput, toGetTaskResponse } from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * GetTask Handler
 * HTTP 适配层：处理获取任务详情的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function getTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const userId = requireUserId(req);
  const taskId = req.params.id;

  const input = toGetTaskInput(userId, taskId);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.taskService.getTask(ctx, input);

  reply.code(200).send(toGetTaskResponse(output.task));
}
