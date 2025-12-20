/**
 * UpdateUserProfile Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { UpdateUserProfileRequest } from '../http/dto/user.js';
import {
  toUpdateUserProfileInput,
  toUpdateUserProfileResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';
import { requireUserId } from '../../../infrastructure/middleware/auth.js';

export async function updateUserProfileHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: UpdateUserProfileRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const input = toUpdateUserProfileInput(userId, req.body);
    const output = await deps.userService.updateUserProfile(req, input);

    reply.code(200).send(toUpdateUserProfileResponse(output.user));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '更新用户资料失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'USER_NOT_FOUND') {
    return 404;
  }
  if (errorCode === 'USERNAME_ALREADY_EXISTS' || errorCode === 'INVALID_USERNAME' || errorCode === 'FULL_NAME_TOO_LONG' || errorCode === 'INVALID_AVATAR_URL') {
    return 400;
  }
  if (errorCode === 'UNAUTHORIZED') {
    return 401;
  }
  return 500;
}

