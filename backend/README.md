# Go-GenAI-Stack Backend

基于 Hertz + Eino 的 AI 后端服务，采用 Vibe Coding Friendly DDD 架构。

## 🚀 快速开始

### 前置要求

- Go 1.21+
- 可选：PostgreSQL, Redis, Kafka（用于生产环境）

### 安装依赖

```bash
go mod download
```

### 运行服务器

```bash
go run cmd/server/main.go
```

服务器将在 `http://localhost:8080` 启动。

### 健康检查

```bash
curl http://localhost:8080/health
```

## 📁 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # 应用入口
│
├── application/             # 【应用层】★ 跨领域编排
│   ├── services/            # 应用服务
│   │   └── chat_orchestrator.go
│   ├── dto/                 # 应用层 DTO
│   └── README.md
│
├── domains/                 # 【领域层】DDD 领域
│   ├── chat/               # 聊天领域
│   │   ├── README.md       # 领域说明
│   │   ├── glossary.md     # 术语表
│   │   ├── rules.md        # 业务规则
│   │   ├── events.md       # 领域事件
│   │   ├── usecases.yaml   # 用例声明（AI 可读）★
│   │   ├── ai-metadata.json # AI 元数据
│   │   │
│   │   ├── model/          # 领域模型
│   │   │   ├── conversation.go
│   │   │   └── message.go
│   │   │
│   │   ├── repository/     # 仓储（接口 + 实现）★
│   │   │   ├── interface.go
│   │   │   ├── message_repo.go      # 使用 database/sql
│   │   │   └── conversation_repo.go # 使用 database/sql
│   │   │
│   │   ├── handlers/       # 用例实现
│   │   ├── http/           # HTTP 层
│   │   │   ├── dto/        # DTO（tygo 来源）★
│   │   │   └── router.go   # 路由注册
│   │   └── tests/          # 测试
│   │
│   └── llm/                # LLM 领域
│       └── ...
│
├── shared/                  # 【基础设施层】共享代码
│   ├── errors/             # 错误定义
│   ├── middleware/         # 中间件
│   └── utils/              # 工具函数
│
├── infra/                   # 【数据层】★
│   └── database/           # 数据库初始化
│       └── database.go
│
├── go.mod
└── README.md
```

## 🎯 Vibe Coding Friendly DDD

### 核心原则

1. **领域优先**：按业务领域垂直切分
2. **自包含**：每个领域包含完整的实现
3. **显式知识**：README, glossary, rules, events, usecases.yaml
4. **AI 友好**：结构清晰，易于 AI 理解和生成代码
5. **应用层编排**：跨领域逻辑在 application/ 层处理
6. **手写仓储**：使用 Repository 模式，不使用代码生成

### 6 个必需文件

每个领域目录必须包含：

1. **README.md** - 领域概述、边界、核心概念
2. **glossary.md** - 领域术语表
3. **rules.md** - 业务规则和约束
4. **events.md** - 领域事件定义
5. **usecases.yaml** - 用例声明（声明式，AI 可读）★
6. **ai-metadata.json** - AI 元数据

### usecases.yaml 驱动开发

```yaml
SendMessage:
  description: "发送消息到 AI"
  http:
    method: POST
    path: /api/chat/send
  input:
    user_id: string (required)
    message: string (required, max=10000)
  output:
    message_id: string
    content: string
    tokens: int
  steps:
    - ValidateInput
    - CheckRateLimit
    - CallLLM
    - SaveMessage
```

AI 读取 `usecases.yaml` 后可以：
- 生成 Handler 骨架
- 生成对应的测试
- 理解业务流程

## 🔧 API 端点

### Chat Domain

```bash
# 发送消息
POST /api/chat/send

# 流式消息
POST /api/chat/stream

# 获取历史
GET /api/chat/history/:id

# 创建对话
POST /api/chat/conversations

# 列出对话
GET /api/chat/conversations

# 删除对话
DELETE /api/chat/conversations/:id
```

### LLM Domain

```bash
# 列出模型
GET /api/llm/models

# 生成文本
POST /api/llm/generate

# 结构化输出
POST /api/llm/structured

# 选择模型
POST /api/llm/select-model
```

## 🧪 测试

```bash
# 运行所有测试
go test ./...

# 运行特定领域的测试
go test ./domains/chat/...

