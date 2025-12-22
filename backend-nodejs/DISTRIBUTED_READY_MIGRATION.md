# 分布式友好但不分布式 - 改造方案

> 🎯 **目标**：将项目改造成「分布式友好但不分布式」模式
> 
> **核心理念**：
> - 当前：单体应用，所有领域在同一个进程中
> - 未来：可以轻松拆分成微服务，无需大规模重构
> - 原则：领域边界清晰、事件驱动通信、无状态设计

---

## 📊 现状分析

### ✅ 已有优势

1. **领域边界清晰**：每个领域（domain）都是自包含的
2. **DDD 三层架构**：Handler → Service → Repository
3. **事件总线基础设施**：已有 `domains/shared/events` 框架
4. **依赖注入**：统一的依赖管理

### ❌ 需要改造的点

1. **领域间直接调用**：Service 层可能直接调用其他领域的 Service
2. **共享数据库连接**：所有领域共享同一个数据库连接和事务
3. **集中式依赖注入**：所有依赖在 `bootstrap/dependencies.ts` 中集中管理
4. **缺少事件驱动**：领域间通信可能使用直接调用而非事件
5. **配置未分离**：所有配置在全局 Config 中
6. **无状态设计不明确**：需要明确无状态原则

---

## 🎯 改造目标

### 核心原则

1. **领域自治**：每个领域可以独立运行（虽然当前在同一个进程）
2. **事件驱动**：领域间通过事件总线通信，不直接调用
3. **数据库隔离**：每个领域有独立的 Schema（可共享数据库实例）
4. **配置分离**：每个领域可以有自己的配置
5. **无状态设计**：服务本身无状态，状态存储在数据库/缓存中
6. **API 网关模式**：统一的 API 入口，内部可拆分

---

## 📋 改造清单

### 阶段 1：事件驱动通信（高优先级）

#### 1.1 实现事件总线（Node.js 版本）

**现状**：Go 后端已有事件总线，Node.js 后端需要实现

**需要实现**：
- `domains/shared/events/event_bus.ts` - 事件总线接口和实现
- `domains/shared/events/types.ts` - 事件类型定义
- 支持内存事件总线（当前）和未来扩展（Redis/Kafka）

**改造点**：
```typescript
// ❌ 当前：直接调用
// domains/task/service/task_service.ts
const user = await userService.getUser(userId);

// ✅ 改造后：通过事件或查询接口
// 方式1：发布事件（异步）
eventBus.publish(ctx, new TaskCreatedEvent({ userId, taskId }));

// 方式2：查询接口（同步，但通过接口而非直接调用）
const user = await userQueryService.getUser(userId);
```

#### 1.2 禁止领域间直接调用

**规则**：
- ❌ Service 层不能直接调用其他领域的 Service
- ✅ 只能通过事件总线或查询接口（Query Service）通信
- ✅ Handler 层可以调用多个领域的 Service（编排层）

**检查清单**：
- [ ] 检查所有 Service 文件，移除跨领域直接调用
- [ ] 将跨领域调用改为事件发布
- [ ] 创建查询接口（Query Service）用于同步查询

---

### 阶段 2：数据库隔离（中优先级）

#### 2.1 领域 Schema 分离

**现状**：所有领域共享同一个数据库 Schema

**改造方案**：
- 每个领域有独立的 Schema 前缀或命名空间
- 例如：`task_tasks`, `user_users`, `auth_sessions`
- 或使用 PostgreSQL Schema：`task.tasks`, `user.users`

**实现**：
```typescript
// infrastructure/persistence/postgres/database.ts
export interface Database {
  // Task 领域
  task_tasks: TaskTable;
  
  // User 领域
  user_users: UserTable;
  
  // Auth 领域
  auth_sessions: SessionTable;
}
```

#### 2.2 事务边界管理

**规则**：
- 每个领域的事务边界独立
- 跨领域操作使用 Saga 模式或最终一致性

**实现**：
```typescript
// ❌ 当前：跨领域事务
await db.transaction().execute(async (trx) => {
  await taskRepo.create(trx, task);
  await userRepo.update(trx, user); // 跨领域
});

// ✅ 改造后：领域内事务 + 事件
await taskRepo.create(db, task);
eventBus.publish(ctx, new TaskCreatedEvent({ userId, taskId }));
// User 领域订阅事件，在自己的事务中处理
```

---

### 阶段 3：配置分离（中优先级）

#### 3.1 领域配置分离

**现状**：所有配置在全局 `Config` 中

