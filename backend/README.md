# Go-GenAI-Stack Backend

> 🎯 **项目定位**：这是一个采用 **Vibe-Coding-Friendly DDD** 架构的后端 Starter。
> 
> 内置 **Task 领域** 作为完整示例，展示如何实现一个标准的业务领域。你可以直接使用 Task 功能，或将其作为模板创建自己的业务领域。

基于 CloudWeGo Hertz 的高性能 HTTP 服务，采用 Vibe Coding Friendly DDD 架构。

---

## 🚀 快速开始

### 前置要求

- Go 1.21+
- Docker & Docker Compose（用于 PostgreSQL 和 Redis）

### 一键启动

```bash
# 1. 启动数据库
cd ../docker
docker-compose up -d

# 2. 运行数据库迁移
cd ../backend
./scripts/schema.sh apply

# 3. 加载种子数据（20+ 个示例 Task）
psql -h localhost -U postgres -d go_genai_stack -f migrations/seed/01_initial_data.sql

# 4. 启动服务器
./scripts/dev.sh
# 或直接运行
go run cmd/server/main.go
```

服务器将在 `http://localhost:8080` 启动。

### 健康检查

```bash
curl http://localhost:8080/health
```

**预期输出**：
```json
{
  "status": "healthy",
  "service": "go-genai-stack",
  "database": true,
  "redis": true,
  "version": "0.1.0"
}
```

---

## 📁 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
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
│   │   │   └── task.go
│   │   │
│   │   ├── repository/          # 仓储（接口 + 实现）★
│   │   │   ├── interface.go
│   │   │   └── task_repo.go     # 使用 database/sql
│   │   │
│   │   ├── handlers/            # 用例实现
│   │   │   ├── create_task.handler.go
│   │   │   ├── update_task.handler.go
│   │   │   ├── complete_task.handler.go
│   │   │   ├── delete_task.handler.go
│   │   │   ├── get_task.handler.go
│   │   │   └── list_tasks.handler.go
│   │   │
│   │   ├── http/                # HTTP 层
│   │   │   ├── dto/             # DTO（tygo 同步到前端）★
│   │   │   │   └── task.go
│   │   │   └── router.go        # 路由注册
│   │   │
│   │   └── tests/               # 测试
│   │
│   └── shared/                  # 共享组件
│       ├── events/              # 事件总线
│       └── types/               # 共享类型
│
├── infrastructure/              # 【基础设施层】
│   ├── bootstrap/               # 启动引导
│   │   ├── server.go            # 服务器初始化
│   │   ├── database.go          # 数据库连接
│   │   ├── redis.go             # Redis 连接
│   │   ├── dependencies.go      # 依赖注入
│   │   └── routes.go            # 路由注册
│   │
│   ├── config/                  # 配置管理
│   │   ├── config.go
│   │   └── loader.go
│   │
│   ├── database/                # 数据库 Schema
│   │   └── schema/
│   │       └── schema.sql       # 声明式 Schema（Atlas）
│   │
│   ├── middleware/              # 中间件
│   │   ├── auth.go              # 认证
│   │   ├── cors.go              # CORS
│   │   ├── error_handler.go     # 错误处理
│   │   ├── logger.go            # 日志
│   │   ├── ratelimit.go         # 限流
│   │   ├── recovery.go          # 恢复
│   │   └── tracing.go           # 追踪
│   │
│   └── persistence/             # 持久化层
│       ├── postgres/
│       │   ├── connection.go    # 数据库连接
│       │   └── transaction.go   # 事务管理
│       └── redis/
│           ├── connection.go
│           └── cache.go
│
├── shared/                      # 【共享代码】
│   └── errors/                  # 错误定义
│       └── errors.go
│
├── pkg/                         # 【可复用工具包】
│   └── validator/               # 参数验证器
│
├── migrations/                  # 数据库迁移
│   ├── atlas/                   # Atlas 生成的迁移文件
│   └── seed/                    # 种子数据
│       └── 01_initial_data.sql
│
├── scripts/                     # 开发脚本
│   ├── dev.sh                   # 开发模式启动
│   ├── schema.sh                # Schema 管理（Atlas）
│   ├── test_all.sh              # 运行所有测试
│   └── lint.sh                  # 代码检查
│
├── go.mod
└── README.md
```

---

## 🎯 Vibe Coding Friendly DDD

### 核心原则

1. **领域优先**：按业务领域垂直切分（Domain-First）
2. **自包含**：每个领域包含完整的实现（model + handlers + http + repository + tests）
3. **显式知识**：6 个必需文件让业务规则可被 AI 理解
4. **声明式用例**：在 `usecases.yaml` 中声明用例，AI 可直接生成代码
5. **手写仓储**：使用 Repository 模式 + database/sql，不使用 ORM

### 6 个必需文件

每个领域目录必须包含（以 Task 领域为例）：

| 文件 | 用途 | 示例 |
|------|------|------|
| **README.md** | 领域概述、边界、核心概念 | [domains/task/README.md](domains/task/README.md) |
| **glossary.md** | 领域术语表 | [domains/task/glossary.md](domains/task/glossary.md) |
| **rules.md** | 业务规则和约束 | [domains/task/rules.md](domains/task/rules.md) |
| **events.md** | 领域事件定义 | [domains/task/events.md](domains/task/events.md) |
| **usecases.yaml** | 用例声明（AI 可读）★ | [domains/task/usecases.yaml](domains/task/usecases.yaml) |
| **ai-metadata.json** | AI 元数据 | [domains/task/ai-metadata.json](domains/task/ai-metadata.json) |

### usecases.yaml 驱动开发

以 Task 领域的 `CreateTask` 用例为例：

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
    description:
      type: string
      required: false
    priority:
      type: string
      validation: "oneof=low medium high"
  output:
    task_id: string
    title: string
    status: string
    created_at: string
  steps:
    - ValidateInput
    - GenerateTaskID
    - CreateTaskEntity
    - SaveTask
    - PublishTaskCreatedEvent
```

