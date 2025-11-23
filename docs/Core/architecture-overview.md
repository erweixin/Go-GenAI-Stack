# Vibe-Coding-Friendly DDD 架构概览

> 🎯 **核心理念**：Monorepo + Domain-First + 显式知识 + AI 友好

**最后更新**：2025-11-23

---

## 📖 核心理念

### Monorepo + Domain-First + Type Safety

- **Monorepo**：统一代码库，统一版本，统一工具链
- **Domain-First**：以领域为第一等公民，而非技术栈
- **Type Safety**：Go → TypeScript 自动同步
- **AI-Friendly**：清晰的结构，显式的知识，最小的认知负担

### 领域优先（Domain-First）

每个领域是一个自包含的目录，包含：
- ✅ 领域模型（model）
- ✅ 用例处理器（handlers）
- ✅ 数据访问（repository）
- ✅ HTTP 接口（http/dto）
- ✅ 测试（tests）
- ✅ **6 个显式知识文件**

---

## 🏗️ 项目结构

### 完整目录树

```
Go-GenAI-Stack/                                    # Monorepo 根目录
│
├── backend/                                       # 后端（Go + Hertz + DDD）
│   ├── cmd/
│   │   └── server/
│   │       └── main.go                            # 应用入口
│   │
│   ├── domains/                                   # 【领域层】第一等公民
│   │   │
│   │   ├── task/                                  # 【Task 领域】示例实现 ⭐
│   │   │   ├── README.md                          # ✅ 必需：领域概览
│   │   │   ├── glossary.md                        # ✅ 必需：术语表
│   │   │   ├── rules.md                           # ✅ 必需：业务规则
│   │   │   ├── events.md                          # ✅ 必需：领域事件清单
│   │   │   ├── usecases.yaml                      # ✅ 必需：用例声明（关键！）
│   │   │   ├── ai-metadata.json                   # ✅ 必需：AI 元数据
│   │   │   │
│   │   │   ├── model/                             # 领域模型
│   │   │   │   └── task.go                        # Task 聚合根
│   │   │   │
│   │   │   ├── repository/                        # 仓储（接口 + 实现）
│   │   │   │   ├── interface.go                   # 仓储接口
│   │   │   │   ├── task_repo.go                   # 实现（database/sql）
│   │   │   │   └── filter.go                      # 查询条件构建
│   │   │   │
│   │   │   ├── handlers/                          # 用例处理器
│   │   │   │   ├── create_task.handler.go         # 对应 usecases.yaml 中的 CreateTask
│   │   │   │   ├── update_task.handler.go
│   │   │   │   ├── complete_task.handler.go
│   │   │   │   ├── delete_task.handler.go
│   │   │   │   ├── get_task.handler.go
│   │   │   │   ├── list_tasks.handler.go
│   │   │   │   ├── service.go                     # Handler Service（依赖注入）
│   │   │   │   └── helpers.go                     # 辅助函数
│   │   │   │
│   │   │   ├── http/                              # HTTP 接口层
│   │   │   │   ├── dto/                           # 数据传输对象
│   │   │   │   │   └── task.go                    # ← 类型同步源
│   │   │   │   └── router.go                      # 路由注册
│   │   │   │
│   │   │   └── tests/                             # 测试
│   │   │       └── (待完善)
│   │   │
│   │   └── shared/                                # 共享内核（跨领域）
│   │       ├── events/                            # 事件总线
│   │       │   ├── bus.go
│   │       │   └── types.go
│   │       └── types/                             # 共享类型
│   │           └── common.go
│   │
│   ├── infrastructure/                            # 【基础设施层】全局
│   │   ├── bootstrap/                             # 启动引导
│   │   │   ├── server.go                          # 服务器初始化
│   │   │   ├── database.go                        # 数据库连接
│   │   │   ├── redis.go                           # Redis 连接
│   │   │   ├── dependencies.go                    # 依赖注入容器
│   │   │   └── routes.go                          # 路由注册
│   │   │
│   │   ├── persistence/                           # 持久化层
│   │   │   ├── postgres/
│   │   │   │   ├── connection.go                  # 数据库连接池
│   │   │   │   └── transaction.go                 # 事务管理
│   │   │   └── redis/
│   │   │       ├── connection.go
│   │   │       └── cache.go
│   │   │
│   │   ├── database/                              # 数据库 Schema
│   │   │   └── schema/
│   │   │       └── schema.sql                     # 声明式 Schema（Atlas）
│   │   │
│   │   ├── middleware/                            # 全局中间件
│   │   │   ├── auth.go                            # 认证
│   │   │   ├── cors.go                            # CORS
│   │   │   ├── error_handler.go                   # 错误处理
│   │   │   ├── logger.go                          # 日志
│   │   │   ├── ratelimit.go                       # 限流
│   │   │   ├── recovery.go                        # 恢复
│   │   │   └── tracing.go                         # 追踪
│   │   │
│   │   └── config/                                # 配置管理
│   │       ├── config.go
│   │       ├── loader.go
│   │       └── validator.go
│   │
│   ├── shared/                                    # 共享代码
│   │   └── errors/                                # 错误定义
│   │       └── errors.go
│   │
│   ├── pkg/                                       # 可复用工具包（技术性）
│   │   └── validator/                             # 参数验证器
│   │       ├── validator.go
│   │       └── custom_validators.go
│   │
│   ├── migrations/                                # 数据库迁移
│   │   ├── atlas/                                 # Atlas 生成的迁移文件
│   │   └── seed/                                  # 种子数据
│   │       └── 01_initial_data.sql
│   │
│   ├── scripts/                                   # 开发脚本
│   │   ├── dev.sh                                 # 开发模式启动
│   │   ├── schema.sh                              # Schema 管理（Atlas）
│   │   ├── test_all.sh                            # 运行所有测试
│   │   ├── lint.sh                                # 代码检查
│   │   └── seed.sh                                # 加载种子数据
│   │
│   ├── go.mod
│   └── go.sum
│
├── frontend/                                      # 前端 Monorepo
│   ├── web/                                       # React Web 应用
│   │   ├── src/
│   │   │   ├── features/                          # 按功能组织（Feature-First）
│   │   │   │   └── task/                          # Task 功能
│   │   │   │       ├── components/                # 组件
│   │   │   │       ├── api/                       # API 调用
│   │   │   │       └── hooks/                     # 自定义 Hooks
│   │   │   └── shared/                            # 共享代码（引用 @go-genai-stack/types）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mobile/                                    # React Native 移动应用
│   │   ├── src/
│   │   │   └── features/                          # 同 web
│   │   │       └── task/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                                    # 前端共享代码（pnpm workspace）
│   │   ├── types/                                 # TypeScript 类型定义
│   │   │   ├── domains/
│   │   │   │   └── task.ts                        # ← 从 Go DTO 生成
│   │   │   └── index.ts
│   │   ├── utils/                                 # 工具函数
│   │   └── constants/                             # 常量
│   │
│   ├── package.json                               # Workspace 根配置
│   └── pnpm-workspace.yaml
│
├── docs/                                          # 项目文档
│   ├── INDEX.md                                   # 文档导航
│   ├── Core/                                      # 核心文档
│   ├── Guides/                                    # 开发指南
│   └── Extensions/                                # 扩展指南
│
├── docker/                                        # Docker 配置
│   ├── docker-compose.yml
│   └── .env
│
├── scripts/                                       # 项目级脚本
│   └── quickstart.sh                              # 一键启动
│
├── tygo.yaml                                      # 类型同步配置
└── README.md
```

