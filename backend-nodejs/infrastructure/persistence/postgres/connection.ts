/**
 * PostgreSQL 连接管理
 * 使用 Kysely 创建类型安全的数据库连接
 */

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './database.js';
import type { Config } from '../../config/config.js';

/**
 * 创建数据库连接
 */
export function createDatabaseConnection(config: Config['database']): Kysely<Database> {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.sslMode === 'require' ? { rejectUnauthorized: false } : false,
    max: config.maxConnections,
    idleTimeoutMillis: config.idleTimeout,
    connectionTimeoutMillis: config.connectionTimeout,
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
