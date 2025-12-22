/**
 * Task 测试辅助工具
 * 提供测试所需的 Mock 数据和辅助函数
 */

import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import type { Kysely } from 'kysely';
import type { Database } from '../../../infrastructure/persistence/postgres/database.js';
import { TaskRepositoryImpl } from '../repository/task_repo.js';
import { TaskService } from '../service/task_service.js';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import { Task } from '../model/task.js';
import type { JWTService } from '../../auth/service/jwt_service.js';
import type { EventBus } from '../../shared/events/event_bus.js';
import { UserQueryService } from '../../user/service/user_query_service.js';
import { UserRepositoryImpl } from '../../user/repository/user_repo.js';
import bcrypt from 'bcryptjs';

// ========== 测试常量 ==========

// 使用有效的 UUID 格式（符合数据库 schema 要求）
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_TASK_ID = '00000000-0000-0000-0000-000000000002';
export const TEST_TASK_TITLE = 'Test Task';
export const TEST_TASK_DESCRIPTION = 'Test Description';
export const TEST_PRIORITY = 'medium' as const;
export const TEST_STATUS = 'pending' as const;

export const TEST_TAG_NAME_1 = 'urgent';
export const TEST_TAG_COLOR_1 = '#ff0000';
export const TEST_TAG_NAME_2 = 'important';
export const TEST_TAG_COLOR_2 = '#00ff00';

export const TEST_TIME = new Date('2025-01-01T00:00:00Z');

// ========== 测试辅助类 ==========

export interface TestHelper {
  db: Kysely<Database>;
  taskRepo: TaskRepositoryImpl;
  taskService: TaskService;
  handlerDeps: HandlerDependencies;
  app: FastifyInstance;
  jwtService: JWTService | null;
}

/**
 * 创建测试辅助工具
 * 
 * 注意：这里使用真实的数据库连接（测试数据库）
 * 在生产测试中，可以使用内存数据库或 Docker 测试容器
 */
export function createTestHelper(
  db: Kysely<Database>,
  jwtService?: JWTService,
  eventBus?: EventBus
): TestHelper {
  // 1. 创建 Repository
  const taskRepo = new TaskRepositoryImpl(db);
  const userRepo = new UserRepositoryImpl(db);

  // 2. 创建 EventBus（如果未提供，创建一个简单的 mock）
  const mockEventBus: EventBus = eventBus || {
    publish: async () => {},
    subscribe: () => {},
    unsubscribe: () => {},
    close: async () => {},
  };

  // 3. 创建 UserQueryService（用于 TaskService 验证用户存在性）
  const userQueryService = new UserQueryService(userRepo);

  // 4. 创建 Service
  const taskService = new TaskService(taskRepo, mockEventBus, userQueryService);

  // 5. 创建 Handler Dependencies
  const handlerDeps: HandlerDependencies = {
    taskService,
  };

  // 6. 创建 Fastify 应用
  const app = Fastify({
    logger: false, // 测试时禁用日志
  });

  return {
    db,
    taskRepo,
    taskService,
    handlerDeps,
    app,
    jwtService: jwtService || null,
  };
}

/**
 * 设置认证上下文（模拟 JWT 中间件）
 */
export function setAuthContext(app: FastifyInstance, userId: string): void {
  app.addHook('onRequest', async (request) => {
    // 模拟 JWT 中间件注入 user_id
    (request as any).userId = userId;
  });
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
    const passwordHash = await bcrypt.hash('test-password', 10);
    await db
      .insertInto('users')
      .values({
        id: TEST_USER_ID,
        email: 'test@example.com',
        username: null,
        password_hash: passwordHash,
        full_name: null,
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

// ========== 测试数据生成器 ==========

/**
 * 创建标准测试任务
 */
export function createTestTask(): Task {
  const task = Task.create(
    TEST_USER_ID,
    TEST_TASK_TITLE,
    TEST_TASK_DESCRIPTION,
    TEST_PRIORITY
  );
  return task;
}

/**
 * 创建带指定 ID 的测试任务
 */
export function createTestTaskWithId(id: string): Task {
  const task = createTestTask();
  (task as any).id = id;
  return task;
}

/**
 * 创建带标签的测试任务
 */
export function createTestTaskWithTags(tagNames: string[]): Task {
  const task = createTestTask();
  for (const tagName of tagNames) {
    task.addTag({
      name: tagName,
      color: '#808080',
    });
  }
  return task;
}

/**
 * 创建已完成的测试任务
 */
export function createCompletedTestTask(): Task {
  const task = createTestTask();
  task.complete();
  return task;
}

/**
 * 创建自定义字段的测试任务
 */
export function createTestTaskWithCustomFields(
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high'
): Task {
  return Task.create(TEST_USER_ID, title, description, priority);
}

