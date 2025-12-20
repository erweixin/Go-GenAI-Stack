/**
 * Register Handler 集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, TEST_NEW_USER_EMAIL, cleanupTestUser } from './helpers.js';
import { registerAuthRoutes } from '../http/router.js';
import { JWTService } from '../service/jwt_service.js';

describe('Register Handler', () => {
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

      await app.ready();
    } catch (error) {
      console.warn('⚠️  测试环境初始化失败:', error);
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable && app) {
      // 清理测试用户
      await cleanupTestUser(testHelper.db, TEST_NEW_USER_EMAIL);
      await app.close();
      await testHelper.db.destroy();
    }
  });

  it('应该成功注册新用户', async () => {
    if (!dbAvailable) return;

    // 确保用户不存在
    await cleanupTestUser(testHelper.db, TEST_NEW_USER_EMAIL);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: TEST_NEW_USER_EMAIL,
        password: 'password123',
        username: 'newuser',
        full_name: 'New User',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.user_id).toBeDefined();
    expect(body.email).toBe(TEST_NEW_USER_EMAIL);
    expect(body.access_token).toBeDefined();
    expect(body.refresh_token).toBeDefined();
    expect(body.expires_in).toBeGreaterThan(0);
  });

  it('应该拒绝重复邮箱', async () => {
    if (!dbAvailable) return;

    // 先注册一个用户
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: TEST_NEW_USER_EMAIL,
        password: 'password123',
      },
    });

    // 尝试用相同邮箱注册
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: TEST_NEW_USER_EMAIL,
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('EMAIL_ALREADY_EXISTS');
  });

  it('应该拒绝无效邮箱', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'invalid-email',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_EMAIL');
  });

  it('应该拒绝弱密码', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'user@example.com',
        password: 'short',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('WEAK_PASSWORD');
  });

  it('应该接受可选字段', async () => {
    if (!dbAvailable) return;

    const email = `test${Date.now()}@example.com`;
    await cleanupTestUser(testHelper.db, email);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email,
        password: 'password123',
        // 不提供 username 和 full_name
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.user_id).toBeDefined();

    // 清理
    await cleanupTestUser(testHelper.db, email);
  });
});

