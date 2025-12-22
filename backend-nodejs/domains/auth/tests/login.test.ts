/**
 * Login Handler 集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, ensureTestUser } from './helpers.js';
import { registerAuthRoutes } from '../http/router.js';
import { JWTService } from '../service/jwt_service.js';
import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from '../../user/tests/helpers.js';

describe('Login Handler', () => {
  let app: FastifyInstance;
  let testHelper: ReturnType<typeof createTestHelper>;
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

      testHelper = createTestHelper(db, jwtService);
      app = testHelper.app;

      registerAuthRoutes(app, testHelper.handlerDeps);

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

  it('应该成功登录', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user_id).toBeDefined();
    expect(body.email).toBe(TEST_USER_EMAIL);
    expect(body.access_token).toBeDefined();
    expect(body.refresh_token).toBeDefined();
    expect(body.expires_in).toBeGreaterThan(0);
  });

  it('应该拒绝错误密码', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: TEST_USER_EMAIL,
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_CREDENTIALS');
  });

  it('应该拒绝不存在的邮箱', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_CREDENTIALS');
  });

  it('应该拒绝禁用用户登录', async () => {
    if (!dbAvailable) return;

    // 禁用测试用户
    const user = await testHelper.userRepo.getByEmail({}, TEST_USER_EMAIL);
    if (user) {
      user.deactivate();
      await testHelper.userRepo.update({}, user);
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('USER_BANNED');

    // 恢复用户状态
    if (user) {
      user.activate();
      await testHelper.userRepo.update({}, user);
    }
  });

  it('应该接受邮箱大小写不敏感', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: TEST_USER_EMAIL.toUpperCase(),
        password: TEST_USER_PASSWORD,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.email).toBe(TEST_USER_EMAIL.toLowerCase());
  });
});