**改造方案**：
- 每个领域可以有自己的配置
- 全局配置只包含基础设施配置（数据库、Redis、日志等）
- 领域配置通过环境变量或配置文件加载

**实现**：
```typescript
// infrastructure/config/config.ts
export interface Config {
  // 基础设施配置
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  logging: LoggingConfig;
  
  // 领域配置（可选）
  domains?: {
    task?: TaskDomainConfig;
    user?: UserDomainConfig;
    auth?: AuthDomainConfig;
  };
}

// domains/task/config.ts
export interface TaskDomainConfig {
  maxTasksPerUser?: number;
  defaultPriority?: string;
  // ...
}
```

---

### 阶段 4：依赖注入重构（中优先级）

#### 4.1 领域级依赖注入

**现状**：所有依赖在 `bootstrap/dependencies.ts` 中集中管理

**改造方案**：
- 每个领域有自己的依赖注入函数
- 全局只负责基础设施依赖（数据库、Redis、事件总线）
- 领域依赖由领域自己管理

**实现**：
```typescript
// domains/task/dependencies.ts
export function initTaskDependencies(
  db: Kysely<Database>,
  eventBus: EventBus
): TaskHandlerDependencies {
  const taskRepo = new TaskRepositoryImpl(db);
  const taskService = new TaskService(taskRepo, eventBus);
  return { taskService };
}

// infrastructure/bootstrap/dependencies.ts
export function initDependencies(config: Config, db: Kysely<Database>, eventBus: EventBus) {
  // 只初始化基础设施
  const jwtService = new JWTService(config.jwt);
  
  // 初始化领域依赖
  const taskDeps = initTaskDependencies(db, eventBus);
  const userDeps = initUserDependencies(db, eventBus);
  const authDeps = initAuthDependencies(db, jwtService, eventBus);
  
  return { taskDeps, userDeps, authDeps };
}
```

---

### 阶段 5：API 网关模式（低优先级）

#### 5.1 统一 API 入口

**现状**：每个领域注册自己的路由

**改造方案**：
- 统一的 API 路由前缀：`/api/v1/`
- 领域路由通过命名空间区分：`/api/v1/tasks`, `/api/v1/users`
- 未来可以拆分为独立的 API Gateway

**实现**：
```typescript
// infrastructure/bootstrap/routes.ts
export function registerDomainRoutes(fastify: FastifyInstance, deps: AppContainer) {
  // 统一的 API 前缀
  fastify.register(async (fastify) => {
    fastify.register(taskRouter, { prefix: '/api/v1/tasks' });
    fastify.register(userRouter, { prefix: '/api/v1/users' });
    fastify.register(authRouter, { prefix: '/api/v1/auth' });
  });
}
```

---

### 阶段 6：无状态设计（低优先级）

#### 6.1 明确无状态原则

**规则**：
- 服务本身无状态
- 所有状态存储在数据库或缓存中
- Session 存储在 Redis 中，不在内存中

**检查清单**：
- [ ] 移除所有内存状态（如内存缓存、Session 存储）
- [ ] 确保所有状态持久化到数据库或 Redis
- [ ] 文档化无状态设计原则

---

## 🔧 实施步骤

### 步骤 1：实现事件总线（1-2 天）

1. 创建 `domains/shared/events/event_bus.ts`
2. 实现内存事件总线（InMemoryEventBus）
3. 在依赖注入中初始化事件总线
4. 更新文档

### 步骤 2：改造领域间通信（2-3 天）

1. 识别所有跨领域直接调用
2. 将同步调用改为事件发布
3. 创建查询接口（Query Service）用于同步查询
4. 更新测试

### 步骤 3：数据库隔离（1-2 天）

1. 重构数据库 Schema，添加领域前缀
2. 更新 Repository 实现
3. 更新迁移脚本

### 步骤 4：配置分离（1 天）

1. 重构配置结构
2. 添加领域配置支持
3. 更新环境变量文档

### 步骤 5：依赖注入重构（1-2 天）

1. 创建领域级依赖注入函数
2. 重构全局依赖注入
3. 更新文档

---

## 📝 代码示例

### 事件总线实现

```typescript
// domains/shared/events/event_bus.ts
export interface Event {
  type: string;
  source: string;
  payload: unknown;
  timestamp: Date;
  id: string;
}

export interface EventBus {
  publish(ctx: unknown, event: Event): Promise<void>;
  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void;
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Array<(event: Event) => Promise<void>>>();
  
  async publish(ctx: unknown, event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(h => h(event)));
  }
  
  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
}
```

