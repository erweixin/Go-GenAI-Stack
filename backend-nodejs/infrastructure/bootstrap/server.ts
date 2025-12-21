/**
 * 服务器初始化模块
 * 创建 Fastify 服务器实例并配置基础设置
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import type { Config } from '../config/config.js';
import type { Kysely } from 'kysely';
import type { Database } from '../persistence/postgres/database.js';
import type { RedisClientType } from 'redis';
import { checkHealth } from '../monitoring/health/health.js';
import type { AuthMiddleware } from '../middleware/types.js';
import { isDomainError } from '../../shared/errors/errors.js';
import { tracingMiddleware } from '../middleware/tracing.js';
import { metricsMiddleware, metricsResponseHook } from '../middleware/metrics.js';
import { register } from '../monitoring/metrics/metrics.js';

/**
 * 创建 Fastify 服务器
 * 注册 Zod type provider 以支持直接使用 Zod schema
 */
export function createServer(config: Config): FastifyInstance {
  const fastify = Fastify({
    logger: {
      level: config.server.env === 'production' ? 'info' : 'debug',
      transport:
        config.server.env === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // 注册自定义 validator compiler
  // 跳过 params 验证（因为 fastify-type-provider-zod 对 params 的支持有限）
  // 只验证 body 和 querystring
  fastify.setValidatorCompiler((opts: { schema: unknown; httpPart?: string }) => {
    // 如果是 params 验证，跳过（返回一个总是成功的验证器）
    if (opts.httpPart === 'params') {
      return () => ({ value: true });
    }
    // 对于 body 和 querystring，使用 Zod validator
    return validatorCompiler(opts as Parameters<typeof validatorCompiler>[0]);
  });
  
  // 注册 Zod serializer
  fastify.setSerializerCompiler(serializerCompiler);

  return fastify;
}

/**
 * 注册全局中间件
 */
export async function registerMiddleware(fastify: FastifyInstance): Promise<void> {
  // 请求追踪（必须在最前面，确保所有请求都有 TraceID/RequestID）
  fastify.addHook('onRequest', tracingMiddleware);

  // CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Metrics 中间件（记录请求开始时间）
  fastify.addHook('onRequest', metricsMiddleware);
  
  // Metrics 响应 Hook（记录请求指标）
  fastify.addHook('onResponse', metricsResponseHook);

  // Security headers (手动实现，因为 @fastify/helmet 不支持 Fastify 5)
  fastify.addHook('onRequest', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  });

  // Error handling (统一错误处理)
  fastify.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    }, 'Request error');

    // 处理领域错误
    if (isDomainError(error)) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // 处理其他错误（包含 statusCode 的 HTTP 错误）
    const httpError = error as Error & { statusCode?: number };
    const statusCode = httpError.statusCode || 500;
    const message = httpError.message || 'Internal Server Error';

    return reply.code(statusCode).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: statusCode === 500 ? 'Internal server error' : message,
      },
    });
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: {
        message: 'Route not found',
        statusCode: 404,
        path: request.url,
      },
    });
  });
}

/**
 * 注册路由
 */
export function registerRoutes(
  fastify: FastifyInstance,
  db: Kysely<Database>,
  redis: RedisClientType | null = null
): void {
  // 健康检查端点
  fastify.get('/health', async (_request: unknown, reply) => {
    const health = await checkHealth(db, redis);
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return reply.code(statusCode).send(health);
  });

  // Prometheus Metrics 端点
  fastify.get('/metrics', async (_request: unknown, reply) => {
    reply.type('text/plain');
    return register.metrics();
  });

  // 根路径
  fastify.get('/', async (_request: unknown, reply) => {
    return reply.send({
      service: 'go-genai-stack-nodejs',
      version: '0.1.0',
      status: 'running',
    });
  });
}

/**
 * 注册领域路由
 * 接收 HandlerDependencies 并注册所有领域路由
 */
export async function registerDomainRoutes(
  fastify: FastifyInstance,
  handlerDeps: Record<string, unknown>,
  authMiddleware: AuthMiddleware,
  redis: RedisClientType | null = null
): Promise<void> {
  // 动态导入并注册 Task 路由
  if (handlerDeps.task) {
    const taskRouter = await import('../../domains/task/http/router.js');
    taskRouter.registerTaskRoutes(
      fastify,
      handlerDeps.task as Parameters<typeof taskRouter.registerTaskRoutes>[1],
      authMiddleware as Parameters<typeof taskRouter.registerTaskRoutes>[2]
    );
  }

  // 动态导入并注册 User 路由
  if (handlerDeps.user) {
    const userRouter = await import('../../domains/user/http/router.js');
    userRouter.registerUserRoutes(
      fastify,
      handlerDeps.user as Parameters<typeof userRouter.registerUserRoutes>[1],
      authMiddleware as Parameters<typeof userRouter.registerUserRoutes>[2]
    );
  }

  // 动态导入并注册 Auth 路由（不需要认证中间件）
  if (handlerDeps.auth) {
    const authRouter = await import('../../domains/auth/http/router.js');
    authRouter.registerAuthRoutes(
      fastify,
      handlerDeps.auth as Parameters<typeof authRouter.registerAuthRoutes>[1],
      redis
    );
  }
}

