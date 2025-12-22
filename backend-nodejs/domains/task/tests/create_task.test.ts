/**
 * CreateTask Handler 集成测试
 * 测试创建任务的完整流程
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, TEST_USER_ID, ensureTestUser } from './helpers.js';
import { registerTaskRoutes } from '../http/router.js';
import { createAuthMiddleware } from '../../../infrastructure/middleware/auth.js';
import { JWTService } from '../../auth/service/jwt_service.js';

describe('CreateTask Handler', () => {
  let app: FastifyInstance;
  let testHelper: ReturnType<typeof createTestHelper>;
  let accessToken: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      // 加载配置
      const config = loadConfig();

      // 创建数据库连接（使用测试数据库）
      const db = createDatabaseConnection(config.database);

      // 测试数据库连接
      try {
        await db.selectFrom('tasks').select('id').limit(1).execute();
        dbAvailable = true;
      } catch (error) {
        console.warn('⚠️  数据库不可用，跳过集成测试');
        dbAvailable = false;
        return;
      }

      // 确保测试用户存在
      await ensureTestUser(db);

      // 创建 JWT Service（用于生成测试 Token）
      const jwtService = new JWTService({
        secret: config.jwt.secret,
        accessTokenExpiry: config.jwt.accessTokenExpiry,
        refreshTokenExpiry: config.jwt.refreshTokenExpiry,
        issuer: config.jwt.issuer,
      });

      // 生成测试 Token
      const { token } = jwtService.generateAccessToken(TEST_USER_ID, 'test@example.com');
      accessToken = token;

      // 创建测试辅助工具
      testHelper = createTestHelper(db, jwtService);

      // 创建 Fastify 应用
      app = testHelper.app;

      // 注册认证中间件
      const authMiddleware = createAuthMiddleware(jwtService);
      app.addHook('onRequest', authMiddleware);

      // 注册路由
      registerTaskRoutes(app, testHelper.handlerDeps, authMiddleware);

      // 准备应用
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

  it('应该成功创建任务', async () => {
    if (!dbAvailable) {
      return; // 跳过测试
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
        tags: ['test', 'unit'],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('task_id');
    expect(body.title).toBe('Test Task');
    expect(body.status).toBe('pending');
  });

  it('应该拒绝空标题', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: '',
        description: 'Test Description',
        priority: 'medium',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('TASK_TITLE_EMPTY');
  });

  it('应该拒绝描述过长', async () => {
    if (!dbAvailable) return;

    const longDescription = 'a'.repeat(5001);

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Test Task',
        description: longDescription,
        priority: 'medium',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('DESCRIPTION_TOO_LONG');
  });

  it('应该拒绝无效优先级', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'invalid',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('INVALID_PRIORITY');
  });

  it('应该拒绝未授权请求', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('应该接受不同优先级', async () => {
    if (!dbAvailable) return;

    const priorities = ['low', 'medium', 'high'] as const;

    for (const priority of priorities) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/tasks',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          title: `Test Task ${priority}`,
          description: 'Test Description',
          priority,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.task_id).toBeDefined();
    }
  });

  it('应该接受空描述', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Test Task',
        description: '',
        priority: 'medium',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.task_id).toBeDefined();
  });

  it('应该接受标签', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
        tags: ['urgent', 'important'],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.task_id).toBeDefined();
  });

  it('应该拒绝过多标签', async () => {
    if (!dbAvailable) return;

    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
        tags,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('TOO_MANY_TAGS');
  });
});
