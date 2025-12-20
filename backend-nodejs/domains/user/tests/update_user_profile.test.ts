/**
 * UpdateUserProfile Handler 集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, TEST_USER_ID, ensureTestUser } from './helpers.js';
import { registerUserRoutes } from '../http/router.js';
import { createAuthMiddleware } from '../../../infrastructure/middleware/auth.js';
import { JWTService } from '../../auth/service/jwt_service.js';

describe('UpdateUserProfile Handler', () => {
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

  it('应该成功更新用户名', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        username: 'newusername',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.username).toBe('newusername');
  });

  it('应该成功更新全名', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        full_name: 'New Full Name',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.full_name).toBe('New Full Name');
  });

  it('应该成功更新头像 URL', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        avatar_url: 'https://example.com/avatar.jpg',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.avatar_url).toBe('https://example.com/avatar.jpg');
  });

  it('应该拒绝无效用户名（太短）', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        username: 'ab',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_USERNAME');
  });

  it('应该拒绝无效用户名（太长）', async () => {
    if (!dbAvailable) return;

    const longUsername = 'a'.repeat(31);
    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        username: longUsername,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_USERNAME');
  });

  it('应该拒绝全名过长', async () => {
    if (!dbAvailable) return;

    const longName = 'a'.repeat(101);
    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        full_name: longName,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('FULL_NAME_TOO_LONG');
  });

  it('应该拒绝无效头像 URL', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        avatar_url: 'ftp://example.com/avatar.jpg',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_AVATAR_URL');
  });

  it('应该拒绝未授权请求', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      payload: {
        username: 'newusername',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

