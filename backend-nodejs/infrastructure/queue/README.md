# 队列模块（BullMQ）

基于 BullMQ 的任务队列实现，用于异步任务处理和请求削峰。

## 📖 概述

队列模块提供了完整的任务队列基础设施，支持：

- ✅ **请求削峰**：快速响应 HTTP 请求，异步处理耗时任务
- ✅ **任务调度**：支持延迟任务、优先级、重试机制
- ✅ **并发控制**：可配置 Worker 并发数
- ✅ **任务监控**：完整的日志和事件追踪
- ✅ **领域自注册**：各领域可以自行注册处理器（Registry Pattern）

## 🏗️ 架构设计

### 处理器注册模式（Registry Pattern）

采用**领域自注册模式**，各领域可以独立注册自己的队列处理器：

```
domains/{domain}/
├── queue/
│   └── processors.ts    # 领域处理器注册文件
│       └── registerProcessors()  # 注册函数
```

**优势**：

- ✅ 关注点分离：各领域管理自己的处理器
- ✅ 自动发现：bootstrap 自动扫描并注册
- ✅ 易于扩展：添加新领域无需修改核心代码
- ✅ 符合 DDD：领域自治，自包含

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend-nodejs
pnpm install
```

### 2. 配置环境变量

```bash
# .env
QUEUE_ENABLED=true
QUEUE_REDIS_DB=1              # 队列使用 DB 1，与缓存分离
QUEUE_WORKER_CONCURRENCY=10   # Worker 并发数
QUEUE_WORKER_MAX_RETRIES=3    # 最大重试次数
QUEUE_WORKER_RETRY_DELAY=5000 # 重试延迟（毫秒）
```

### 3. 为领域创建队列处理器

```typescript
// domains/task/queue/processors.ts
import { processorRegistry } from '../../../infrastructure/queue/registry.js';
import { processTaskCreated } from './task_created.processor.js';

export const TASK_CREATED_JOB_NAME = 'task-created';

/**
 * 注册 Task 领域的队列处理器
 *
 * 这个函数会被 bootstrap.ts 自动调用
 */
export function registerProcessors(): void {
  processorRegistry.register(TASK_CREATED_JOB_NAME, processTaskCreated);
}
```

### 4. 创建任务处理器

```typescript
// domains/task/queue/task_created.processor.ts
import type { Job } from 'bullmq';
import type { QueueTaskData, JobProcessor } from '../../../infrastructure/queue/types.js';

interface TaskCreatedData extends QueueTaskData {
  taskId: string;
  userId: string;
  title: string;
}

export const processTaskCreated: JobProcessor<TaskCreatedData> = async (
  job: Job<TaskCreatedData>
) => {
  const { taskId, userId, title } = job.data;

  // 处理任务创建后的业务逻辑
  console.log(`Processing task created: ${taskId} by user ${userId}`);

  // 更新进度
  await job.updateProgress(50);

  // 完成任务
  await job.updateProgress(100);
};
```

### 5. 使用队列客户端

```typescript
import { createQueueClient } from '../infrastructure/queue/client.js';
import { TASK_CREATED_JOB_NAME } from '../domains/task/queue/processors.js';

// 创建队列客户端
const queueClient = createQueueClient({
  host: 'localhost',
  port: 6379,
  db: 1,
});

// 添加任务到队列
const jobId = await queueClient.addJob(
  'default',
  TASK_CREATED_JOB_NAME,
  {
    taskId: 'unique-task-id',
    userId: 'user-123',
    title: 'New Task',
  },
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  }
);
```

## 📝 示例

### 请求削峰示例

```typescript
// handlers/send_email.handler.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { QueueClient } from '../../infrastructure/queue/index.js';

