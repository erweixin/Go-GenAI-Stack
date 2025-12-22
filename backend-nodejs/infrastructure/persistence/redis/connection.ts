/**
 * Redis 连接管理
 * 使用 redis 客户端创建连接
 */

import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import type { Config } from '../../config/config.js';

/**
 * 创建 Redis 连接
 */
export function createRedisConnection(config: Config['redis']): RedisClientType {
  const client = createClient({
    socket: {
      host: config.host,
      port: config.port,
      // 设置连接超时，避免连接挂起
      connectTimeout: 5000, // 5 秒连接超时
      reconnectStrategy: retries => {
        // 最多重试 3 次
        if (retries > 3) {
          return new Error('Redis connection failed after 3 retries');
        }
        // 指数退避：100ms, 200ms, 400ms
        return Math.min(100 * Math.pow(2, retries), 1000);
      },
    },
    password: config.password || undefined,
    database: config.db,
  });

  // 错误处理
  client.on('error', err => {
    console.error('Redis Client Error:', err);
  });

  return client as RedisClientType;
}

/**
 * 连接 Redis
 * 设置超时以避免连接挂起
 */
export async function connectRedis(client: RedisClientType): Promise<void> {
  // 使用 Promise.race 设置连接超时
  let timeoutId: NodeJS.Timeout | null = null;
  const connectPromise = client.connect();
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Redis connection timeout after 10 seconds'));
    }, 10000); // 10 秒超时
  });

  try {
    await Promise.race([connectPromise, timeoutPromise]);
  } finally {
    // 清理超时定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * 测试 Redis 连接
 */
export async function testRedisConnection(client: RedisClientType): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedisConnection(client: RedisClientType): Promise<void> {
  try {
    await client.quit();
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}
