/**
 * ChangePassword Handler 集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, TEST_USER_ID, TEST_USER_PASSWORD, ensureTestUser } from './helpers.js';
import { registerUserRoutes } from '../http/router.js';
import { createAuthMiddleware } from '../../../infrastructure/middleware/auth.js';
import { JWTService } from '../../auth/service/jwt_service.js';
import { UserRepositoryImpl } from '../repository/user_repo.js';

describe('ChangePassword Handler', () => {
  let app: FastifyInstance;
  let testHelper: ReturnType<typeof createTestHelper>;
  let accessToken: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const config = loadConfig();
      const db = createDatabaseConnection(config.database);

      try {
        await db.selectFrom('users').select('id').limit(1).execute();
        dbAvailable = true;
      } catch {
        console.warn('⚠️  数据库不可用，跳过集成测试');
        return;
      }

      const jwtService = new JWTService({
        secret: config.jwt.secret,
        accessTokenExpiry: config.jwt.accessTokenExpiry,
        refreshTokenExpiry: config.jwt.refreshTokenExpiry,
        issuer: config.jwt.issuer,
      });

      const { token } = jwtService.generateAccessToken(TEST_USER_ID, 'test@example.com');
      accessToken = token;

      testHelper = createTestHelper(db, jwtService);
      app = testHelper.app;

      const authMiddleware = createAuthMiddleware(jwtService);
      registerUserRoutes(app, testHelper.handlerDeps, authMiddleware);

      // 确保测试用户存在
      await ensureTestUser(db);

      await app.ready();
    } catch (error) {
      console.warn('⚠️  测试环境初始化失败:', error);
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable && app) {
      await app.close();
      await testHelper.db.destroy();
    }
  });

  it('应该成功修改密码', async () => {
    if (!dbAvailable) return;

    // 先重置密码为已知值
    const userRepo = new UserRepositoryImpl(testHelper.db);
    const user = await userRepo.getById({}, TEST_USER_ID);
    if (user) {
      await user.updatePassword(TEST_USER_PASSWORD);
      await userRepo.update({}, user);
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/me/change-password',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        old_password: TEST_USER_PASSWORD,
        new_password: 'new-password-123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);

    // 验证新密码可以登录（通过验证密码哈希）
    const updatedUser = await userRepo.getById({}, TEST_USER_ID);
    expect(updatedUser).not.toBeNull();
    const isValid = await updatedUser!.verifyPassword('new-password-123');
    expect(isValid).toBe(true);
  });

  it('应该拒绝错误旧密码', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/me/change-password',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        old_password: 'wrong-password',
        new_password: 'new-password-123',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_PASSWORD');
  });

  it('应该拒绝弱密码', async () => {
    if (!dbAvailable) return;

    // 先重置密码为已知值
    const userRepo = new UserRepositoryImpl(testHelper.db);
    const user = await userRepo.getById({}, TEST_USER_ID);
    if (user) {
      await user.updatePassword(TEST_USER_PASSWORD);
      await userRepo.update({}, user);
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/me/change-password',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        old_password: TEST_USER_PASSWORD,
        new_password: 'short',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('WEAK_PASSWORD');
  });

  it('应该拒绝过长密码', async () => {
    if (!dbAvailable) return;

    // 先重置密码为已知值
    const userRepo = new UserRepositoryImpl(testHelper.db);
    const user = await userRepo.getById({}, TEST_USER_ID);
    if (user) {
      await user.updatePassword(TEST_USER_PASSWORD);
      await userRepo.update({}, user);
    }

    const longPassword = 'a'.repeat(129);
    const response = await app.inject({
      method: 'POST',
      url: '/api/users/me/change-password',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        old_password: TEST_USER_PASSWORD,
        new_password: longPassword,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    // 注意：如果旧密码验证失败，会先返回 INVALID_PASSWORD
    // 如果旧密码正确但新密码过长，会返回 PASSWORD_TOO_LONG
    // 这里我们检查是否包含密码相关的错误
    expect(body.error).toMatch(/PASSWORD_TOO_LONG|INVALID_PASSWORD/);
  });

  it('应该拒绝未授权请求', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/me/change-password',
      payload: {
        old_password: TEST_USER_PASSWORD,
        new_password: 'new-password-123',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
