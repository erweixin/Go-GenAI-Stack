/**
 * ListTasks Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { ListTasksQuery } from '../http/dto/task.js';
import {
  toListTasksInput,
  toListTasksResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';

export async function listTasksHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Querystring: ListTasksQuery }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const input = toListTasksInput(userId, req.query);
    const output = await deps.taskService.listTasks(req, input);

    reply.code(200).send(
      toListTasksResponse(
        output.tasks,
        output.totalCount,
        output.page,
        output.limit,
        output.hasMore
      )
    );
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '查询任务失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'INVALID_FILTER' || errorCode === 'INVALID_PAGINATION') {
    return 400;
  }
  return 500;
}