export async function sendEmailHandler(
  request: FastifyRequest<{ Body: SendEmailRequest }>,
  reply: FastifyReply
): Promise<void> {
  const queueClient = (request.server as any).queueClient as QueueClient;

  // 快速响应 202 Accepted
  const taskId = randomUUID();
  await queueClient.addJob('default', 'send-email', {
    taskId,
    to: request.body.to,
    subject: request.body.subject,
    body: request.body.body,
  });

  reply.code(202).send({
    taskId,
    status: 'pending',
  });
}
```

### 延迟任务示例

```typescript
// 延迟 1 小时后执行
await queueClient.addJob('default', 'send-reminder', data, {
  delay: 60 * 60 * 1000, // 1 小时
});
```

### 优先级任务示例

```typescript
// 高优先级任务
await queueClient.addJob('default', 'urgent-task', data, {
  priority: 100, // 数字越大优先级越高
});
```

## 🔧 配置选项

### 队列配置

| 环境变量                   | 说明                | 默认值 |
| -------------------------- | ------------------- | ------ |
| `QUEUE_ENABLED`            | 是否启用队列        | `true` |
| `QUEUE_REDIS_DB`           | 队列使用的 Redis DB | `1`    |
| `QUEUE_WORKER_CONCURRENCY` | Worker 并发数       | `10`   |
| `QUEUE_WORKER_MAX_RETRIES` | 最大重试次数        | `3`    |
| `QUEUE_WORKER_RETRY_DELAY` | 重试延迟（毫秒）    | `5000` |

### 任务选项

```typescript
interface QueueJobOptions {
  delay?: number; // 延迟执行时间（毫秒）
  priority?: number; // 任务优先级
  attempts?: number; // 最大重试次数
  backoff?: {
    // 重试策略
    type: 'fixed' | 'exponential';
    delay: number;
  };
  timeout?: number; // 任务超时时间（毫秒）
  jobId?: string; // 任务 ID（用于幂等性）
  removeOnComplete?: boolean | number; // 完成后移除策略
  removeOnFail?: boolean | number; // 失败后移除策略
}
```

## 🔄 处理器注册流程

### 自动发现机制

1. **Bootstrap 阶段**：`bootstrapQueueProcessors()` 自动扫描所有领域
2. **领域注册**：各领域的 `processors.ts` 中的 `registerProcessors()` 被调用
3. **注册表存储**：处理器注册到全局 `processorRegistry`
4. **Worker 启动**：从注册表获取所有处理器并启动 Worker

### 注册顺序

```
1. 领域处理器（生产环境）
   └─ domains/task/queue/processors.ts
   └─ domains/user/queue/processors.ts
   └─ ...

2. 示例处理器（开发环境）
   └─ infrastructure/queue/examples/processors.ts
```

## 📊 监控

### 日志

队列模块会自动记录以下事件：

- ✅ 处理器注册
- ✅ 任务入队
- ✅ 任务完成
- ✅ 任务失败
- ✅ Worker 错误
- ✅ 任务停滞

### 查看队列状态

可以使用 [Bull Board](https://github.com/felixmosh/bull-board) 可视化队列状态：

```bash
pnpm add @bull-board/fastify @bull-board/api
```

## 🧪 测试

运行队列相关测试：

```bash
pnpm test infrastructure/queue
```

## 📚 参考

- [BullMQ 文档](https://docs.bullmq.io/)
- [队列示例代码](./examples/)
- [测试用例](./__tests__/)
- [处理器注册示例](./examples/processors.ts)

## ⚠️ 注意事项

1. **Redis DB 分离**：队列使用 DB 1，缓存使用 DB 0，避免冲突
2. **幂等性**：重要任务应该使用 `jobId` 确保幂等性
3. **错误处理**：任务处理器应该妥善处理错误，避免无限重试
4. **资源清理**：应用关闭时应该调用 `queueClient.close()` 和 `workerManager.stopAll()`
5. **领域自治**：各领域应该在自己的 `queue/processors.ts` 中注册处理器，不要在其他地方硬编码

## 🎯 最佳实践

### ✅ 推荐做法

```typescript
// ✅ 正确：在领域内注册处理器
// domains/task/queue/processors.ts
export function registerProcessors(): void {
  processorRegistry.register('task-created', processTaskCreated);
}
```

### ❌ 不推荐做法

```typescript
// ❌ 错误：在 main.ts 中硬编码处理器
// cmd/server/main.ts
processors: {
  'task-created': processTaskCreated, // ❌ 不应该在这里
}
```
