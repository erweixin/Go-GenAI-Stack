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
export function createRedisConnection(
  config: Config['redis']
): RedisClientType {
  const client = createClient({
    socket: {
      host: config.host,
      port: config.port,
    },
    password: config.password || undefined,
    database: config.db,
  });

  // 错误处理
  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  return client as RedisClientType;
}

/**
 * 连接 Redis
 */
export async function connectRedis(
  client: RedisClientType
): Promise<void> {
  await client.connect();
}

/**
 * 测试 Redis 连接
 */
export async function testRedisConnection(
  client: RedisClientType
): Promise<boolean> {
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
export async function closeRedisConnection(
  client: RedisClientType
): Promise<void> {
  try {
    await client.quit();
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
}

