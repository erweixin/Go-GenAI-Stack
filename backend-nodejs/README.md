# Go-GenAI-Stack Backend (Node.js)

> 🎯 **项目定位**：这是 Go-GenAI-Stack 的 **Node.js/TypeScript 实现版本**，采用 **Vibe-Coding-Friendly DDD** 架构。
>
> 与 Go 后端共享相同的架构理念和数据库 Schema，使用 **Fastify + Kysely + TypeScript** 技术栈实现。

---

## 📋 目录

- [快速开始](#-快速开始)
- [技术选型](#-技术选型)
- [项目结构](#-项目结构)
- [架构设计](#-架构设计)
- [开发指南](#-开发指南)
- [监控和安全](#-监控和安全)
- [与 Go 后端的关系](#-与-go-后端的关系)

---

## 🚀 快速开始

### 前置要求

- **Node.js** 22.0+
- **pnpm** 8.0+（推荐）或 npm/yarn
- **Docker & Docker Compose**（用于 PostgreSQL 和 Redis）
- **PostgreSQL 16+**（与 Go 后端共享同一数据库）

### 一键启动

```bash
# 1. 安装依赖
cd backend-nodejs
pnpm install

# 2. 配置环境变量（参考 env.example）
cp env.example .env

# 3. 确保数据库已启动（与 Go 后端共享）
cd ../docker
docker-compose up -d postgres redis

# 4. 启动开发服务器
pnpm dev
```

服务器将在 `http://localhost:8081` 启动（默认端口，避免与 Go 后端冲突）。

### 健康检查

```bash
curl http://localhost:8081/health
```

**预期输出**：

```json
{
  "status": "healthy",
  "service": "go-genai-stack-nodejs",
  "database": true,
  "redis": true,
  "version": "0.1.0"
}
```

---

## 🛠️ 技术选型

### 核心框架

| 模块         | 选型                                   | 说明                                                    |
| ------------ | -------------------------------------- | ------------------------------------------------------- |
| **Web 框架** | [Fastify](https://www.fastify.io/) 5.x | 高性能、低开销，原生支持 HTTP/2、SSE                    |
| **数据库**   | [Kysely](https://kysely.dev/)          | 类型安全的 SQL 查询构建器（符合项目"不使用 ORM"的理念） |
| **语言**     | TypeScript 5.0+                        | 类型安全，与前端共享类型定义                            |
| **运行时**   | Node.js 22.0+                          | 现代 Node.js 运行时                                     |

### 基础设施

| 模块           | 选型                                      | 说明                                         |
| -------------- | ----------------------------------------- | -------------------------------------------- |
| **缓存/状态**  | Redis 7+                                  | BullMQ Backend、分析结果缓存、Agent 运行状态 |
| **主数据库**   | PostgreSQL 16+                            | 与 Go 后端共享同一数据库 Schema              |
| **队列**       | [BullMQ](https://bullmq.io/)              | 异步任务调度、Agent 并发执行（可选）         |
| **Agent 框架** | [LangChain.js](https://js.langchain.com/) | LLM 编排框架（可选，用于 AI 功能）           |

### 开发工具

| 工具           | 用途                          |
| -------------- | ----------------------------- |
| **TypeScript** | 类型检查                      |
| **ESLint**     | 代码检查                      |
| **Prettier**   | 代码格式化                    |
| **Vitest**     | 单元测试                      |
| **tsx**        | TypeScript 执行器（开发模式） |

### 为什么选择这些技术？

#### ✅ Fastify（Web 框架）

- **高性能**：比 Express 快 2-3 倍，适合 API + Streaming
- **原生支持**：HTTP/2、SSE（Server-Sent Events）
- **TypeScript 友好**：完整的类型定义
- **插件体系**：清晰的插件架构，易于扩展

#### ✅ Kysely（数据库查询构建器）

- **类型安全**：编译时类型检查，避免 SQL 错误
- **符合项目理念**：不使用 ORM，直接构建 SQL（类似 Go 后端的 `database/sql`）
- **透明性**：SQL 清晰可见，AI 易于理解
- **性能**：无 ORM 开销，直接操作数据库

**示例**：

```typescript
// Kysely 查询（类型安全）
const task = await db.selectFrom('tasks').selectAll().where('id', '=', taskId).executeTakeFirst();

// 生成的 SQL 清晰可见
// SELECT * FROM tasks WHERE id = $1
```

#### ✅ TypeScript

- **类型安全**：编译时捕获错误
- **前后端共享**：与前端共享类型定义
- **AI 友好**：类型信息帮助 AI 理解代码结构

---

## 📁 项目结构

```
backend-nodejs/
├── cmd/
│   └── server/
│       └── main.ts              # 应用入口
│
├── domains/                     # 【领域层】DDD 领域
│   ├── task/                    # Task 领域（示例实现）★
│   │   ├── README.md            # 领域说明
│   │   ├── glossary.md          # 术语表
│   │   ├── rules.md             # 业务规则
│   │   ├── events.md            # 领域事件
│   │   ├── usecases.yaml        # 用例声明（AI 可读）★
│   │   ├── ai-metadata.json     # AI 元数据
│   │   │
│   │   ├── model/               # 领域模型
│   │   │   └── task.ts
│   │   │
│   │   ├── repository/          # 仓储（接口 + 实现）★
│   │   │   ├── interface.ts
│   │   │   └── task_repo.ts     # 使用 Kysely
│   │   │
│   │   ├── service/             # 【领域服务层】★ 核心
│   │   │   └── task_service.ts  # 业务逻辑实现
│   │   │
│   │   ├── handlers/            # 【HTTP 适配层】
│   │   │   ├── dependencies.ts  # Handler 依赖容器
│   │   │   ├── create_task.handler.ts
│   │   │   ├── update_task.handler.ts
│   │   │   └── ...
│   │   │
│   │   ├── http/                # HTTP 层
│   │   │   ├── dto/             # DTO（与 Go 后端共享 Schema）
│   │   │   │   └── task.ts
│   │   │   └── router.ts        # 路由注册
│   │   │
│   │   └── tests/               # 测试
│   │
│   ├── auth/                    # Auth 领域
│   ├── user/                    # User 领域
│   └── shared/                  # 共享组件
│       ├── events/              # 事件总线
│       └── types/               # 共享类型
│
├── infrastructure/              # 【基础设施层】
│   ├── bootstrap/               # 启动引导
│   │   ├── server.ts            # 服务器初始化
│   │   ├── database.ts          # 数据库连接（Kysely）
│   │   ├── redis.ts             # Redis 连接
│   │   ├── dependencies.ts      # 依赖注入
│   │   └── routes.ts            # 路由注册
│   │
│   ├── config/                  # 配置管理
│   │   ├── config.ts
│   │   └── loader.ts
│   │
│   ├── middleware/             # 中间件
│   │   ├── auth.ts              # 认证
│   │   ├── cors.ts              # CORS
│   │   ├── error_handler.ts     # 错误处理
│   │   ├── logger.ts            # 日志
│   │   ├── ratelimit.ts         # 限流
│   │   └── tracing.ts           # 追踪
│   │
│   ├── persistence/             # 持久化层
│   │   ├── postgres/
│   │   │   ├── connection.ts    # Kysely 连接
│   │   │   ├── database.ts      # 数据库类型定义
│   │   │   └── transaction.ts   # 事务管理
│   │   └── redis/
│   │       ├── connection.ts
│   │       └── cache.ts
│   │
│   └── monitoring/              # 可观测性
│       ├── health/              # 健康检查
│       ├── logger/               # 结构化日志
│       ├── metrics/              # Prometheus 指标
│       └── tracing/              # OpenTelemetry 追踪
│
├── shared/                      # 【共享代码】
│   └── errors/                  # 错误定义
│       └── errors.ts
│
├── scripts/                     # 开发脚本
│   ├── dev.sh                   # 开发模式启动
│   ├── test.sh                   # 运行测试
│   └── lint.sh                   # 代码检查
│
├── package.json
├── tsconfig.json
├── env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc.json
└── README.md
```

---

## 🏗️ 架构设计

### 核心原则

与 Go 后端保持一致：

1. **领域优先**：按业务领域垂直切分（Domain-First）
2. **三层架构**：Handler（薄）→ Service（厚）→ Repository（数据访问）
3. **自包含**：每个领域包含完整的实现
4. **显式知识**：6 个必需文件让业务规则可被 AI 理解
5. **声明式用例**：在 `usecases.yaml` 中声明用例
6. **类型安全**：使用 Kysely 构建类型安全的 SQL 查询

### 🎯 分布式友好但不分布式

> **核心理念**：当前是单体应用，但设计上支持未来轻松拆分为微服务，无需大规模重构。

#### 设计原则

1. **领域自治**：每个领域可以独立运行（虽然当前在同一个进程）
2. **事件驱动通信**：领域间通过事件总线通信，不直接调用 Service
3. **查询接口**：跨领域同步查询通过 Query Service（只读操作）
4. **无状态设计**：服务本身无状态，状态存储在数据库/缓存中
5. **清晰的领域边界**：每个领域自包含，不直接依赖其他领域

#### 领域间通信规则

**✅ 允许的模式**：

1. **事件发布（异步，推荐）**：

   ```typescript
   // 发布事件，让其他领域订阅
   await eventBus.publish(ctx, new TaskCreatedEvent({ ... }));
   ```

2. **查询接口（同步，只读）**：

   ```typescript
   // 使用 Query Service 进行同步查询
   const userExists = await userQueryService.userExists(ctx, userId);
   ```

3. **Repository 访问（同一领域内）**：
   ```typescript
   // AuthService 可以访问 UserRepository（这是 Auth 的核心职责）
   const user = await this.userRepo.getByEmail(ctx, email);
   ```

**❌ 禁止的模式**：

1. **Service 层直接调用其他领域的 Service**：

   ```typescript
   // ❌ 错误：跨领域直接调用
   export class TaskService {
     constructor(private userService: UserService) {} // ❌
   }
   ```

2. **跨领域事务**：
   ```typescript
   // ❌ 错误：跨领域事务
   await db.transaction().execute(async trx => {
     await taskRepo.create(trx, task);
     await userRepo.update(trx, user); // ❌
   });
   ```

#### 实现细节

**事件总线**：

- 当前使用 `InMemoryEventBus`（内存事件总线）
- 未来可以替换为分布式事件总线（如 RabbitMQ、Kafka）
- 领域代码无需修改

**查询接口**：

- 每个领域可以提供 Query Service 供其他领域使用
- 只提供只读查询，不提供写操作
- 例如：`UserQueryService` 供 Task 领域查询用户信息

**数据库**：

- 当前所有领域共享同一个数据库实例（推荐）
- 表名清晰，Schema 中有领域注释标识
- 未来可以拆分为独立数据库，只需修改连接配置

#### 未来演进路径

**当前**：单体应用，所有领域在同一个进程

```
┌─────────────────────────────────┐
│   Node.js Process               │
│  ┌─────────┐  ┌─────────┐     │
│  │  Task    │  │  User   │     │
│  │  Domain  │  │  Domain │     │
│  └─────────┘  └─────────┘     │
│       │              │          │
│       └──────┬───────┘          │
│              │                  │
│         EventBus                │
└──────────────┼──────────────────┘
               │
         ┌─────┴─────┐
         │ PostgreSQL │
         └───────────┘
```

**未来**：微服务架构，领域独立部署

```
┌──────────┐  ┌──────────┐
│  Task    │  │  User   │
│ Service  │  │ Service │
└────┬─────┘  └────┬─────┘
     │             │
     └──────┬──────┘
            │
    ┌───────┴───────┐
    │  Event Bus    │
    │ (RabbitMQ/    │
    │   Kafka)      │
    └───────┬───────┘
            │
    ┌───────┴───────┐
    │   Database    │
    │  (PostgreSQL) │
    └───────────────┘
```

**关键**：领域代码无需修改，只需替换事件总线实现和数据库连接配置。

#### 相关文档

- 📖 [分布式友好改造方案](DISTRIBUTED_READY_MIGRATION.md) - 详细的改造方案和检查清单
- 📖 [事件总线使用指南](domains/shared/events/README.md) - 事件总线的使用方法和示例
- 📖 [事件总线改造总结](EVENT_BUS_REFACTORING.md) - 已完成的改造总结

### 三层架构

```typescript
// Handler 层（薄）：仅 HTTP 适配
export async function createTaskHandler(
  request: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
) {
  const input: CreateTaskInput = {
    title: request.body.title,
    description: request.body.description,
    priority: request.body.priority,
  };

  const output = await taskService.createTask(request.server.db, input);

  return reply.code(200).send(output);
}

// Service 层（厚）：业务逻辑 ⭐
export class TaskService {
  async createTask(db: Database, input: CreateTaskInput): Promise<CreateTaskOutput> {
    // 1. 验证业务规则
    if (!input.title || input.title.trim().length === 0) {
      throw new Error('TASK_TITLE_EMPTY: task title cannot be empty');
    }

    // 2. 创建领域对象
    const task = Task.create({
      title: input.title,
      description: input.description,
      priority: input.priority || 'medium',
    });

    // 3. 持久化
    await taskRepository.create(db, task);

    // 4. 发布事件（可选）
    // await eventBus.publish(TaskCreatedEvent.from(task));

    return { task };
  }
}

// Repository 层：数据访问（Kysely）
export class TaskRepository {
  async create(db: Database, task: Task): Promise<void> {
    await db
      .insertInto('tasks')
      .values({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      })
      .execute();
  }
}
```

### Kysely 类型安全查询

Kysely 通过数据库 Schema 生成类型定义，确保类型安全：

```typescript
// infrastructure/persistence/postgres/database.ts
// 从数据库 Schema 生成类型（手动定义或使用工具生成）
export interface Database {
  tasks: {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    created_at: Date;
    updated_at: Date;
  };
  users: {
    id: string;
    email: string;
    // ...
  };
}

// Repository 使用类型安全的查询
const task = await db
  .selectFrom('tasks')
  .selectAll()
  .where('id', '=', taskId)
  .where('status', '=', 'pending') // TypeScript 会检查 'pending' 是否有效
  .executeTakeFirst();
```

---

## 📚 开发指南

### 添加新用例

与 Go 后端流程一致：

1. **在 `usecases.yaml` 中定义用例**

   ```yaml
   ArchiveTask:
     description: '归档已完成的任务'
     http:
       method: POST
       path: /api/tasks/:id/archive
     input:
       task_id:
         type: string
         required: true
     steps:
       - ValidateInput
       - ArchiveTask
       - SaveTask
   ```

2. **在 `http/dto/` 中定义 DTO**

   ```typescript
   export interface ArchiveTaskRequest {
     task_id: string;
   }
   ```

3. **在 `service/` 中实现业务逻辑**

   ```typescript
   async archiveTask(db: Database, input: ArchiveTaskInput): Promise<void> {
     // 业务逻辑
   }
   ```

4. **在 `handlers/` 中实现 Handler**

   ```typescript
   export async function archiveTaskHandler(
     request: FastifyRequest<{ Params: { id: string } }>,
     reply: FastifyReply
   ) {
     // HTTP 适配
   }
   ```

5. **在 `http/router.ts` 中注册路由**
   ```typescript
   fastify.post('/api/tasks/:id/archive', archiveTaskHandler);
   ```

### 数据库操作（Kysely）

#### 基本查询

```typescript
// 查询单条记录
const task = await db.selectFrom('tasks').selectAll().where('id', '=', taskId).executeTakeFirst();

// 查询多条记录（带分页）
const tasks = await db
  .selectFrom('tasks')
  .selectAll()
  .where('status', '=', 'pending')
  .orderBy('created_at', 'desc')
  .limit(limit)
  .offset(offset)
  .execute();

// 插入记录
await db
  .insertInto('tasks')
  .values({
    id: task.id,
    title: task.title,
    status: task.status,
    created_at: new Date(),
    updated_at: new Date(),
  })
  .execute();

// 更新记录
await db
  .updateTable('tasks')
  .set({
    status: 'completed',
    updated_at: new Date(),
  })
  .where('id', '=', taskId)
  .execute();

// 删除记录
await db.deleteFrom('tasks').where('id', '=', taskId).execute();
```

#### 事务处理

```typescript
await db.transaction().execute(async (trx) => {
  // 在事务中执行多个操作
  await trx
    .insertInto('tasks')
    .values({ ... })
    .execute();

  await trx
    .updateTable('users')
    .set({ ... })
    .where('id', '=', userId)
    .execute();

  // 如果抛出错误，自动回滚
});
```

### 环境变量配置

创建 `.env` 文件（参考 `env.example`）：

```bash
# 服务器配置
NODE_ENV=development
PORT=8081

# 数据库配置（与 Go 后端共享）
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=genai
DATABASE_PASSWORD=genai_password
DATABASE_NAME=go_genai_stack
DATABASE_SSL_MODE=disable

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置（可选）
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 日志配置（结构化日志 + 日志轮转）
LOGGING_ENABLED=true
LOGGING_LEVEL=info                      # debug, info, warn, error
LOGGING_FORMAT=pretty                   # 开发环境使用 pretty，生产环境使用 json
LOGGING_OUTPUT=stdout                   # stdout, stderr, file

# 文件输出配置（当 LOGGING_OUTPUT=file 时）
LOGGING_OUTPUT_PATH=./logs/app.log      # 日志文件路径
LOGGING_MAX_SIZE=100                    # 单个日志文件最大大小（MB）
LOGGING_MAX_BACKUPS=3                   # 保留的旧日志文件数量
LOGGING_MAX_AGE=7                       # 保留旧日志文件的最大天数
LOGGING_COMPRESS=true                   # 是否压缩旧日志文件（.gz）
```

**日志轮转功能**:

- ✅ 自动按大小轮转日志文件
- ✅ 自动压缩旧日志文件
- ✅ 自动清理过期日志
- 📖 详见 [日志系统使用指南](docs/LOGGING.md)

**注意**：在 Docker 容器中运行时，建议使用卷挂载将日志文件保存到宿主机。

### 测试

```bash
# 运行所有测试
pnpm test

# 运行特定领域的测试
pnpm test domains/task

# 带覆盖率
pnpm test:coverage

# Watch 模式
pnpm test:watch
```

---

## 📊 监控和安全

### 功能概览

系统已集成以下监控和安全功能：

- ✅ **请求追踪**：自动生成 TraceID/RequestID，支持分布式追踪
- ✅ **Metrics 监控**：Prometheus 格式指标，支持 QPS、延迟、错误率监控
- ✅ **API 限流**：基于 Redis 的限流保护，防止恶意请求

### 快速使用

#### 1. 请求追踪（自动启用）

```bash
# 发送请求，自动获得追踪信息
curl -v http://localhost:8081/api/tasks

# 响应头包含：
# X-Trace-Id: 550e8400-e29b-41d4-a716-446655440000
# X-Request-Id: 660e8400-e29b-41d4-a716-446655440001
```

#### 2. Metrics 监控

```bash
# 访问 Metrics 端点
curl http://localhost:8081/metrics

# 集成 Prometheus（prometheus.yml）
scrape_configs:
  - job_name: 'backend-nodejs'
    static_configs:
      - targets: ['localhost:8081']
```

#### 3. API 限流

```bash
# 测试登录限流（每分钟最多 5 次）
for i in {1..6}; do
  curl -X POST http://localhost:8081/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
# 第 6 次会返回 429 Too Many Requests
```

### 详细文档

- 📖 [完整使用文档](docs/MONITORING_AND_SECURITY.md) - 详细的使用说明和配置
- 🚀 [快速参考](docs/QUICK_START_MONITORING.md) - 快速上手指南
- 💡 [使用示例](docs/USAGE_EXAMPLES.md) - 实际使用场景和代码示例
- 🧪 [测试脚本](scripts/test-monitoring.sh) - 自动化测试脚本

### 已应用的限流策略

- **登录接口**：每分钟最多 5 次（防止暴力破解）
- **注册接口**：每小时最多 3 次（防止批量注册）

---

## 🔗 与 Go 后端的关系

### 共享资源

| 资源              | 说明                                                       |
| ----------------- | ---------------------------------------------------------- |
| **数据库 Schema** | 共享 `backend/database/schema.sql`                         |
| **数据库实例**    | 共享同一 PostgreSQL 实例                                   |
| **领域定义**      | 共享 `domains/*/usecases.yaml`、`README.md` 等显式知识文件 |
| **API 规范**      | 共享相同的 HTTP API 端点（可选择性实现）                   |

### 技术栈对比

| 模块         | Go 后端      | Node.js 后端             |
| ------------ | ------------ | ------------------------ |
| **Web 框架** | Hertz        | Fastify                  |
| **数据库**   | database/sql | Kysely                   |
| **语言**     | Go           | TypeScript               |
| **类型系统** | 编译时检查   | 编译时检查（TypeScript） |

### 使用场景

**何时使用 Go 后端？**

- 需要极致性能的场景
- 需要与 Go 生态深度集成
- 团队熟悉 Go 语言

**何时使用 Node.js 后端？**

- 需要与前端共享类型定义
- 需要快速集成 LangChain.js 等 Node.js 生态工具
- 团队熟悉 TypeScript/Node.js
- 需要 Streaming 输出（SSE）

### 混合部署

两个后端可以**同时运行**，共享同一数据库：

```bash
# 启动 Go 后端（端口 8080）
cd backend
go run cmd/server/main.go

# 启动 Node.js 后端（端口 8081）
cd backend-nodejs
pnpm dev
```

**注意事项**：

- 两个后端共享数据库，需要确保数据一致性
- API 端点可以不同（如 Go: `/api/v1/tasks`，Node.js: `/api/v2/tasks`）
- 建议使用 API Gateway 统一路由

---

## 🎯 技术选型详细说明

### Fastify（Web 框架）

**选型原因**：

- ✅ **高性能**：比 Express 快 2-3 倍，适合 API + Streaming
- ✅ **原生支持**：HTTP/2、SSE（Server-Sent Events）
- ✅ **TypeScript 友好**：完整的类型定义
- ✅ **插件体系**：清晰的插件架构，易于扩展

**典型职责**：

- 用户 API（查询分析结果）
- Streaming 分析输出（SSE）

**注意事项**：

- Fastify 只做**薄控制层**，不要在其中跑 Agent
- Streaming 要与 Redis / Queue 解耦

### Kysely（数据库查询构建器）

**选型原因**：

- ✅ **类型安全**：编译时类型检查，避免 SQL 错误
- ✅ **符合项目理念**：不使用 ORM，直接构建 SQL（类似 Go 后端的 `database/sql`）
- ✅ **透明性**：SQL 清晰可见，AI 易于理解
- ✅ **性能**：无 ORM 开销，直接操作数据库

**与 Go 后端对比**：

| Go 后端                   | Node.js 后端                   |
| ------------------------- | ------------------------------ |
| `database/sql` + 原生 SQL | `Kysely` + 类型安全 SQL 构建器 |
| 手写 SQL 字符串           | 链式 API 构建 SQL              |
| 运行时检查                | 编译时类型检查                 |

### LangChain.js（Agent 框架，可选）

**选型原因**：

- ✅ 与现有 TS 技术栈完全一致
- ✅ 工具（Tool）、Memory、Agent 抽象成熟
- ✅ 社区与文档丰富，MVP 成本最低

**使用策略**：

- 初期使用 **Runnable + Tool Agent**
- 不提前引入 LangGraph
- Agent 本身保持**无状态**

**注意事项**：

- Agent 状态不要放内存
- 所有中间状态要么进 Redis，要么可丢
- Prompt / Tool 版本要显式标记

### BullMQ（队列，可选）

**选型原因**：

- ✅ Node.js 生态最成熟的队列方案
- ✅ 与 Fastify / LangChain 配合自然
- ✅ 支持 Retry、Backoff、并发控制

**使用场景**：

- 股票分析任务调度
- 定时分析（cron-like）
- Agent 并发执行

**注意事项**：

- Job 数据只放**引用 ID**，不要放大对象
- 必须实现幂等（symbol + period + version）
- Worker 与 API 进程分离

### Redis（缓存/状态）

**角色定位**：Redis **不是数据库，而是系统组件**。

**用途**：

- BullMQ Backend
- 分析结果缓存（TTL）
- Agent 运行状态
- Streaming 消息中转

**注意事项**：

- 所有 Redis 数据都要允许丢失
- Key 命名要命名空间化
- 设置合理 TTL

---

## 📊 可扩展性与演进路径

### Agent 框架演进

- **LangChain → LangGraph**（有状态、多步）
- 成本：**低（复用 Tool / Prompt）**

### 数据层演进

- 引入向量数据库（RAG）
- 引入 OLAP（历史回测）

### 核心选型总结

| 模块          | 选型         | 状态                        |
| ------------- | ------------ | --------------------------- |
| Web           | Fastify      | ✅ 已选型                   |
| Agent         | LangChain.js | 🔜 可选                     |
| Queue         | BullMQ       | 🔜 可选                     |
| Cache / State | Redis        | ✅ 已选型                   |
| 主数据库      | PostgreSQL   | ✅ 已选型（与 Go 后端共享） |
| 数据库查询    | Kysely       | ✅ 已选型                   |

---

## 🚀 下一步

1. **✅ 运行项目**：按照上面的"快速开始"步骤启动服务
2. **📖 阅读领域文档**：理解完整的领域实现（参考 Go 后端的 `domains/task/README.md`）
3. **🧪 测试 API**：使用 curl 或 Postman 测试 API
4. **🎨 创建自己的领域**：基于 Task 模板创建你的业务领域
5. **🔌 集成扩展**：根据需要添加认证、事件总线、追踪等功能

---

## 📚 相关文档

### 架构文档

- [架构概览](../docs/Core/architecture-overview.md)
- [Vibe-Coding-Friendly 理念](../docs/Core/vibe-coding-friendly.md)

### 开发指南

- [Go 后端 README](../backend/README.md) - 参考 Go 后端的实现
- [数据库管理](../docs/Guides/database.md) - 共享数据库 Schema

---

**Happy Coding!** 🚀

有任何问题欢迎提 Issue 或查看文档。
