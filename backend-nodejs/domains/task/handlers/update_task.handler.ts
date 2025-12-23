/**
 * UpdateTask Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { UpdateTaskRequest } from '../http/dto/task.js';
import { toUpdateTaskInput, toUpdateTaskResponse } from './converters.js';
import {
  getUserIDFromRequest,
  getRequiredPathParam,
} from '../../../infrastructure/handler_utils/helpers.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * UpdateTask Handler
 * HTTP 适配层：处理更新任务的 HTTP 请求
 * 负责日志记录和性能监控，使用 Fastify 的 request.log（自动包含请求上下文）
 * 错误由全局错误处理中间件统一处理
 */
export async function updateTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateTaskRequest;
  }>,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  const userId = getUserIDFromRequest(req);
  const taskId = getRequiredPathParam(req, 'id');

  req.log.info(
    {
      taskId,
      userId,
      hasTitle: req.body.title !== undefined,
      hasDescription: req.body.description !== undefined,
      hasPriority: req.body.priority !== undefined,
      hasDueDate: req.body.due_date !== undefined,
      hasTags: req.body.tags !== undefined,
    },
    'Updating task'
  );

  try {
    const input = toUpdateTaskInput(userId, taskId, req.body);
    const ctx = createContextFromRequest({ userId, ...req });
    const output = await deps.taskService.updateTask(ctx, input);

    const duration = Date.now() - startTime;
    req.log.info(
      {
        taskId: output.task.id,
        userId: output.task.userId,
        duration,
      },
      'Task updated successfully'
    );

    if (duration > 1000) {
      req.log.warn(
        {
          taskId: output.task.id,
          duration,
          threshold: 1000,
        },
        'Slow task update'
      );
    }

    reply.code(200).send(toUpdateTaskResponse(output.task));
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
      'Failed to update task'
    );
    throw error;
  }
}
