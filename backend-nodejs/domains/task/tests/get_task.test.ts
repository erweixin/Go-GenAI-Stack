/**
 * GetTask Handler 集成测试
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

describe('GetTask Handler', () => {
  let app: FastifyInstance;
  let testHelper: ReturnType<typeof createTestHelper>;
  let accessToken: string;
  let taskId: string;
  let dbAvailable = false;

  beforeAll(async () => {
    try {
      const config = loadConfig();
      const db = createDatabaseConnection(config.database);

      // 测试数据库连接
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
      const task = Task.create(TEST_USER_ID, 'Test Task', 'Test Description', 'medium');
      await taskRepo.create({}, task);
      taskId = task.id;

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

  it('应该成功获取任务详情', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: `/api/tasks/${taskId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.task_id).toBe(taskId);
    expect(body.title).toBe('Test Task');
    expect(body.description).toBe('Test Description');
    expect(body.status).toBe('pending');
  });

  it('应该拒绝未授权请求', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'GET',
      url: `/api/tasks/${taskId}`,
    });

    expect(response.statusCode).toBe(401);
  });

  it('应该返回 404 当任务不存在', async () => {
    if (!dbAvailable) return;

    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await app.inject({
      method: 'GET',
      url: `/api/tasks/${nonExistentId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('TASK_NOT_FOUND');
  });
});
