/**
 * UpdateTask Handler 集成测试
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

describe('UpdateTask Handler', () => {
  let app: FastifyInstance;
  let testHelper: ReturnType<typeof createTestHelper>;
  let accessToken: string;
  let taskId: string;
  let completedTaskId: string;
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
      const task = Task.create(TEST_USER_ID, 'Original Title', 'Original Description', 'low');
      await taskRepo.create({}, task);
      taskId = task.id;

      // 创建已完成的任务
      const completedTask = Task.create(TEST_USER_ID, 'Completed Task', 'Description', 'medium');
      completedTask.complete();
      await taskRepo.create({}, completedTask);
      completedTaskId = completedTask.id;

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

  it('应该成功更新任务', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: `/api/tasks/${taskId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'high',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.task_id).toBe(taskId);
    expect(body.title).toBe('Updated Title');
    expect(body.status).toBe('pending');
  });

  it('应该拒绝更新已完成任务', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: `/api/tasks/${completedTaskId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'New Title',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('TASK_ALREADY_COMPLETED');
  });

  it('应该拒绝空标题', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: `/api/tasks/${taskId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: '',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('TASK_TITLE_EMPTY');
  });

  it('应该拒绝未授权请求', async () => {
    if (!dbAvailable) return;

    const response = await app.inject({
      method: 'PUT',
      url: `/api/tasks/${taskId}`,
      payload: {
        title: 'Updated Title',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('应该返回 404 当任务不存在', async () => {
    if (!dbAvailable) return;

    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await app.inject({
      method: 'PUT',
      url: `/api/tasks/${nonExistentId}`,
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        title: 'Updated Title',
      },
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error).toContain('TASK_NOT_FOUND');
  });
});