**AI 读取 `usecases.yaml` 后可以**：
- ✅ 生成 Handler 骨架
- ✅ 生成对应的测试
- ✅ 理解业务流程
- ✅ 生成 DTO 定义

---

## 🔧 API 端点

### Task 领域 API

```bash
# 创建任务
POST /api/tasks
Content-Type: application/json
{
  "title": "完成项目文档",
  "description": "编写 README 和 API 文档",
  "priority": "high",
  "due_date": "2025-12-31T23:59:59Z",
  "tags": ["文档", "优先"]
}

# 列出任务（支持筛选、排序、分页）
GET /api/tasks?status=pending&priority=high&page=1&limit=10

# 获取任务详情
GET /api/tasks/:id

# 更新任务
PUT /api/tasks/:id
Content-Type: application/json
{
  "title": "更新后的标题",
  "priority": "medium"
}

# 完成任务
POST /api/tasks/:id/complete

# 删除任务
DELETE /api/tasks/:id
```

**完整的 API 文档**：参考 `domains/task/usecases.yaml`

---

## 🧪 测试

```bash
# 运行所有测试
go test ./...

# 运行 Task 领域的测试
go test ./domains/task/...

# 带覆盖率
go test -cover ./...

# 运行所有测试（使用脚本）
./scripts/test_all.sh
```

---

## 📦 依赖

### 核心依赖
- **CloudWeGo Hertz** - 高性能 HTTP 框架
- **validator/v10** - 参数验证
- **lib/pq** - PostgreSQL 驱动
- **go-redis/v9** - Redis 客户端
- **配置管理** - 原生标准库（os.Getenv，零第三方依赖）

### 开发工具
- **Atlas** - 数据库 Schema 管理
- **golangci-lint** - 代码检查（计划中）

---

## 🔄 前后端类型同步

后端 DTO 会通过 `tygo` 自动生成前端 TypeScript 类型：

```bash
# 从项目根目录运行
./scripts/sync_types.sh

# 生成的类型文件
# frontend/shared/types/domains/task.ts
```

**示例**：

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

自动生成：

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

## 📝 开发规范

### 添加新用例

1. **在 `usecases.yaml` 中定义用例**
   ```yaml
   ArchiveTask:
     description: "归档已完成的任务"
     http:
       method: POST
       path: /api/tasks/:id/archive
     # ... 定义 input、output、steps
   ```

