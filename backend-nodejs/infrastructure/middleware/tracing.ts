/**
 * 请求追踪中间件
 * 自动生成和传播 TraceID/RequestID，支持分布式追踪
 */

import { randomUUID } from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

// 扩展 FastifyRequest 类型，添加追踪信息
declare module 'fastify' {
  interface FastifyRequest {
    traceId?: string;
    requestId?: string;
  }
}

/**
 * 请求追踪中间件
 * 为每个请求生成 TraceID 和 RequestID，并添加到日志上下文和响应头
 */
export function tracingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  // 从请求头获取或生成 TraceID（支持分布式追踪）
  const traceId = (request.headers['x-trace-id'] as string) || randomUUID();
  const requestId = randomUUID();

  // 添加到请求对象
  request.traceId = traceId;
  request.requestId = requestId;

  // 添加到响应头（便于客户端追踪）
  reply.header('X-Trace-Id', traceId);
  reply.header('X-Request-Id', requestId);

  // 添加到日志上下文（所有后续日志都会包含这些字段）
  request.log = request.log.child({ traceId, requestId });

  done();
}
