/**
 * CompleteTask Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import {
  toCompleteTaskInput,
  toCompleteTaskResponse,
} from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * CompleteTask Handler
 * HTTP 适配层：处理完成任务的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function completeTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const userId = requireUserId(req);
  const taskId = req.params.id;

  const input = toCompleteTaskInput(userId, taskId);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.taskService.completeTask(ctx, input);

  reply.code(200).send(toCompleteTaskResponse(output.task));
}

