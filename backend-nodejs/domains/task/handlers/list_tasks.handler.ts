/**
 * ListTasks Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { ListTasksQuery } from '../http/dto/task.js';
import { toListTasksInput, toListTasksResponse } from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * ListTasks Handler
 * HTTP 适配层：处理列出任务的 HTTP 请求
 * 错误由全局错误处理中间件统一处理
 */
export async function listTasksHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Querystring: ListTasksQuery }>,
  reply: FastifyReply
): Promise<void> {
  const userId = requireUserId(req);

  const input = toListTasksInput(userId, req.query);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.taskService.listTasks(ctx, input);

  reply
    .code(200)
    .send(
      toListTasksResponse(
        output.tasks,
        output.totalCount,
        output.page,
        output.limit,
        output.hasMore
      )
    );
}
