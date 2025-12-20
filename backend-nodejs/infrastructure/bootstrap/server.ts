/**
 * 服务器初始化模块
 * 创建 Fastify 服务器实例并配置基础设置
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import type { Config } from '../config/config.js';
import type { Kysely } from 'kysely';
import type { Database } from '../persistence/postgres/database.js';
import type { RedisClientType } from 'redis';
import { checkHealth } from '../monitoring/health/health.js';

/**
 * 创建 Fastify 服务器
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
  });

  return fastify;
}

/**
 * 注册全局中间件
 */
export async function registerMiddleware(fastify: FastifyInstance): Promise<void> {
  // CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Security headers (手动实现，因为 @fastify/helmet 不支持 Fastify 5)
  fastify.addHook('onRequest', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  });

  // Error handling (手动实现，因为 @fastify/sensible 不支持 Fastify 5)
  fastify.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
    }, 'Request error');

    reply.code(statusCode).send({
      error: {
        message,
        statusCode,
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
  authMiddleware: unknown
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
    authRouter.registerAuthRoutes(fastify, handlerDeps.auth as Parameters<typeof authRouter.registerAuthRoutes>[1]);
  }
}

