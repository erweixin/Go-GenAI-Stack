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
 * 负责日志记录和性能监控，使用 Fastify 的 request.log（自动包含请求上下文）
 * 错误由全局错误处理中间件统一处理
 */
export async function listTasksHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Querystring: ListTasksQuery }>,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  const userId = requireUserId(req);

  req.log.info(
    {
      userId,
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      priority: req.query.priority,
    },
    'Listing tasks'
  );

  try {
    const input = toListTasksInput(userId, req.query);
    const ctx = createContextFromRequest({ userId, ...req });
    const output = await deps.taskService.listTasks(ctx, input);

    const duration = Date.now() - startTime;
    req.log.info(
      {
        userId,
        taskCount: output.tasks.length,
        totalCount: output.totalCount,
        duration,
      },
      'Tasks listed successfully'
    );

    if (duration > 1000) {
      req.log.warn(
        {
          userId,
          taskCount: output.tasks.length,
          duration,
          threshold: 1000,
        },
        'Slow task listing'
      );
    }

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
  } catch (error) {
    const duration = Date.now() - startTime;
    req.log.error(
      {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to list tasks'
    );
    throw error;
  }
}
