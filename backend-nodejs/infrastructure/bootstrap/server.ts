/**
 * 服务器初始化模块
 * 创建 Fastify 服务器实例并配置基础设置
 */

import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Logger as PinoLogger } from 'pino';
import type { Config } from '../config/config.js';
import type { Kysely } from 'kysely';
import type { Database } from '../persistence/postgres/database.js';
import type { RedisClientType } from 'redis';
import { checkHealth } from '../monitoring/health/health.js';
import type { AuthMiddleware } from '../middleware/types.js';
import { tracingMiddleware } from '../middleware/tracing.js';
import { metricsMiddleware, metricsResponseHook } from '../middleware/metrics.js';
import { register } from '../monitoring/metrics/metrics.js';
import { handleDomainError } from '../handler_utils/helpers.js';
import { getGlobalLogger } from '../monitoring/logger/logger.js';

// 导入各领域的 Handler Dependencies 类型
import type { HandlerDependencies as TaskHandlerDependencies } from '../../domains/task/handlers/dependencies.js';
import type { HandlerDependencies as UserHandlerDependencies } from '../../domains/user/handlers/dependencies.js';
import type { HandlerDependencies as AuthHandlerDependencies } from '../../domains/auth/handlers/dependencies.js';

/**
 * 创建 Fastify 服务器
 * 注册 Zod type provider 以支持直接使用 Zod schema
 *
 * @param config 应用配置
 * @param pinoLogger 可选的 Pino logger 实例（如果提供，将使用统一的 logger）
 */
export function createServer(config: Config, pinoLogger?: PinoLogger): FastifyInstance {
  // 如果提供了统一的 logger 实例，使用 loggerInstance；否则使用 logger 配置对象
  const fastifyOptions: { logger?: object; loggerInstance?: PinoLogger } = pinoLogger
    ? { loggerInstance: pinoLogger }
    : {
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
      };

  // 使用类型断言解决 Fastify 5.x 的类型兼容性问题
  // 当使用 loggerInstance 时，类型系统无法正确推断，需要显式断言
  const fastify = Fastify(
    fastifyOptions as Parameters<typeof Fastify>[0]
  ).withTypeProvider<ZodTypeProvider>();

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

  return fastify as unknown as FastifyInstance;
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
  // 使用 handler_utils/helpers.ts 的统一错误处理函数，确保响应格式一致
  fastify.setErrorHandler((error: Error, _request: FastifyRequest, reply: FastifyReply) => {
    // 使用统一的错误处理函数
    const logger = getGlobalLogger();
    // logger 是可选参数，使用条件调用避免 ESLint 误报
    if (logger) {
      handleDomainError(reply, error, logger);
    } else {
      handleDomainError(reply, error);
    }
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    const requestId = request.id;
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId,
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
  // 健康检查端点（禁用请求日志，避免每 5 秒产生日志噪音）
  fastify.get(
    '/health',
    {
      logLevel: 'silent',
    },
    async (_request: unknown, reply) => {
      const health = await checkHealth(db, redis);
      const statusCode = health.status === 'healthy' ? 200 : 503;
      return reply.code(statusCode).send(health);
    }
  );

  // Prometheus Metrics 端点（禁用请求日志，避免产生大量日志）
  fastify.get(
    '/metrics',
    {
      logLevel: 'silent',
    },
    async (_request: unknown, reply) => {
      reply.type('text/plain');
      return register.metrics();
    }
  );

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
 * 领域 Handler Dependencies 类型定义
 * 类型安全地定义所有领域的 Handler Dependencies
 */
export interface DomainHandlerDeps {
  task?: TaskHandlerDependencies;
  user?: UserHandlerDependencies;
  auth?: AuthHandlerDependencies;
}

/**
 * 注册领域路由
 * 接收类型安全的 HandlerDependencies 并注册所有领域路由
 *
 * @param fastify Fastify 实例
 * @param handlerDeps 领域 Handler Dependencies（类型安全）
 * @param authMiddleware 认证中间件
 * @param redis Redis 客户端（可选）
 */
export async function registerDomainRoutes(
  fastify: FastifyInstance,
  handlerDeps: DomainHandlerDeps,
  authMiddleware: AuthMiddleware,
  redis: RedisClientType | null = null
): Promise<void> {
  // 动态导入并注册 Task 路由
  if (handlerDeps.task) {
    const taskRouter = await import('../../domains/task/http/router.js');
    taskRouter.registerTaskRoutes(fastify, handlerDeps.task, authMiddleware);
  }

  // 动态导入并注册 User 路由
  if (handlerDeps.user) {
    const userRouter = await import('../../domains/user/http/router.js');
    userRouter.registerUserRoutes(fastify, handlerDeps.user, authMiddleware);
  }

  // 动态导入并注册 Auth 路由（不需要认证中间件）
  if (handlerDeps.auth) {
    const authRouter = await import('../../domains/auth/http/router.js');
    authRouter.registerAuthRoutes(fastify, handlerDeps.auth, redis);
  }
}