2. **在 `http/dto/` 中定义 DTO**
   ```go
   type ArchiveTaskRequest struct {
       TaskID string `json:"task_id" binding:"required"`
   }
   ```

3. **在 `handlers/` 中实现 Handler**
   ```go
   func ArchiveTaskHandler(service *HandlerService) app.HandlerFunc {
       // 实现业务逻辑
   }
   ```

4. **在 `tests/` 中编写测试**
   ```go
   func TestArchiveTask(t *testing.T) {
       // 测试代码
   }
   ```

5. **在 `http/router.go` 中注册路由**
   ```go
   tasks.POST("/:id/archive", handlers.ArchiveTaskHandler(service))
   ```

### Code-First（不使用 hz generator）

我们使用 **Code-First** 模式，手写 DTO 和 Handler：

```go
// DTO（明确的类型定义）
type CreateTaskRequest struct {
    Title       string   `json:"title" binding:"required,max=200"`
    Description string   `json:"description"`
    Priority    string   `json:"priority" binding:"oneof=low medium high"`
}

// Handler（清晰的业务逻辑）
func CreateTaskHandler(service *HandlerService) app.HandlerFunc {
    return func(ctx context.Context, c *app.RequestContext) {
        var req dto.CreateTaskRequest
        if err := c.BindAndValidate(&req); err != nil {
            c.JSON(400, map[string]interface{}{
                "error": "Invalid input",
            })
            return
        }
        
        // 调用 service 处理业务逻辑
        task, err := service.CreateTask(ctx, &req)
        if err != nil {
            c.JSON(500, map[string]interface{}{
                "error": err.Error(),
            })
            return
        }
        
        c.JSON(200, task)
    }
}

// Router（简洁的路由注册）
tasks.POST("", handlers.CreateTaskHandler(service))
```

**为什么不用 hz generator？**
- ✅ **Vibe Coding Friendly** - AI 可以一次性理解和修改完整上下文
- ✅ **上下文连续** - 无需在 IDL 和生成代码之间切换
- ✅ **修改成本低** - 直接修改 Go 代码，立即生效
- ✅ **符合 DDD** - 代码组织更清晰，领域逻辑更突出

---

## 🏗️ 分层架构

### Repository Pattern（仓储模式）★

**手写 Repository，Vibe Coding Friendly**

```
domains/task/
├── model/                  # 领域模型（纯业务）
│   └── task.go             # Task 实体
│
└── repository/             # 仓储接口 + 实现
    ├── interface.go        # 仓储接口（领域语言）
    ├── task_repo.go        # 使用 database/sql + 原生 SQL
    └── filter.go           # 查询条件构建器
```

**为什么使用 database/sql 而不是 ORM？**

| 优势 | 说明 |
|------|------|
| ✅ **透明度高** | SQL 清晰可见，AI 易于理解 |
| ✅ **性能更好** | 无 ORM 开销，直接操作数据库 |
| ✅ **控制力强** | 完全控制 SQL 语句，便于优化 |
| ✅ **Vibe-Coding 友好** | Repository 模式已提供抽象，无需 ORM |
| ✅ **可维护性强** | SQL 一目了然，调试和优化更容易 |

**示例 Repository 实现**：

```go
// domains/task/repository/task_repo.go
func (r *TaskRepository) Create(ctx context.Context, task *model.Task) error {
    query := `
        INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
    _, err := r.db.ExecContext(ctx, query,
        task.ID, task.Title, task.Description, task.Status,
        task.Priority, task.DueDate, task.CreatedAt, task.UpdatedAt,
    )
    return err
}
```

---

## 📚 数据库管理

### Schema 管理（Atlas）

使用 **Atlas** 进行声明式 Schema 管理：

```bash
# 1. 修改 Schema
vim infrastructure/database/schema/schema.sql

# 2. 生成迁移
./scripts/schema.sh diff add_new_field

# 3. 应用迁移
./scripts/schema.sh apply

