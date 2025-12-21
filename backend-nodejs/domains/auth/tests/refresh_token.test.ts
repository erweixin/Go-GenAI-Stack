/**
 * RefreshToken Handler 集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, ensureTestUser } from './helpers.js';
import { registerAuthRoutes } from '../http/router.js';
import { JWTService } from '../service/jwt_service.js';
import { TEST_USER_ID } from '../../user/tests/helpers.js';

describe('RefreshToken Handler', () => {
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

  it('应该成功刷新 Token', async () => {
    if (!dbAvailable) return;

    // 生成 Refresh Token
    const { token: refreshToken } = testHelper.jwtService.generateRefreshToken(TEST_USER_ID);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refresh_token: refreshToken,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.access_token).toBeDefined();
    expect(body.refresh_token).toBeDefined();
    expect(body.expires_in).toBeGreaterThan(0);
  });

  it('应该拒绝无效 Refresh Token', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refresh_token: 'invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_REFRESH_TOKEN');
  });

  it('应该拒绝 Access Token 作为 Refresh Token', async () => {
    if (!dbAvailable) return;

    const { token: accessToken } = testHelper.jwtService.generateAccessToken(
      TEST_USER_ID,
      'test@example.com'
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refresh_token: accessToken,
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_REFRESH_TOKEN');
  });

  it('应该拒绝不存在的用户', async () => {
    if (!dbAvailable) return;

    const nonExistentUserId = '00000000-0000-0000-0000-000000000999';
    const { token: refreshToken } = testHelper.jwtService.generateRefreshToken(
      nonExistentUserId
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refresh_token: refreshToken,
      },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('USER_NOT_FOUND');
  });

  it('应该拒绝禁用用户的 Refresh Token', async () => {
    if (!dbAvailable) return;

    // 禁用测试用户
    const user = await testHelper.userRepo.getById({}, TEST_USER_ID);
    if (user) {
      user.deactivate();
      await testHelper.userRepo.update({}, user);
    }

    const { token: refreshToken } = testHelper.jwtService.generateRefreshToken(TEST_USER_ID);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refresh_token: refreshToken,
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
});

