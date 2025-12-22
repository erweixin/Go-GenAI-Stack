/**
 * 统一测试基础设施
 * 提供测试数据库连接管理和通用测试辅助函数
 */

import type { Kysely } from 'kysely';
import type { Database } from '../persistence/postgres/database.js';
import { createDatabaseConnection } from '../persistence/postgres/connection.js';
import { loadConfig } from '../config/config.js';
import bcrypt from 'bcryptjs';

// ========== 测试数据库连接管理 ==========

let testDb: Kysely<Database> | null = null;

/**
 * 获取测试数据库连接
 * 使用单例模式，避免重复创建连接
 */
export async function getTestDatabase(): Promise<Kysely<Database>> {
  if (!testDb) {
    const config = loadConfig();

    // 使用测试数据库配置（从环境变量读取，默认使用主数据库）
    const testDbConfig = {
      host: process.env.TEST_DATABASE_HOST || config.database.host,
      port: parseInt(process.env.TEST_DATABASE_PORT || String(config.database.port), 10),
      user: process.env.TEST_DATABASE_USER || config.database.user,
      password: process.env.TEST_DATABASE_PASSWORD || config.database.password,
      database: process.env.TEST_DATABASE_NAME || config.database.database,
      sslMode: config.database.sslMode,
      maxConnections: 10, // 测试环境使用较少的连接数
      idleTimeout: config.database.idleTimeout,
      connectionTimeout: config.database.connectionTimeout,
    };

    testDb = createDatabaseConnection(testDbConfig);
  }
  return testDb;
}

/**
 * 清理测试数据库连接
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
}

// ========== 测试常量 ==========

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_USER_PASSWORD = 'test-password-123';
export const TEST_USER_USERNAME = 'testuser';
export const TEST_USER_FULL_NAME = 'Test User';

export const TEST_TASK_ID = '00000000-0000-0000-0000-000000000002';
export const TEST_TASK_TITLE = 'Test Task';
export const TEST_TASK_DESCRIPTION = 'Test Description';

// ========== 通用测试辅助函数 ==========

/**
 * 确保测试用户存在
 * 如果用户不存在，则创建它
 */
export async function ensureTestUser(db: Kysely<Database>): Promise<void> {
  const existingUser = await db
    .selectFrom('users')
    .select('id')
    .where('id', '=', TEST_USER_ID)
    .executeTakeFirst();

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    await db
      .insertInto('users')
      .values({
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        username: TEST_USER_USERNAME,
        password_hash: passwordHash,
        full_name: TEST_USER_FULL_NAME,
        avatar_url: null,
        status: 'active',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      })
      .execute();
  }
}

/**
 * 清理测试数据
 * 删除测试用户和所有相关数据
 */
export async function cleanupTestData(db: Kysely<Database>): Promise<void> {
  // 删除测试任务
  await db
    .deleteFrom('task_tags')
    .where('task_id', 'in', eb =>
      eb.selectFrom('tasks').select('id').where('user_id', '=', TEST_USER_ID)
    )
    .execute();

  await db.deleteFrom('tasks').where('user_id', '=', TEST_USER_ID).execute();

  // 删除测试用户
  await db.deleteFrom('users').where('id', '=', TEST_USER_ID).execute();
}

/**
 * 清理所有测试数据（更彻底）
 */
export async function cleanupAllTestData(db: Kysely<Database>): Promise<void> {
  // 删除所有任务标签
  await db.deleteFrom('task_tags').execute();

  // 删除所有任务
  await db.deleteFrom('tasks').execute();

  // 删除所有用户（除了系统用户）
  await db.deleteFrom('users').where('id', '!=', '00000000-0000-0000-0000-000000000000').execute();
}

/**
 * 重置测试数据库（清空所有表）
 * 注意：仅在测试环境中使用，生产环境禁用
 */
export async function resetTestDatabase(db: Kysely<Database>): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('resetTestDatabase should not be called in production');
  }

  // 按依赖顺序删除数据
  await db.deleteFrom('task_tags').execute();
  await db.deleteFrom('tasks').execute();
  await db.deleteFrom('users').execute();
}
