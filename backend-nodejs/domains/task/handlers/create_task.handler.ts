/**
 * CreateTask Handler
 * HTTP 适配层：处理创建任务的 HTTP 请求
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { CreateTaskRequest } from '../http/dto/task.js';
import {
  toCreateTaskInput,
  toCreateTaskResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';

export async function createTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // 1. 获取用户 ID（当前从请求头获取，后续可扩展为 JWT）
    const userId = (req.headers['x-user-id'] as string) || 'default-user';
    if (!userId) {
      reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: '未授权访问',
      });
      return;
    }

    // 2. 解析 HTTP 请求
    const body = req.body;

    // 3. 转换为 Domain Input
    const input = toCreateTaskInput(userId, body);

    // 4. 调用 Domain Service
    const output = await deps.taskService.createTask(req, input);

    // 5. 转换为 HTTP 响应
    reply.code(200).send(toCreateTaskResponse(output.task));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '创建任务失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode.startsWith('TASK_') || errorCode === 'INVALID_PRIORITY' || errorCode === 'INVALID_DUE_DATE') {
    return 400;
  }
  if (errorCode === 'TASK_NOT_FOUND') {
    return 404;
  }
  if (errorCode === 'UNAUTHORIZED_ACCESS') {
    return 403;
  }
  return 500;
}

