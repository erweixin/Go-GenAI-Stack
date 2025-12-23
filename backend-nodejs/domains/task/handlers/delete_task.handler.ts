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
 * 负责日志记录和性能监控，使用 Fastify 的 request.log（自动包含请求上下文）
 * 错误由全局错误处理中间件统一处理
 */
export async function deleteTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  const userId = requireUserId(req);
  const taskId = req.params.id;

  req.log.info(
    {
      taskId,
      userId,
    },
    'Deleting task'
  );

  try {
    const input = toDeleteTaskInput(userId, taskId);
    const ctx = createContextFromRequest({ userId, ...req });
    const output = await deps.taskService.deleteTask(ctx, input);

    const duration = Date.now() - startTime;
    req.log.info(
      {
        taskId,
        userId,
        duration,
      },
      'Task deleted successfully'
    );

    if (duration > 1000) {
      req.log.warn(
        {
          taskId,
          duration,
          threshold: 1000,
        },
        'Slow task deletion'
      );
    }

    reply.code(200).send(toDeleteTaskResponse(output.success, output.deletedAt));
  } catch (error) {
    const duration = Date.now() - startTime;
    req.log.error(
      {
        taskId,
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to delete task'
    );
    throw error;
  }
}
