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
 * 负责日志记录和性能监控，使用 Fastify 的 request.log（自动包含请求上下文）
 * 错误由全局错误处理中间件统一处理
 */
export async function getTaskHandler(
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
    'Getting task'
  );

  try {
    const input = toGetTaskInput(userId, taskId);
    const ctx = createContextFromRequest({ userId, ...req });
    const output = await deps.taskService.getTask(ctx, input);

    const duration = Date.now() - startTime;
    req.log.info(
      {
        taskId: output.task.id,
        userId: output.task.userId,
        duration,
      },
      'Task retrieved successfully'
    );

    if (duration > 500) {
      req.log.warn(
        {
          taskId: output.task.id,
          duration,
          threshold: 500,
        },
        'Slow task retrieval'
      );
    }

    reply.code(200).send(toGetTaskResponse(output.task));
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
      'Failed to get task'
    );
    throw error;
  }
}
