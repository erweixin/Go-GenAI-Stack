/**
 * 依赖注入容器
 * 统一管理所有领域依赖，遵循 DDD 三层架构
 *
 * 依赖注入顺序（从内到外）：
 * 1. Repository Layer（基础设施层）：数据访问
 * 2. Domain Service Layer（领域层）：业务逻辑
 * 3. Handler Dependencies（Handler 层）：HTTP 适配
 *
 * 遵循依赖注入原则：外层依赖内层，内层不依赖外层
 */

import type { Kysely } from 'kysely';
import type { RedisClientType } from 'redis';
import type { Database } from '../persistence/postgres/database.js';
import type { Config } from '../config/config.js';

// Repository 实现
import { TaskRepositoryImpl } from '../../domains/task/repository/task_repo.js';
import { UserRepositoryImpl } from '../../domains/user/repository/user_repo.js';

// Service 层
import { TaskService } from '../../domains/task/service/task_service.js';
import { UserService } from '../../domains/user/service/user_service.js';
import { UserQueryService } from '../../domains/user/service/user_query_service.js';
import { JWTService } from '../../domains/auth/service/jwt_service.js';
import { AuthService } from '../../domains/auth/service/auth_service.js';

// Handler Dependencies
import type { HandlerDependencies as TaskHandlerDependencies } from '../../domains/task/handlers/dependencies.js';
import type { HandlerDependencies as UserHandlerDependencies } from '../../domains/user/handlers/dependencies.js';
import type { HandlerDependencies as AuthHandlerDependencies } from '../../domains/auth/handlers/dependencies.js';

// Middleware
import { createAuthMiddleware } from '../middleware/auth.js';

// Event Bus
import { createEventBus, type EventBus } from '../../domains/shared/events/event_bus.js';

/**
 * 应用依赖容器
 * 包含所有领域的 Handler Dependencies 和 Middleware
 */
export interface AppContainer {
  // 基础设施
  eventBus: EventBus;

  // Auth 领域
  authHandlerDeps: AuthHandlerDependencies;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;

  // User 领域
  userHandlerDeps: UserHandlerDependencies;

  // Task 领域
  taskHandlerDeps: TaskHandlerDependencies;
}

/**
 * 初始化应用依赖（DDD 三层架构）
 *
 * @param config 应用配置
 * @param db 数据库连接（Kysely）
 * @param _redis Redis 连接（可选，保留用于未来扩展）
 * @returns 应用依赖容器
 */
export function initDependencies(
  config: Config,
  db: Kysely<Database>,
  _redis: RedisClientType | null = null
): AppContainer {
  // ============================================
  // Infrastructure Layer（基础设施层）
  // ============================================

  // 事件总线（用于领域间通信）
  const eventBus = createEventBus();

  // ============================================
  // Repository Layer（基础设施层）：数据访问
  // ============================================
  const userRepo = new UserRepositoryImpl(db);
  const taskRepo = new TaskRepositoryImpl(db);

  // ============================================
  // Domain Service Layer（领域层）：业务逻辑
  // ============================================

  // JWT Service（用于 Token 生成和验证）
  const jwtService = new JWTService({
    secret: config.jwt.secret,
    accessTokenExpiry: config.jwt.accessTokenExpiry,
    refreshTokenExpiry: config.jwt.refreshTokenExpiry,
    issuer: config.jwt.issuer,
  });

  // Auth Service（依赖 User Repository 和 EventBus）
  const authService = new AuthService(userRepo, jwtService, eventBus);

  // User Query Service（用于其他领域同步查询用户信息）
  const userQueryService = new UserQueryService(userRepo);

  // User Service（依赖 EventBus）
  const userService = new UserService(userRepo, eventBus);

  // Task Service（依赖 EventBus 和 UserQueryService）
  const taskService = new TaskService(taskRepo, eventBus, userQueryService);

  // ============================================
  // Handler Dependencies（Handler 层）：HTTP 适配
  // ============================================
  const authHandlerDeps: AuthHandlerDependencies = {
    authService,
  };

  const userHandlerDeps: UserHandlerDependencies = {
    userService,
  };

  const taskHandlerDeps: TaskHandlerDependencies = {
    taskService,
  };

  // ============================================
  // Middleware
  // ============================================
  const authMiddleware = createAuthMiddleware(jwtService);

  // ============================================
  // Extension point: 其他领域依赖注入
  // ============================================
  // 示例：添加 LLM 领域
  //
  // const llmRepo = new LLMRepositoryImpl(db);
  // const llmService = new LLMService(llmRepo);
  // const llmHandlerDeps: LLMHandlerDependencies = {
  //   llmService,
  // };

  return {
    eventBus,
    authHandlerDeps,
    authMiddleware,
    userHandlerDeps,
    taskHandlerDeps,
  };
}
