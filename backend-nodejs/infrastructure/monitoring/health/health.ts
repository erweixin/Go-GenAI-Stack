/**
 * 健康检查模块
 * 检查数据库、Redis 等服务的健康状态
 */

import type { Kysely } from 'kysely';
import type { Database } from '../../persistence/postgres/database.js';

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
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * 检查 Redis 健康状态（简化版，暂时返回 true）
 */
async function checkRedis(): Promise<boolean> {
  // TODO: 实现 Redis 健康检查
  return true;
}

/**
 * 执行健康检查
 */
export async function checkHealth(
  db: Kysely<Database>
): Promise<HealthStatus> {
  const [databaseOk, redisOk] = await Promise.all([
    checkDatabase(db),
    checkRedis(),
  ]);

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

