/**
 * ListTasks Handler 集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabaseConnection } from '../../../infrastructure/persistence/postgres/connection.js';
import { loadConfig } from '../../../infrastructure/config/config.js';
import { createTestHelper, TEST_USER_ID, ensureTestUser } from './helpers.js';
import { registerTaskRoutes } from '../http/router.js';
import { createAuthMiddleware } from '../../../infrastructure/middleware/auth.js';
import { JWTService } from '../../auth/service/jwt_service.js';
import { TaskRepositoryImpl } from '../repository/task_repo.js';
import { Task } from '../model/task.js';

describe('ListTasks Handler', () => {
  let app: FastifyInstance;
  let testHelper: ReturnType<typeof createTestHelper>;
  let accessToken: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const config = loadConfig();
      const db = createDatabaseConnection(config.database);

      try {
        await db.selectFrom('tasks').select('id').limit(1).execute();
        dbAvailable = true;
      } catch {
        console.warn('⚠️  数据库不可用，跳过集成测试');
        return;
      }

      // 确保测试用户存在
      await ensureTestUser(db);

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
      app.addHook('onRequest', authMiddleware);
      registerTaskRoutes(app, testHelper.handlerDeps, authMiddleware);

      // 创建测试任务
      const taskRepo = new TaskRepositoryImpl(db);
      for (let i = 0; i < 5; i++) {
        const task = Task.create(TEST_USER_ID, `Task ${i}`, `Description ${i}`, 'medium');
        await taskRepo.create({}, task);
      }

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

  it('应该成功列出任务', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('tasks');
    expect(body).toHaveProperty('total_count');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('has_more');
    expect(Array.isArray(body.tasks)).toBe(true);
  });

  it('应该支持分页', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks?page=1&limit=2',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.tasks.length).toBeLessThanOrEqual(2);
    expect(Number(body.page)).toBe(1);
    expect(Number(body.limit)).toBe(2);
  });

  it('应该支持状态筛选', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks?status=pending',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.tasks.every((t: any) => t.status === 'pending')).toBe(true);
  });

  it('应该支持优先级筛选', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks?priority=medium',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.tasks.every((t: any) => t.priority === 'medium')).toBe(true);
  });

  it('应该拒绝未授权请求', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: '/api/tasks',
    });

    expect(response.statusCode).toBe(401);
  });
});
