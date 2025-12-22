/**
 * DeleteTask Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import { toDeleteTaskInput, toDeleteTaskResponse } from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * DeleteTask Handler
 * HTTP 适配层：处理删除任务的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function deleteTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const userId = requireUserId(req);
  const taskId = req.params.id;

  const input = toDeleteTaskInput(userId, taskId);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.taskService.deleteTask(ctx, input);

  reply.code(200).send(toDeleteTaskResponse(output.success, output.deletedAt));
}
