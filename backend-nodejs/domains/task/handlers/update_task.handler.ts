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
  // 使用工具函数提取用户 ID 和路径参数
  const userId = getUserIDFromRequest(req);
  const taskId = getRequiredPathParam(req, 'id');

  const input = toUpdateTaskInput(userId, taskId, req.body);
  const ctx = createContextFromRequest({ userId, ...req });
  const output = await deps.taskService.updateTask(ctx, input);

  reply.code(200).send(toUpdateTaskResponse(output.task));
}
