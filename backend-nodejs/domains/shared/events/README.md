# 事件总线（Event Bus）

> 📌 **分布式友好但不分布式**：事件总线是领域间通信的核心机制

---

## 📖 概述

事件总线提供领域间解耦通信机制，实现"分布式友好但不分布式"架构。

### 核心原则

1. **领域间不直接调用**：Service 层不能直接调用其他领域的 Service
2. **事件驱动通信**：通过事件总线发布和订阅事件
3. **查询接口**：同步查询通过 Query Service（只读操作）

---

## 🚀 快速开始

### 1. 发布事件

```typescript
// domains/task/service/task_service.ts
import { TaskCreatedEvent } from '../events/task_events.js';
import type { EventBus } from '../../shared/events/event_bus.js';

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus
  ) {}

  async createTask(ctx: RequestContext, input: CreateTaskInput) {
    const task = await this.taskRepo.create(ctx, task);

    // 发布事件
    await this.eventBus.publish(
      ctx,
      new TaskCreatedEvent({
        taskId: task.id,
        userId: task.userId,
        title: task.title,
        priority: task.priority,
        createdAt: task.createdAt,
      })
    );

    return { task };
  }
}
```

### 2. 订阅事件

```typescript
// domains/user/service/user_service.ts
import { TaskCreatedEvent } from '../../task/events/task_events.js';
import type { EventBus } from '../../shared/events/event_bus.js';

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private eventBus: EventBus
  ) {
    // 在构造函数中订阅事件
    this.eventBus.subscribe('TaskCreated', async (ctx, event) => {
      const payload = event.payload as TaskCreatedPayload;
      // 处理任务创建事件（如更新用户统计）
      await this.updateUserTaskCount(ctx, payload.userId);
    });
  }
}
```

---

## 📝 事件定义

### 创建领域事件

```typescript
// domains/task/events/task_events.ts
import { BaseEvent } from '../../shared/events/types.js';

export interface TaskCreatedPayload {
  taskId: string;
  userId: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export class TaskCreatedEvent extends BaseEvent {
  constructor(payload: TaskCreatedPayload) {
    super('TaskCreated', 'task', payload);
  }
}
```

### 事件命名规范

- **事件类型**：使用 PascalCase（如 `TaskCreated`, `UserRegistered`）
- **事件来源**：使用小写领域名（如 `task`, `user`, `auth`）
- **事件 ID**：自动生成（时间戳 + 随机字符串）

---

## 🔄 领域间通信模式

### 模式 1：事件发布（异步，推荐）

**适用场景**：写操作、状态变更、通知

```typescript
// Task 领域发布事件
await eventBus.publish(ctx, new TaskCreatedEvent({ ... }));

// User 领域订阅事件
eventBus.subscribe('TaskCreated', async (ctx, event) => {
  // 异步处理（不阻塞 Task 领域）
});
```

### 模式 2：查询接口（同步，只读）

**适用场景**：需要同步验证、只读查询

```typescript
// domains/user/service/user_query_service.ts
export class UserQueryService {
  constructor(private userRepo: UserRepository) {}

  async getUser(userId: string): Promise<User | null> {
    return await this.userRepo.getById(ctx, userId);
  }
}

// Task 领域使用查询接口
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus,
    private userQueryService: UserQueryService // ✅ 查询接口
  ) {}

  async createTask(ctx: RequestContext, input: CreateTaskInput) {
    // 同步验证用户是否存在
    const user = await this.userQueryService.getUser(ctx, input.userId);
    if (!user) {
      throw createError('USER_NOT_FOUND', 'User not found');
    }

    // 创建任务并发布事件
    const task = await this.taskRepo.create(ctx, task);
    await this.eventBus.publish(ctx, new TaskCreatedEvent({ ... }));

    return { task };
  }
}
```

---

## ❌ 禁止的模式

### ❌ 直接调用其他领域的 Service

```typescript
// ❌ 错误：直接调用
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private userService: UserService // ❌ 跨领域依赖
  ) {}

  async createTask(ctx: RequestContext, input: CreateTaskInput) {
    const user = await this.userService.getUserProfile(ctx, { userId: input.userId }); // ❌ 直接调用
    // ...
  }
}
```

### ✅ 正确：使用查询接口或事件

```typescript
// ✅ 正确：使用查询接口（同步查询）
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private userQueryService: UserQueryService // ✅ 查询接口
  ) {}

  async createTask(ctx: RequestContext, input: CreateTaskInput) {
    const user = await this.userQueryService.getUser(ctx, input.userId); // ✅ 只读查询
    // ...
  }
}

// ✅ 正确：使用事件（异步通知）
await eventBus.publish(ctx, new TaskCreatedEvent({ ... }));
```

---

## 🔧 实现细节

### 内存事件总线（当前实现）

```typescript
// domains/shared/events/event_bus.ts
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Array<EventHandler>>();

  async publish(ctx: unknown, event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.allSettled(handlers.map(h => h(ctx, event)));
  }

  subscribe(eventType: string, handler: EventHandler): void {
    // 注册处理器
  }
}
```

### 未来扩展：Redis Pub/Sub

```typescript
// 未来可以替换为 Redis 实现
export class RedisEventBus implements EventBus {
  async publish(ctx: unknown, event: Event): Promise<void> {
    await redis.publish(`event:${event.type}`, JSON.stringify(event));
  }

  subscribe(eventType: string, handler: EventHandler): void {
    redis.subscribe(`event:${eventType}`, message => {
      const event = JSON.parse(message) as Event;
      handler(ctx, event);
    });
  }
}
```

---

## 📊 事件处理策略

### 错误处理

- 事件处理器错误不会中断其他处理器
- 错误会被记录到日志
- 建议实现重试机制（未来扩展）

### 性能考虑

- 事件处理器应该快速返回
- 耗时操作应该异步执行
- 避免在事件处理器中执行数据库事务（除非必要）

### 幂等性

- 事件应该包含唯一 ID
- 消费者应该记录已处理的事件 ID
- 实现幂等性检查（未来扩展）

---

## 🎯 最佳实践

1. **事件命名**：使用过去时态（`TaskCreated`, not `CreateTask`）
2. **事件负载**：只包含必要的数据，不要包含整个对象
3. **订阅位置**：在 Service 构造函数中订阅
4. **错误处理**：事件处理器应该处理自己的错误
5. **测试**：为事件发布和订阅编写测试

---

## 📚 参考

- [改造方案文档](../../DISTRIBUTED_READY_MIGRATION.md)
- [Go 后端事件总线实现](../../../backend/domains/shared/events/bus.go)
- [Task 领域事件定义](../../task/events.md)
- [User 领域事件定义](../../user/events.md)
