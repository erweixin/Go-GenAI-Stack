/**
 * 健康检查模块
 * 检查数据库、Redis 等服务的健康状态
 */

import type { Kysely } from 'kysely';
import type { Database } from '../../persistence/postgres/database.js';
import type { RedisClientType } from 'redis';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  checks: {
    database: boolean;
    redis: boolean;
  };
  timestamp: string;
}

/**
 * 检查数据库健康状态
 */
async function checkDatabase(db: Kysely<Database>): Promise<boolean> {
  try {
    // 尝试查询一个简单的表（如果 users 表不存在，尝试 tasks 表）
    try {
      await db.selectFrom('users').select('id').limit(1).execute();
    } catch {
      // 如果 users 表不存在，尝试 tasks 表
      await db.selectFrom('tasks').select('id').limit(1).execute();
    }
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * 检查 Redis 健康状态
 */
async function checkRedis(redis: RedisClientType | null): Promise<boolean> {
  if (!redis) {
    return false;
  }
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * 执行健康检查
 */
export async function checkHealth(
  db: Kysely<Database>,
  redis: RedisClientType | null = null
): Promise<HealthStatus> {
  const [databaseOk, redisOk] = await Promise.all([checkDatabase(db), checkRedis(redis)]);

  const allOk = databaseOk && redisOk;

  return {
    status: allOk ? 'healthy' : 'unhealthy',
    service: 'go-genai-stack-nodejs',
    version: '0.1.0',
    checks: {
      database: databaseOk,
      redis: redisOk,
    },
    timestamp: new Date().toISOString(),
  };
}
