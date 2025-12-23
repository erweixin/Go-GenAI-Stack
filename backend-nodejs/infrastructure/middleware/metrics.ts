/**
 * Metrics 中间件
 * 记录 HTTP 请求的指标（QPS、延迟、错误率）
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { httpRequestCounter, httpRequestDuration } from '../monitoring/metrics/metrics.js';

// 扩展 FastifyRequest 类型，添加 metrics 相关属性
declare module 'fastify' {
  interface FastifyRequest {
    metricsStartTime?: number;
    routerPath?: string;
  }
}

/**
 * Metrics 中间件
 * 记录每个请求的指标
 * 使用 Fastify 的 onRequest hook 记录开始时间，onResponse hook 记录指标
 */
export async function metricsMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // 在请求对象上存储开始时间
  request.metricsStartTime = Date.now();
}

/**
 * Metrics 响应 Hook
 * 在响应发送后记录指标
 */
export async function metricsResponseHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const startTime = request.metricsStartTime;
  if (!startTime) {
    return; // 如果没有开始时间，跳过
  }

  const duration = (Date.now() - startTime) / 1000; // 转换为秒
  const method = request.method;
  // 获取路由路径（如果没有 routerPath，使用 URL 路径）
  const route = request.routerPath || request.url.split('?')[0]; // 移除查询参数
  const statusCode = reply.statusCode;

  // 记录请求计数
  httpRequestCounter.inc({
    method,
    route,
    status: statusCode.toString(),
  });

  // 记录请求延迟
  httpRequestDuration.observe(
    {
      method,
      route,
    },
    duration
  );
}