# 4. 查看状态
./scripts/schema.sh status
```

**Schema 文件**：`infrastructure/database/schema/schema.sql`

---

## 🎯 Task 作为模板

> 📌 **重要提示**：Task 领域是一个**示例实现**，用于展示 Vibe-Coding-Friendly DDD 架构。

### 你可以：

1. **✅ 直接使用**
   - 如果你的项目需要任务管理功能
   - Task 提供了完整的 CRUD + 业务逻辑

2. **✅ 作为参考**
   - 学习如何实现一个完整的领域
   - 参考 6 个必需文件的写法
   - 理解 DDD 分层和职责划分

3. **✅ 映射到你的业务**
   
   | Task 概念 | 映射示例 |
   |-----------|----------|
   | `Task` → | `Product`（商品）、`Order`（订单）、`Article`（文章）、`Customer`（客户） |
   | `Status` (pending/completed) → | `OrderStatus` (created/shipped)、`ArticleStatus` (draft/published) |
   | `Priority` (low/high) → | `ProductCategory`、`CustomerTier` |
   | `Tags` → | `ProductTags`、`CustomerSegments` |

### 创建自己的领域

```bash
# 1. 复制 Task 领域
cp -r domains/task domains/product

# 2. 全局替换
# Task → Product
# task → product

# 3. 修改业务逻辑
# - 修改 usecases.yaml
# - 修改 model/product.go
# - 修改 handlers/*.go
# - 修改 http/dto/product.go

# 4. 注册路由
# 在 infrastructure/bootstrap/routes.go 中添加 Product 路由

# 5. 更新数据库 Schema
vim infrastructure/database/schema/schema.sql
./scripts/schema.sh diff add_product_domain
./scripts/schema.sh apply
```

**详细映射指南**：参考 `domains/task/README.md` 底部的映射指南

---

## 🔌 扩展点

代码中所有标注 `Extension point` 的地方都是预留的扩展位置：

### 1. 跨领域编排（Application Layer）

当你有多个领域需要协作时，可以添加 Application 层：

```go
// application/services/task_orchestrator.go
type TaskOrchestrator struct {
    taskRepo    repository.TaskRepository
    userService *user.Service      // 用户领域
    notifyService *notify.Service  // 通知领域
}

func (o *TaskOrchestrator) CreateTaskWithNotification(ctx context.Context, req *CreateTaskRequest) error {
    // 1. Task Domain: 创建任务
    task, err := o.taskRepo.Create(...)
    
    // 2. User Domain: 检查用户权限
    user, err := o.userService.GetUser(...)
    
    // 3. Notification Domain: 发送通知
    err = o.notifyService.Send(...)
    
    return nil
}
```

**何时需要 Application 层？**
- ❌ 单一领域操作 → 直接在 Handler 中调用 Repository
- ✅ 跨领域编排 → 使用 Application 层编排多个领域

### 2. 数据库连接池优化

参考：`infrastructure/persistence/postgres/connection.go`

### 3. 事件总线

参考：`domains/shared/events/bus.go`

选项：内存、Redis、Kafka

### 4. JWT 认证

参考：`infrastructure/middleware/auth.go`

### 5. OpenTelemetry 追踪

参考：`infrastructure/middleware/tracing.go`

---

## 🔗 相关文档

### 架构文档
- [Vibe Coding DDD 架构](../docs/vibe-coding-ddd-structure.md)
- [最优架构设计](../docs/optimal-architecture.md)
- [Vibe-Coding-Friendly 理念](../docs/Vibe-Coding-Friendly.md)

### 开发指南
- [类型同步指南](../docs/type-sync.md)
- [快速参考](../docs/quick-reference.md)
- [Atlas 数据库管理](../docs/atlas-quickstart.md)

### 整改计划
- [Starter 整改计划](../docs/STARTER-REFACTORING-PLAN.md) - 项目优化路线图

---

## 🚀 下一步

1. **✅ 运行项目**：按照上面的"快速开始"步骤启动服务
2. **📖 阅读 Task 领域**：理解完整的领域实现（`domains/task/README.md`）
3. **🧪 测试 API**：使用 curl 或 Postman 测试 Task API
4. **🎨 创建自己的领域**：基于 Task 模板创建你的业务领域
5. **🔌 集成扩展**：根据需要添加认证、事件总线、追踪等功能

---

**Happy Coding!** 🚀

有任何问题欢迎提 Issue 或查看文档。
