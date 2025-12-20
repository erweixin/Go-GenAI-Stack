/**
 * Register Handler
 * HTTP 适配层：处理用户注册的 HTTP 请求
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HandlerDependencies } from './dependencies.js';
import type { RegisterRequest } from '../http/dto/auth.js';
import {
  toRegisterInput,
  toRegisterResponse,
} from './converters.js';
import { parseErrorCode } from '../errors/errors.js';

export async function registerHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    // 1. 解析 HTTP 请求
    const body = req.body;

    // 2. 转换为 Domain Input
    const input = toRegisterInput(body);

    // 3. 调用 Domain Service
    const output = await deps.authService.register(req, input);

    // 4. 转换为 HTTP 响应
    reply.code(201).send(toRegisterResponse(output));
  } catch (error) {
    const errorCode = parseErrorCode(error);
    const statusCode = getStatusCode(errorCode);
    reply.code(statusCode).send({
      error: errorCode,
      message: error instanceof Error ? error.message : '注册失败',
    });
  }
}

function getStatusCode(errorCode: string): number {
  if (errorCode === 'EMAIL_ALREADY_EXISTS' || errorCode === 'USERNAME_ALREADY_EXISTS' || errorCode === 'INVALID_EMAIL' || errorCode === 'WEAK_PASSWORD' || errorCode === 'INVALID_USERNAME') {
    return 400;
  }
  return 500;
}

