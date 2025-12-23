/**
 * PostgreSQL 连接管理
 * 使用 Kysely 创建类型安全的数据库连接
 */

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './database.js';
import type { Config } from '../../config/config.js';
import { getGlobalLogger } from '../../monitoring/logger/logger.js';

/**
 * 创建数据库连接
 * 配置连接池并添加监控
 */
export function createDatabaseConnection(config: Config['database']): Kysely<Database> {
  // 计算最小连接数（最大连接数的 20%，至少 2 个）
  const minConnections = Math.max(2, Math.floor(config.maxConnections * 0.2));

  const pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.sslMode === 'require' ? { rejectUnauthorized: false } : false,
    max: config.maxConnections,
    min: minConnections, // 最小连接数
    idleTimeoutMillis: config.idleTimeout,
    connectionTimeoutMillis: config.connectionTimeout,
  });

  // 连接池事件监听和监控
  const logger = getGlobalLogger();

  pool.on('error', err => {
    logger?.error('Database pool error', {
      error: err.message,
      code: (err as { code?: string }).code,
    });
  });

  pool.on('connect', () => {
    logger?.debug('New database connection established', {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
    });
  });

  pool.on('acquire', () => {
    logger?.debug('Connection acquired from pool', {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
    });
  });

  pool.on('remove', () => {
    logger?.debug('Connection removed from pool', {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
    });
  });

  const dialect = new PostgresDialect({
    pool,
  });

  return new Kysely<Database>({
    dialect,
  });
}

/**
 * 测试数据库连接
 */
export async function testConnection(db: Kysely<Database>): Promise<boolean> {
  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
