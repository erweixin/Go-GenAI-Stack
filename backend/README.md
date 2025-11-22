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
│   │   │   ├── message_repo.go
│   │   │   └── conversation_repo.go
│   │   │
│   │   ├── internal/       # 内部实现
│   │   │   └── po/         # 持久化对象 ★
│   │   │       ├── message_po.go
│   │   │       └── conversation_po.go
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
├── repository/         # 仓储接口 + 实现
│   ├── interface.go   # 仓储接口（领域语言）
│   ├── message_repo.go # 实现（~100 行，清晰）
│   └── conversation_repo.go
└── internal/po/        # 持久化对象（数据库映射）
    ├── message_po.go
    └── conversation_po.go
```

**为什么不用 gorm.io/gen？**
- ❌ 生成大量代码（~800 行/表）
- ❌ 打断 Vibe Coding 流程（改配置→生成）
- ✅ 手写更清晰（~100 行/表）
- ✅ AI 容易理解和修改

## 📈 架构优化计划

当前架构已经初步实现 Vibe-Coding-Friendly DDD，但还有提升空间。我们制定了一个为期 5 周的优化计划：

### 📚 优化文档
- **[架构优化计划](../docs/optimization-plan.md)** - 详细的优化计划（1500+ 行）
  - 包含完整的任务说明、代码示例、设计思路
  - 适合：项目负责人、架构师深入阅读

- **[优化任务清单](../docs/optimization-checklist.md)** - 简化的任务清单（300 行）
  - 快速追踪进度，方便日常使用
  - 适合：开发人员每日更新

- **[快速上手指南](../docs/optimization-quickstart.md)** - 5 分钟了解如何开始
  - 新成员快速上手
  - 常见问题解答

### 🎯 优化重点

**P0 - 最高优先级（前 2 周）**
- [ ] 完善 LLM 领域（缺少 usecases.yaml 等 5 个文件）⭐ 最关键
- [ ] 为所有领域添加 tests/ 目录（当前完全缺失）
- [ ] 创建事件总线（domains/shared/events/）

**P1 - 高优先级（第 3-4 周）**
- [ ] 重构基础设施层（infra/ → infrastructure/）
- [ ] 创建 Monitoring 领域（监控、追踪、成本统计）

**P2 - 中优先级（第 5 周）**
- [ ] 添加 pkg/ 可复用工具包
- [ ] 实现 ai_codegen.sh 脚本（自动生成代码）
- [ ] 添加数据库迁移管理

### 🚀 快速开始优化

```bash
# 1. 查看优化计划
cat ../docs/optimization-quickstart.md

# 2. 第一个任务：创建 LLM 领域的 glossary.md
vim domains/llm/glossary.md
# 参考 domains/chat/glossary.md

# 3. 验证进度
./scripts/validate_structure.sh  # TODO: 第 5 周实现
```

### 📊 当前状态

**✅ 已完成**
- Chat 领域完整（6 个必需文件齐全）
- 基本的 HTTP 路由和 handlers
- 应用层编排
- Repository 模式

**❌ 待完善**
- LLM 领域缺少 usecases.yaml（最严重）
- 所有领域缺少 tests/ 目录
- 缺少事件总线
- 缺少 Monitoring 领域
- 缺少 AI 代码生成脚本

**预计完成时间**：2025-12-27

## 🚧 原有待办事项

- [x] 创建应用层（Application Layer）
- [x] 创建仓储层（Repository Pattern）
- [x] 数据库初始化
- [ ] 集成 Eino LLM 框架
- [ ] 实现 Redis 缓存和限流
- [ ] 实现事件总线（Kafka）
- [ ] 添加认证和授权
- [ ] 实现 Structured Output
- [ ] 实现多模型路由
- [ ] 添加监控和可观测性