---

## 🎯 核心设计原则

### 1. 领域优先（Domain-First）

**每个领域是一个自包含的目录**，包含：

| 组成部分 | 职责 | 示例 |
|---------|------|------|
| **model/** | 领域模型 | Task 聚合根、值对象 |
| **repository/** | 数据访问 | TaskRepository 接口和实现 |
| **handlers/** | 用例处理器 | CreateTaskHandler |
| **http/dto/** | 数据传输对象 | CreateTaskRequest/Response |
| **tests/** | 测试 | 单元测试、集成测试 |

### 2. 显式知识文件（6 个必需文件）

**每个领域必须包含**：

| 文件 | 用途 | AI 作用 |
|------|------|---------|
| **README.md** | 领域概览、边界、核心概念 | 理解领域边界 |
| **glossary.md** | 术语表（Ubiquitous Language） | 理解领域语言 |
| **rules.md** | 业务规则和约束 | 生成验证逻辑 |
| **events.md** | 领域事件定义 | 理解事件流 |
| **usecases.yaml** | 用例声明（关键！）| 生成 Handler 代码 |
| **ai-metadata.json** | AI 元数据 | 向量化索引 |

**示例**（Task 领域）：
- 📄 [Task README](../../backend/domains/task/README.md)
- 📄 [Task usecases.yaml](../../backend/domains/task/usecases.yaml)
- 📄 [Task glossary.md](../../backend/domains/task/glossary.md)

### 3. 用例驱动（Use Case Driven）

**usecases.yaml 是核心**：

```yaml
CreateTask:
  description: "创建一个新的任务"
  http:
    method: POST
    path: /api/tasks
  input:
    title:
      type: string
      required: true
      validation: "max=200,min=1"
  output:
    task_id: string
    status: string
  steps:
    - ValidateInput
    - GenerateTaskID
    - CreateTaskEntity
    - SaveTask
    - PublishTaskCreatedEvent
```

**AI 可以做什么**：
- ✅ 读取 usecases.yaml 并生成 Handler 代码
- ✅ 生成对应的测试
- ✅ 理解业务流程
- ✅ 生成 DTO 定义

### 4. 分层架构

```
┌─────────────────────────────────────────┐
│  HTTP Layer (domains/*/http/)           │  ← 最外层：路由和 DTO
├─────────────────────────────────────────┤
│  Handler Layer (domains/*/handlers/)    │  ← 用例处理器
├─────────────────────────────────────────┤
│  Domain Layer (domains/*/model/)        │  ← 领域模型和业务逻辑
├─────────────────────────────────────────┤
│  Repository Layer (domains/*/repository/) │  ← 数据访问抽象
├─────────────────────────────────────────┤
│  Infrastructure Layer (infrastructure/) │  ← 技术实现（数据库、缓存）
└─────────────────────────────────────────┘
```

**依赖方向**：HTTP → Handler → Domain → Repository → Infrastructure

### 5. 目录职责清晰

| 目录 | 职责 | 不属于这里 |
|------|------|-----------|
| **domains/** | 业务逻辑、领域模型 | 技术细节、框架代码 |
| **infrastructure/** | 技术实现（数据库、中间件） | 业务逻辑 |
| **pkg/** | 纯技术工具（可复用） | 业务相关代码 |
| **shared/** | 跨领域共享（错误、事件） | 领域特定代码 |

---

## 🔄 前后端类型同步

### 工作流程

```
1. 后端定义 DTO
   ↓
backend/domains/task/http/dto/task.go
   ↓
2. 运行类型同步
   ↓
./scripts/sync_types.sh
   ↓
3. 自动生成 TypeScript 类型
   ↓
frontend/shared/types/domains/task.ts
   ↓
4. 前端使用类型
   ↓
import { CreateTaskRequest } from '@go-genai-stack/types'
```

### 示例

**后端 Go DTO**：
```go
// backend/domains/task/http/dto/task.go
type CreateTaskRequest struct {
    Title       string   `json:"title" binding:"required,max=200"`
    Description string   `json:"description"`
    Priority    string   `json:"priority" binding:"oneof=low medium high"`
    DueDate     string   `json:"due_date"`
    Tags        []string `json:"tags"`
}
```

**自动生成的 TypeScript**：
```typescript
// frontend/shared/types/domains/task.ts
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
}
```

---

## 🤖 AI 协作工作流

### 典型流程

```bash
# 1. 修改 usecases.yaml
vim backend/domains/task/usecases.yaml

# 2. AI 读取显式知识文件
# - README.md
# - glossary.md
# - rules.md
# - usecases.yaml

# 3. AI 生成代码
# - handlers/new_use_case.handler.go
# - tests/new_use_case.test.go
# - http/dto/new_use_case.go

# 4. 运行测试
go test ./backend/domains/task/...

# 5. 提交
git commit -m "feat(task): add new use case"
```

### AI 友好设计

1. **结构化知识**
   - YAML 格式（usecases.yaml）
   - Markdown 格式（README、glossary、rules）
   - 易于解析和理解

2. **显式化规则**
   - 业务规则在 rules.md 中明确列出
   - 不隐藏在代码中

3. **自包含上下文**
   - 每个领域包含完整信息
   - AI 无需跨多个目录查找

4. **短小精悍**
   - 每个文档 < 2000 字
   - 便于向量化和 RAG 检索

---

## 📚 扩展点

### Application 层（跨领域编排）

**何时需要**：
- ❌ 单领域操作 → 不需要
- ✅ 跨领域编排 → 需要 Application 层

**示例场景**：
```
创建任务并发送通知：
1. Task Domain: 创建任务
2. User Domain: 获取用户信息
3. Notification Domain: 发送通知
```

详见：[Application 层指南](../Extensions/application-layer.md)

### 其他扩展

- 🔌 真实 LLM 集成（OpenAI、Claude）
- 🔌 事件总线（从内存切换到 Redis/Kafka）
- 🔌 JWT 认证和授权
- 🔌 OpenTelemetry 追踪
- 🔌 监控和告警

---

## 🎓 快速参考

### 创建新领域

```bash
# 1. 复制 Task 领域作为模板
cp -r backend/domains/task backend/domains/product

# 2. 全局替换
# Task → Product
# task → product

# 3. 修改业务逻辑
vim backend/domains/product/usecases.yaml
vim backend/domains/product/model/product.go
vim backend/domains/product/handlers/*.go

# 4. 更新 Schema
vim backend/infrastructure/database/schema/schema.sql
./scripts/schema.sh diff add_product
./scripts/schema.sh apply

# 5. 注册路由
vim backend/infrastructure/bootstrap/routes.go
```

### 添加新用例

```bash
# 1. 在 usecases.yaml 中定义
vim backend/domains/task/usecases.yaml

# 2. 创建 handler
vim backend/domains/task/handlers/new_use_case.handler.go

# 3. 添加 DTO
vim backend/domains/task/http/dto/new_use_case.go

# 4. 注册路由
vim backend/domains/task/http/router.go

# 5. 编写测试
vim backend/domains/task/tests/new_use_case.test.go
```

---

## 🔗 相关文档

- [Vibe-Coding-Friendly 理念](vibe-coding-friendly.md)
- [快速参考](../Guides/quick-reference.md)
- [数据库管理](../Guides/database.md)
- [类型同步指南](../Guides/type-sync.md)
- [Application 层指南](../Extensions/application-layer.md)

---

## 📊 优势总结

| 特性 | 传统 DDD | Vibe-Coding-Friendly DDD |
|------|---------|--------------------------|
| **领域组织** | 按技术栈分层 | 按领域垂直切分 |
| **业务规则** | 隐藏在代码中 | 显式化在 rules.md |
| **用例声明** | 无 | usecases.yaml（AI 可读）|
| **AI 友好性** | 低（需要读大量代码）| 高（结构化知识）|
| **维护成本** | 高（跨多个目录）| 低（自包含）|
| **新人上手** | 困难 | 容易（从 README 开始）|

---

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team

