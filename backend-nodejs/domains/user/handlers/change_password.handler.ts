/**
 * ChangePassword Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { ChangePasswordRequest } from '../http/dto/user.js';
import {
  toChangePasswordInput,
  toChangePasswordResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';

export async function changePasswordHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: ChangePasswordRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const input = toChangePasswordInput(userId, req.body);
    const output = await deps.userService.changePassword(req, input);

    reply.code(200).send(toChangePasswordResponse(output.success, output.message));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '修改密码失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'USER_NOT_FOUND') {
    return 404;
  }
  if (errorCode === 'INVALID_PASSWORD' || errorCode === 'WEAK_PASSWORD' || errorCode === 'PASSWORD_TOO_LONG') {
    return 400;
  }
  if (errorCode === 'UNAUTHORIZED') {
    return 401;
  }
  return 500;
}

