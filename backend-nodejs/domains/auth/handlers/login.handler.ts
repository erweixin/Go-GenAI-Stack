/**
 * Login Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { LoginRequest } from '../http/dto/auth.js';
import {
  toLoginInput,
  toLoginResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';

export async function loginHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const body = req.body;

    const input = toLoginInput(body);
    const output = await deps.authService.login(req, input);

    reply.code(200).send(toLoginResponse(output));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '登录失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'INVALID_CREDENTIALS') {
    return 401;
  }
  if (errorCode === 'USER_BANNED' || errorCode === 'USER_INACTIVE') {
    return 403;
  }
  return 500;
}

