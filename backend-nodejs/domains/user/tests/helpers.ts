/**
 * User 测试辅助工具
 * 提供测试所需的 Mock 数据和辅助函数
 */

import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../../../infrastructure/persistence/postgres/database.js';
import { UserRepositoryImpl } from '../repository/user_repo.js';
import { UserService } from '../service/user_service.js';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import { User } from '../model/user.js';
import type { JWTService } from '../../auth/service/jwt_service.js';
import bcrypt from 'bcryptjs';

// ========== 测试常量 ==========

// 使用有效的 UUID 格式（符合数据库 schema 要求）
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_USER_PASSWORD = 'test-password-123';
export const TEST_USER_USERNAME = 'testuser';
export const TEST_USER_FULL_NAME = 'Test User';

// ========== 测试辅助类 ==========

export interface TestHelper {
  db: Kysely<Database>;
  userRepo: UserRepositoryImpl;
  userService: UserService;
  handlerDeps: HandlerDependencies;
  app: FastifyInstance;
  jwtService: JWTService | null;
}

/**
 * 创建测试辅助工具
 */
export function createTestHelper(db: Kysely<Database>, jwtService?: JWTService): TestHelper {
  // 1. 创建 Repository
  const userRepo = new UserRepositoryImpl(db);

  // 2. 创建 Service
  const userService = new UserService(userRepo);

  // 3. 创建 Handler Dependencies
  const handlerDeps: HandlerDependencies = {
    userService,
  };

  // 4. 创建 Fastify 应用
  const app = Fastify({
    logger: false, // 测试时禁用日志
  });

  return {
    db,
    userRepo,
    userService,
    handlerDeps,
    app,
    jwtService: jwtService || null,
  };
}

// ========== 测试数据生成器 ==========

/**
 * 创建标准测试用户
 */
export async function createTestUser(): Promise<User> {
  return await User.create(TEST_USER_EMAIL, TEST_USER_PASSWORD);
}

/**
 * 创建带指定 ID 的测试用户
 */
export async function createTestUserWithId(id: string): Promise<User> {
  const user = await createTestUser();
  user.id = id;
  return user;
}

/**
 * 创建激活状态的测试用户
 */
export async function createActiveTestUser(): Promise<User> {
  const user = await createTestUser();
  user.activate();
  return user;
}

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
    // 创建测试用户
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

