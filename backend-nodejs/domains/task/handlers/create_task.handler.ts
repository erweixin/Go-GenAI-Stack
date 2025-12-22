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
 * 错误由全局错误处理中间件统一处理
 */
export async function createTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  // 1. 获取用户 ID（从 JWT Token 中提取）
  const userId = requireUserId(req);

  // 2. 转换为 Domain Input
  const input = toCreateTaskInput(userId, req.body);

  // 3. 创建请求上下文
  const ctx = createContextFromRequest({ userId, ...req });

  // 4. 调用 Domain Service（错误会自动向上抛出，由全局错误处理中间件处理）
  const output = await deps.taskService.createTask(ctx, input);

  // 4. 转换为 HTTP 响应
  reply.code(200).send(toCreateTaskResponse(output.task));
}