### 领域间通信改造

```typescript
// ❌ 改造前：直接调用
// domains/task/service/task_service.ts
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private userService: UserService // ❌ 跨领域依赖
  ) {}
  
  async createTask(ctx: unknown, input: CreateTaskInput) {
    const user = await this.userService.getUser(ctx, input.userId); // ❌ 直接调用
    // ...
  }
}

// ✅ 改造后：事件驱动
// domains/task/service/task_service.ts
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus // ✅ 只依赖事件总线
  ) {}
  
  async createTask(ctx: unknown, input: CreateTaskInput) {
    const task = await this.taskRepo.create(ctx, task);
    
    // 发布事件，让其他领域订阅
    await this.eventBus.publish(ctx, {
      type: 'TaskCreated',
      source: 'task',
      payload: { taskId: task.id, userId: input.userId },
      timestamp: new Date(),
      id: generateId(),
    });
    
    return task;
  }
}

// domains/user/service/user_service.ts
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private eventBus: EventBus
  ) {
    // 订阅 Task 领域的事件
    this.eventBus.subscribe('TaskCreated', async (event) => {
      const { userId, taskId } = event.payload as { userId: string; taskId: string };
      // 处理任务创建事件（如更新用户统计）
      await this.updateUserTaskCount(userId);
    });
  }
}
```

### 查询接口（同步查询）

```typescript
// domains/user/service/user_query_service.ts
// 用于其他领域同步查询用户信息
export class UserQueryService {
  constructor(private userRepo: UserRepository) {}
  
  async getUser(userId: string): Promise<User | null> {
    return await this.userRepo.findById(userId);
  }
}

// domains/task/service/task_service.ts
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus,
    private userQueryService: UserQueryService // ✅ 通过查询接口，而非直接调用 Service
  ) {}
  
  async createTask(ctx: unknown, input: CreateTaskInput) {
    // 同步查询（只读操作）
    const user = await this.userQueryService.getUser(input.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND: User not found');
    }
    
    // 业务逻辑...
    const task = await this.taskRepo.create(ctx, task);
    
    // 异步事件（写操作）
    await this.eventBus.publish(ctx, new TaskCreatedEvent({ userId, taskId }));
    
    return task;
  }
}
```

---

## ✅ 检查清单

### 阶段 1：事件驱动通信
- [ ] 实现事件总线（InMemoryEventBus）
- [ ] 识别所有跨领域直接调用
- [ ] 将跨领域调用改为事件发布
- [ ] 创建查询接口（Query Service）
- [ ] 更新测试

### 阶段 2：数据库隔离
- [ ] 重构数据库 Schema，添加领域前缀
- [ ] 更新 Repository 实现
- [ ] 更新迁移脚本
- [ ] 文档化 Schema 分离策略

### 阶段 3：配置分离
- [ ] 重构配置结构
- [ ] 添加领域配置支持
- [ ] 更新环境变量文档

### 阶段 4：依赖注入重构
- [ ] 创建领域级依赖注入函数
- [ ] 重构全局依赖注入
- [ ] 更新文档

### 阶段 5：API 网关模式
- [ ] 统一 API 路由前缀
- [ ] 领域路由命名空间化
- [ ] 文档化 API 结构

### 阶段 6：无状态设计
- [ ] 移除所有内存状态
- [ ] 确保所有状态持久化
- [ ] 文档化无状态原则

---

## 🚀 未来扩展

### 拆分为微服务

当需要拆分为微服务时，只需要：

1. **独立部署**：每个领域打包为独立的服务
2. **事件总线升级**：从内存事件总线升级到 Redis/Kafka
3. **API 网关**：引入 API Gateway（如 Kong、Traefik）
4. **服务发现**：添加服务发现机制（如 Consul、etcd）
5. **配置中心**：使用配置中心（如 Consul、Vault）

**关键点**：由于架构已经"分布式友好"，拆分时只需要：
- 修改事件总线实现（从内存改为消息队列）
- 修改依赖注入（从进程内改为服务调用）
- 添加服务发现和配置中心

**无需大规模重构业务代码**！

---

## 📚 参考文档

- [事件驱动架构最佳实践](https://martinfowler.com/articles/201701-event-driven.html)
- [微服务拆分策略](https://microservices.io/patterns/decomposition/decompose-by-business-capability.html)
- [Saga 模式](https://microservices.io/patterns/data/saga.html)

---

**最后更新**：2025-01-XX