# 带覆盖率
go test -cover ./...
```

## 📦 依赖

- **Hertz** - 高性能 HTTP 框架
- **Eino** - LLM 应用开发框架（TODO: 集成）
- **validator/v10** - 参数验证

## 🔄 前后端类型同步

后端 DTO 会通过 `tygo` 自动生成前端 TypeScript 类型：

```bash
# 从项目根目录运行
./scripts/sync_types.sh
```

生成路径：`frontend/shared/types/domains/`

## 📝 开发规范

### 添加新用例

1. 在 `usecases.yaml` 中定义用例
2. 在 `http/dto/` 中定义 DTO
3. 在 `handlers/` 中实现 Handler
4. 在 `tests/` 中编写测试
5. 在 `http/router.go` 中注册路由

### Code-First（不使用 hz generator）

我们使用 Code-First 模式，手写 DTO 和 Handler：

```go
// DTO
type SendMessageRequest struct {
    UserID  string `json:"user_id" binding:"required"`
    Message string `json:"message" binding:"required,max=10000"`
}

// Handler
func SendMessageHandler(ctx context.Context, c *app.RequestContext) {
    var req dto.SendMessageRequest
    if err := c.BindAndValidate(&req); err != nil {
        // 错误处理
        return
    }
    // 业务逻辑
}

// Router
chat.POST("/send", handlers.SendMessageHandler)
```

**为什么不用 hz generator？**
- ✅ Vibe Coding Friendly - AI 可以一次性理解和修改
- ✅ 上下文连续 - 无需理解 IDL + 生成代码
- ✅ 修改成本低 - 直接改 Go 代码
- ✅ 符合 DDD - 代码组织更清晰

## 🔗 相关文档

- [Vibe Coding DDD 架构](../docs/vibe-coding-ddd-structure.md)
- [为什么不用 Hertz Generator](../docs/why-code-first.md)
- [类型同步指南](../docs/type-sync.md)
- [AI 协作工作流](../docs/ai_workflow.md)

## 🏗️ 分层架构

### Application Layer（应用层）★

**职责**：编排多个领域服务，实现跨领域业务流程

```go
// application/services/chat_orchestrator.go
func (o *ChatOrchestrator) SendMessage(ctx context.Context, req *SendMessageRequest) (*SendMessageResponse, error) {
    // 1. Chat Domain: 创建对话
    conv, err := o.conversationRepo.Create(...)
    
    // 2. Chat Domain: 保存用户消息
    userMsg, err := o.messageRepo.Save(...)
    
    // 3. LLM Domain: 生成回复
    llmResp, err := o.llmService.Generate(...)
    
    // 4. Chat Domain: 保存 AI 回复
    assistantMsg, err := o.messageRepo.Save(...)
    
    return response, nil
}
```

### Repository Pattern（仓储模式）★

**手写 Repository，Vibe Coding Friendly**

```
domains/chat/
├── model/              # 领域模型（纯业务）
└── repository/         # 仓储接口 + 实现
    ├── interface.go   # 仓储接口（领域语言）
    ├── message_repo.go # 使用 database/sql + 原生 SQL（~150 行）
    └── conversation_repo.go
```

**为什么使用 database/sql 而不是 ORM？**
- ✅ **透明度高**：SQL 清晰可见，AI 易于理解
- ✅ **性能更好**：无 ORM 开销，直接操作数据库
- ✅ **控制力强**：完全控制 SQL 语句，便于优化
- ✅ **Vibe-Coding 友好**：Repository 模式已提供抽象，无需 ORM
- ✅ **可维护性强**：SQL 一目了然，调试和优化更容易

## 🎯 扩展指南

本 Starter 提供了完整的 Chat 领域实现，作为最佳实践示例。

### 🔌 可选扩展（标注为 "Extension point"）

代码中所有标注 `Extension point` 的地方都是预留的扩展位置：

1. **LLM 集成** - 集成真实的 AI 服务（OpenAI, Claude 等）
   - 位置：`application/services/chat_orchestrator.go`
   - 参考：代码注释中的示例

2. **数据库持久化** - 连接真实数据库
   - 位置：`domains/chat/handlers/*.go`
   - 参考：`infrastructure/persistence/postgres/`

3. **事件总线** - 实现领域事件发布
   - 位置：`domains/shared/events/bus.go`
   - 选项：内存、Redis、Kafka

4. **JWT 认证** - 完整的 Token 验证
   - 位置：`infrastructure/middleware/auth.go`
   - 参考：代码注释中的示例

5. **OpenTelemetry** - 分布式追踪
   - 位置：`infrastructure/middleware/tracing.go`
   - 参考：go.opentelemetry.io/otel

### 📚 扩展文档

详细的扩展指南请参考：`docs/extensions/`（待创建）

### 🚀 快速开始开发

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 运行数据库迁移
cd backend
./scripts/schema.sh apply

# 3. 启动开发服务器
./scripts/dev.sh

# 4. 运行测试
./scripts/test_all.sh
```

