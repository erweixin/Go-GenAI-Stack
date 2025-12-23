/**
 * 限流中间件
 * 基于 Redis 的 API 限流保护，防止恶意请求和暴力破解
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RedisClientType } from 'redis';
import { createError } from '../../shared/errors/errors.js';

// 扩展 FastifyRequest 类型，添加 routerPath 属性（如果尚未定义）
declare module 'fastify' {
  interface FastifyRequest {
    routerPath?: string;
  }
}

/**
 * 限流配置选项
 */
export interface RateLimitOptions {
  /**
   * 时间窗口（毫秒）
   * 例如：60000 表示 1 分钟
   */
  windowMs: number;

  /**
   * 最大请求数
   * 在时间窗口内允许的最大请求数
   */
  max: number;

  /**
   * 自定义 key 生成器
   * 默认使用 IP + 路径
   */
  keyGenerator?: (request: FastifyRequest) => string;

  /**
   * 跳过限流的条件
   * 返回 true 时跳过限流检查
   */
  skip?: (request: FastifyRequest) => boolean;
}

/**
 * 创建限流中间件
 *
 * @param redis Redis 客户端（如果为 null，则跳过限流）
 * @param options 限流配置
 * @returns 限流中间件函数
 *
 * @example
 * ```typescript
 * const loginRateLimit = createRateLimitMiddleware(redis, {
 *   windowMs: 60 * 1000, // 1 分钟
 *   max: 5, // 最多 5 次
 *   keyGenerator: (req) => `ratelimit:login:${req.ip}`,
 * });
 * ```
 */
export function createRateLimitMiddleware(
  redis: RedisClientType | null,
  options: RateLimitOptions
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // E2E 测试环境或 NODE_ENV=test 时，跳过限流
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
    if (isTestEnv) {
      return;
    }

    // Redis 不可用时，跳过限流
    if (!redis) {
      return;
    }

    // 检查是否需要跳过限流
    if (options.skip && options.skip(request)) {
      return;
    }

    // 生成限流 key
    const keyGenerator =
      options.keyGenerator ||
      (req => {
        // 默认：IP + 路径
        const route = req.routerPath || req.url.split('?')[0];
        return `ratelimit:${req.ip}:${route}`;
      });

    const key = keyGenerator(request);

    // 增加计数器
    const current = await redis.incr(key);

    // 如果是第一次请求，设置过期时间
    if (current === 1) {
      await redis.expire(key, Math.ceil(options.windowMs / 1000));
    }

    // 添加响应头
    reply.header('X-RateLimit-Limit', options.max.toString());
    reply.header('X-RateLimit-Remaining', Math.max(0, options.max - current).toString());
    reply.header('X-RateLimit-Reset', new Date(Date.now() + options.windowMs).toISOString());

    // 超过限制，返回 429
    if (current > options.max) {
      reply.header('Retry-After', Math.ceil(options.windowMs / 1000).toString());
      throw createError('VALIDATION_ERROR', '请求过于频繁，请稍后再试', 429);
    }
  };
}

/**
 * 创建登录限流中间件
 * 同一 IP 每分钟最多 5 次登录尝试
 */
export function createLoginRateLimitMiddleware(redis: RedisClientType | null) {
  return createRateLimitMiddleware(redis, {
    windowMs: 60 * 1000, // 1 分钟
    max: 5, // 最多 5 次
    keyGenerator: req => `ratelimit:login:${req.ip}`,
  });
}

/**
 * 创建注册限流中间件
 * 同一 IP 每小时最多 3 次注册
 */
export function createRegisterRateLimitMiddleware(redis: RedisClientType | null) {
  return createRateLimitMiddleware(redis, {
    windowMs: 60 * 60 * 1000, // 1 小时
    max: 3, // 最多 3 次
    keyGenerator: req => `ratelimit:register:${req.ip}`,
  });
}

/**
 * 创建通用 API 限流中间件
 * 同一 IP 每分钟最多 100 次请求
 */
export function createApiRateLimitMiddleware(redis: RedisClientType | null) {
  return createRateLimitMiddleware(redis, {
    windowMs: 60 * 1000, // 1 分钟
    max: 100, // 最多 100 次
    keyGenerator: req => `ratelimit:api:${req.ip}`,
  });
}
