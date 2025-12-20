/**
 * UpdateTask Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { UpdateTaskRequest } from '../http/dto/task.js';
import {
  toUpdateTaskInput,
  toUpdateTaskResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';

export async function updateTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateTaskRequest;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const taskId = req.params.id;

    const input = toUpdateTaskInput(userId, taskId, req.body);
    const output = await deps.taskService.updateTask(req, input);

    reply.code(200).send(toUpdateTaskResponse(output.task));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '更新任务失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  // 先检查特定错误码
  if (errorCode === 'TASK_NOT_FOUND') {
    return 404;
  }
  if (errorCode === 'UNAUTHORIZED_ACCESS') {
    return 403;
  }
  // 再检查通用错误码
  if (errorCode.startsWith('TASK_') || errorCode === 'INVALID_PRIORITY' || errorCode === 'INVALID_DUE_DATE') {
    return 400;
  }
  return 500;
}

