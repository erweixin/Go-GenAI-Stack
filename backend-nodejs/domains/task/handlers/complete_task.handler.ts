/**
 * CompleteTask Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import {
  toCompleteTaskInput,
  toCompleteTaskResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';

export async function completeTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const taskId = req.params.id;

    const input = toCompleteTaskInput(userId, taskId);
    const output = await deps.taskService.completeTask(req, input);

    reply.code(200).send(toCompleteTaskResponse(output.task));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '完成任务失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'TASK_ALREADY_COMPLETED') {
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

