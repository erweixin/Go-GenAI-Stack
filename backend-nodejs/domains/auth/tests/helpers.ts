/**
 * Auth 测试辅助工具
 * 提供测试所需的 Mock 数据和辅助函数
 */

import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../../../infrastructure/persistence/postgres/database.js';
import { UserRepositoryImpl } from '../../user/repository/user_repo.js';
import { AuthService } from '../service/auth_service.js';
import { JWTService } from '../service/jwt_service.js';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import bcrypt from 'bcryptjs';
import { TEST_USER_ID, TEST_USER_EMAIL, TEST_USER_PASSWORD } from '../../user/tests/helpers.js';

// ========== 测试常量 ==========

export const TEST_NEW_USER_EMAIL = 'newuser@example.com';
export const TEST_NEW_USER_PASSWORD = 'new-password-123';
export const TEST_NEW_USER_USERNAME = 'newuser';

// ========== 测试辅助类 ==========

export interface TestHelper {
  db: Kysely<Database>;
  userRepo: UserRepositoryImpl;
  jwtService: JWTService;
  authService: AuthService;
  handlerDeps: HandlerDependencies;
  app: FastifyInstance;
}

/**
 * 创建测试辅助工具
 */
export function createTestHelper(
  db: Kysely<Database>,
  jwtService: JWTService
): TestHelper {
  // 1. 创建 Repository
  const userRepo = new UserRepositoryImpl(db);

  // 2. 创建 Auth Service
  const authService = new AuthService(userRepo, jwtService);

  // 3. 创建 Handler Dependencies
  const handlerDeps: HandlerDependencies = {
    authService,
  };

  // 4. 创建 Fastify 应用
  const app = Fastify({
    logger: false, // 测试时禁用日志
  });

  return {
    db,
    userRepo,
    jwtService,
    authService,
    handlerDeps,
    app,
  };
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
        username: 'testuser',
        password_hash: passwordHash,
        full_name: 'Test User',
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
 * 清理测试用户（用于注册测试）
 */
export async function cleanupTestUser(db: Kysely<Database>, email: string): Promise<void> {
  await db
    .deleteFrom('users')
    .where('email', '=', email.toLowerCase())
    .execute();
}

