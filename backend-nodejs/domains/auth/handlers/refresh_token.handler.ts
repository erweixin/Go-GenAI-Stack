/**
 * RefreshToken Handler
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { RefreshTokenRequest } from '../http/dto/auth.js';
import {
  toRefreshTokenInput,
  toRefreshTokenResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';

export async function refreshTokenHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: RefreshTokenRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const body = req.body;

    const input = toRefreshTokenInput(body);
    const output = await deps.authService.refreshToken(req, input);

    reply.code(200).send(toRefreshTokenResponse(output));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '刷新 Token 失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'INVALID_REFRESH_TOKEN' || errorCode === 'INVALID_TOKEN') {
    return 401;
  }
  if (errorCode === 'USER_NOT_FOUND') {
    return 404;
  }
  if (errorCode === 'USER_BANNED' || errorCode === 'USER_INACTIVE') {
    return 403;
  }
  return 500;
}

