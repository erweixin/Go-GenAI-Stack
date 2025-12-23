/**
 * CreateTask Handler
 * HTTP 适配层：处理创建任务的 HTTP 请求
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { CreateTaskRequest } from '../http/dto/task.js';
import { toCreateTaskInput, toCreateTaskResponse } from './converters.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';
import { createContextFromRequest } from '../../../shared/types/context.js';

/**
 * CreateTask Handler
 * HTTP 适配层：处理创建任务的 HTTP 请求
 * 负责日志记录和性能监控，使用 Fastify 的 request.log（自动包含请求上下文）
 * 错误由全局错误处理中间件统一处理
 */
export async function createTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  const userId = requireUserId(req);

  // 使用 Fastify 的 request.log（自动包含 traceId, requestId）
  req.log.info(
    {
      userId,
      title: req.body.title,
      priority: req.body.priority,
      hasDueDate: !!req.body.due_date,
      tagCount: req.body.tags?.length || 0,
    },
    'Creating task'
  );

  try {
    // 转换为 Domain Input
    const input = toCreateTaskInput(userId, req.body);

    // 创建请求上下文
    const ctx = createContextFromRequest({ userId, ...req });

    // 调用 Domain Service（纯业务逻辑，不包含日志）
    const output = await deps.taskService.createTask(ctx, input);

    // 记录成功日志和性能指标
    const duration = Date.now() - startTime;
    req.log.info(
      {
        taskId: output.task.id,
        userId: output.task.userId,
        duration,
      },
      'Task created successfully'
    );

    // 慢操作警告
    if (duration > 1000) {
      req.log.warn(
        {
          taskId: output.task.id,
          duration,
          threshold: 1000,
        },
        'Slow task creation'
      );
    }

    // 转换为 HTTP 响应
    reply.code(200).send(toCreateTaskResponse(output.task));
  } catch (error) {
    // 记录错误日志
    const duration = Date.now() - startTime;
    req.log.error(
      {
        userId,
        title: req.body.title,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to create task'
    );
    throw error; // 由全局错误处理器处理
  }
}
