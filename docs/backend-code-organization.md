# Backend 代码组织规范
## 目录职责与使用规则

> 本文档明确 Backend 各目录的职责边界，确保代码组织清晰、易于 AI 理解。

**最后更新**：2025-11-23  
**状态**：✅ 已实施

---

## 📁 顶层目录职责

```
backend/
├── cmd/                    # 应用入口（可执行程序）
├── domains/                # 【领域层】业务逻辑（DDD 核心）
├── application/            # 【应用层】跨领域编排
├── infrastructure/         # 【基础设施层】技术实现
├── pkg/                    # 【技术工具包】纯技术、可复用
├── migrations/             # 数据库迁移
└── scripts/                # 开发脚本
```

---

## 🎯 核心规则

### Rule 1：`domains/` vs `application/`

| 目录 | 职责 | 示例 |
|------|------|------|
| `domains/{domain}/` | **单一领域**的业务逻辑 | Chat 领域的发送消息、获取历史 |
| `application/` | **跨领域编排**，协调多个领域 | 发送消息 + 调用 LLM + 记录监控 |

**判断标准**：
- ✅ 只涉及一个领域 → 放在 `domains/{domain}/handlers/`
- ✅ 涉及多个领域 → 放在 `application/services/`

**示例**：

```go
// ✅ 正确：单领域逻辑 → domains/chat/handlers/
func (s *HandlerService) GetHistoryHandler(ctx context.Context, c *app.RequestContext) {
    // 只操作 Chat 领域的 repository
    messages, err := s.messageRepo.FindByConversation(...)
}

// ✅ 正确：跨领域编排 → application/services/
func (o *ChatOrchestrator) SendMessage(ctx context.Context, req *SendMessageRequest) {
    // 1. Chat 领域：保存消息
    o.messageRepo.Save(...)
    
    // 2. LLM 领域：生成回复
    o.llmService.Generate(...)
    
    // 3. Monitoring 领域：记录指标
    o.monitoringService.RecordTokenUsage(...)
}
```

### Rule 2：`domains/shared/` vs `pkg/`

| 目录 | 用途 | 依赖性 | 示例 |
|------|------|--------|------|
| `domains/shared/` | **领域层共享**（业务相关） | ✅ 可依赖业务概念 | `errors/`（业务错误码）<br>`events/`（领域事件）<br>`types/`（领域通用类型） |
| `pkg/` | **技术工具包**（业务无关） | ❌ 不依赖业务概念<br>✅ 可复用到其他项目 | `validator/`<br>`logger/`<br>`ratelimiter/` |

**判断标准**：
- ✅ 包含业务术语/错误码/领域概念 → 放在 `domains/shared/`
- ✅ 纯技术实现，可用于任何项目 → 放在 `pkg/`

**示例**：

```go
// ✅ 正确：业务错误码 → domains/shared/errors/
const (
    MESSAGE_EMPTY        = "MESSAGE_EMPTY"          // 业务相关
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"
)

// ✅ 正确：通用验证器 → pkg/validator/
func ValidateEmail(email string) error {
    // 纯技术实现，任何项目都能用
}
```

### Rule 3：`handlers/` vs `http/`

| 目录 | 职责 | 依赖 | 示例 |
|------|------|------|------|
| `handlers/` | **用例实现**（业务逻辑） | ✅ 依赖 repository<br>✅ 依赖 domain model | 实现 usecases.yaml 中的用例 |
| `http/` | **HTTP 协议层**（路由注册） | ✅ 只依赖 handlers | 注册路由，映射 URL 到 handler |

**判断标准**：
- ✅ 业务逻辑（验证、调用 repository、返回结果）→ `handlers/`
- ✅ 路由注册（URL 映射）→ `http/router.go`
- ✅ 数据传输对象（DTO）→ `http/dto/`

**示例**：

```go
// ✅ 正确：handlers/send_message.handler.go（业务逻辑）
func (s *HandlerService) SendMessageHandler(ctx context.Context, c *app.RequestContext) {
    // 1. 解析请求
    var req dto.SendMessageRequest
    if err := c.BindAndValidate(&req); err != nil {
        // 错误处理
        return
    }
    
    // 2. 业务逻辑
    result, err := s.someBusinessLogic(ctx, &req)
    
    // 3. 返回响应
    c.JSON(200, result)
}

// ✅ 正确：http/router.go（只做路由注册）
func RegisterRoutes(r *route.RouterGroup, handlerService *handlers.HandlerService) {
    chat := r.Group("/chat")
    {
        chat.POST("/send", handlerService.SendMessageHandler)
        chat.GET("/history/:id", handlerService.GetHistoryHandler)
    }
}

// ❌ 错误：http/router.go 中实现业务逻辑
func RegisterRoutes(r *route.RouterGroup, repo Repository) {
    chat := r.Group("/chat")
    {
        chat.POST("/send", func(ctx context.Context, c *app.RequestContext) {
            // ❌ 不应该在这里写 50 行业务逻辑
            // ...
        })
    }
}
```

### Rule 4：`infrastructure/` vs `domains/{domain}/repository/`

| 目录 | 职责 | 示例 |
|------|------|------|
| `infrastructure/` | **全局基础设施**（所有领域共享） | `persistence/`（连接池）<br>`middleware/`<br>`config/` |
| `domains/{domain}/repository/` | **领域仓储**（特定于某个领域） | `message_repo.go`<br>`conversation_repo.go` |

**判断标准**：
- ✅ 全局共享的技术组件 → `infrastructure/`
- ✅ 特定领域的数据访问 → `domains/{domain}/repository/`

**示例**：

```
infrastructure/
├── persistence/
│   ├── postgres/
│   │   ├── connection.go      # ✅ 全局连接池
│   │   └── transaction.go     # ✅ 全局事务管理
│   └── redis/
│       └── connection.go      # ✅ 全局 Redis 连接

domains/chat/
├── repository/
│   ├── interface.go           # ✅ Chat 领域仓储接口
│   ├── message_repo.go        # ✅ Message 仓储实现（使用 postgres 连接）
│   └── conversation_repo.go   # ✅ Conversation 仓储实现
```

---

## 📂 领域目录结构

每个领域（`domains/{domain}/`）的标准结构：

```
domains/{domain}/
├── README.md              # ✅ 必需：领域概览
├── glossary.md            # ✅ 必需：术语表
├── rules.md               # ✅ 必需：业务规则
├── events.md              # ✅ 必需：领域事件
├── usecases.yaml          # ✅ 必需：用例声明
├── ai-metadata.json       # ✅ 必需：AI 元数据
│
├── model/                 # 【领域模型】纯业务逻辑
│   ├── {entity}.go        # 实体
│   └── {value_object}.go  # 值对象
│
├── repository/            # 【仓储】数据访问
│   ├── interface.go       # 仓储接口（领域语言）
│   └── {entity}_repo.go   # 仓储实现（database/sql）
│
├── services/              # 【领域服务】复杂业务逻辑（可选）
│   └── {service}.go       # 跨实体的业务逻辑
│
├── handlers/              # 【用例处理器】实现 usecases.yaml
│   ├── service.go         # Handler 服务（依赖注入容器）
│   └── {usecase}.handler.go  # 用例实现
│
├── http/                  # 【HTTP 接口层】协议适配
│   ├── dto/               # 数据传输对象
│   │   └── {usecase}.go   # 请求/响应 DTO（tygo 源）
│   └── router.go          # 路由注册（只做路由）
│
├── adapters/              # 【外部服务适配器】（可选）
│   └── {service}_adapter.go
│
└── tests/                 # 【测试】
    ├── {usecase}.test.go  # 单元测试
    └── {entity}_integration.test.go  # 集成测试
```

---

## 📋 文件职责清单

### `model/` - 领域模型

**职责**：
- 定义实体（Entity）、值对象（Value Object）、聚合根（Aggregate Root）
- 包含核心业务逻辑和不变量（Invariants）
- 纯业务概念，不依赖基础设施

**规则**：
- ✅ 可以有方法（行为优先于数据）
- ✅ 可以抛出领域异常
- ❌ 不能依赖 repository
- ❌ 不能依赖 HTTP、数据库等技术细节

**示例**：

```go
// model/conversation.go
package model

type Conversation struct {
    ID        string
    UserID    string
    Title     string
    CreatedAt time.Time
    UpdatedAt time.Time
}

// NewConversation 创建新对话（工厂方法）
func NewConversation(userID, title string) *Conversation {
    return &Conversation{
        ID:        generateID(),
        UserID:    userID,
        Title:     title,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
}

// ChangeTitle 修改标题（业务方法）
func (c *Conversation) ChangeTitle(newTitle string) error {
    if len(newTitle) == 0 {
        return errors.New("title cannot be empty")  // 业务不变量
    }
    c.Title = newTitle
    c.UpdatedAt = time.Now()
    return nil
}
```

### `repository/` - 仓储

**职责**：
- 定义数据访问接口（`interface.go`）
- 实现数据持久化（`*_repo.go`）
- 使用 `database/sql`，不使用 ORM

**规则**：
- ✅ 接口使用领域语言（FindByID, Save, Delete）
- ✅ 实现使用 SQL 语句（透明、可控）
- ✅ 返回领域模型（`*model.Entity`）
- ❌ 不包含业务逻辑

**示例**：

```go
// repository/interface.go
package repository

type MessageRepository interface {
    Save(ctx context.Context, msg *model.Message) error
    FindByID(ctx context.Context, id string) (*model.Message, error)
    FindByConversation(ctx context.Context, convID string, limit, offset int) ([]*model.Message, error)
    Delete(ctx context.Context, id string) error
}

// repository/message_repo.go
package repository

type MessageRepositoryImpl struct {
    db *sql.DB
}

func (r *MessageRepositoryImpl) Save(ctx context.Context, msg *model.Message) error {
    query := `INSERT INTO messages (id, conversation_id, content) VALUES ($1, $2, $3)`
    _, err := r.db.ExecContext(ctx, query, msg.ID, msg.ConversationID, msg.Content)
    return err
}
```

### `services/` - 领域服务（可选）

**职责**：
- 实现**跨实体**的复杂业务逻辑
- 当逻辑不属于任何单一实体时使用

**规则**：
- ✅ 只处理**单领域内**的复杂逻辑
- ✅ 可以依赖 repository
- ✅ 可以依赖多个 model
- ❌ 不跨领域（跨领域用 application 层）

**示例**：

```go
// services/context_manager.go
package services

// ContextManager 上下文管理服务
// 负责管理对话上下文窗口（涉及 Conversation 和 Message 两个实体）
type ContextManager struct {
    messageRepo repository.MessageRepository
}

func (s *ContextManager) TrimContextWindow(ctx context.Context, convID string, maxTokens int) error {
    // 跨实体的复杂逻辑
    messages, _ := s.messageRepo.FindByConversation(ctx, convID, -1, 0)
    totalTokens := calculateTotalTokens(messages)
    
    if totalTokens > maxTokens {
        // 裁剪逻辑
    }
    return nil
}
```

### `handlers/` - 用例处理器

**职责**：
- 实现 `usecases.yaml` 中定义的用例
- 协调 repository、services、model 完成业务流程
- 处理 HTTP 请求和响应

**规则**：
- ✅ 每个 handler 对应一个用例
- ✅ 使用依赖注入（通过 `service.go`）
- ✅ 处理错误和返回响应
- ❌ 不包含领域逻辑（领域逻辑在 model 或 services 中）

**文件结构**：

```go
// handlers/service.go（依赖注入容器）
package handlers

type HandlerService struct {
    messageRepo      repository.MessageRepository
    conversationRepo repository.ConversationRepository
    contextManager   services.ContextManager
}

func NewHandlerService(...) *HandlerService {
    return &HandlerService{...}
}

// handlers/send_message.handler.go（用例实现）
package handlers

// SendMessageHandler 发送消息到 LLM
//
// 用例：SendMessage（参考 usecases.yaml）
func (s *HandlerService) SendMessageHandler(ctx context.Context, c *app.RequestContext) {
    // 1. 解析请求
    var req dto.SendMessageRequest
    if err := c.BindAndValidate(&req); err != nil {
        c.JSON(400, errorResponse(err))
        return
    }
    
    // 2. 调用领域逻辑
    conv, _ := s.conversationRepo.FindByID(ctx, req.ConversationID)
    msg := model.NewUserMessage(conv.ID, req.Message)
    s.messageRepo.Save(ctx, msg)
    
    // 3. 返回响应
    c.JSON(200, dto.SendMessageResponse{...})
}
```

### `http/` - HTTP 协议层

**职责**：
- 定义 DTO（数据传输对象）
- 注册路由（URL → Handler 映射）

**规则**：
- ✅ `dto/` 目录包含请求/响应结构体
- ✅ `router.go` 只做路由注册
- ❌ 不包含业务逻辑
- ❌ 不直接操作 repository

**文件结构**：

```go
// http/dto/send_message.go
package dto

type SendMessageRequest struct {
    UserID  string `json:"user_id" binding:"required"`
    Message string `json:"message" binding:"required,max=10000"`
}

type SendMessageResponse struct {
    MessageID string `json:"message_id"`
    Content   string `json:"content"`
}

// http/router.go
package http

func RegisterRoutes(r *route.RouterGroup, handlerService *handlers.HandlerService) {
    chat := r.Group("/chat")
    {
        chat.POST("/send", handlerService.SendMessageHandler)
        chat.GET("/history/:id", handlerService.GetHistoryHandler)
    }
}
```

### `adapters/` - 外部服务适配器（可选）

**职责**：
- 适配外部服务（如 LLM API）
- 将外部接口转换为领域接口

**规则**：
- ✅ 实现领域定义的接口
- ✅ 隔离外部依赖
- ✅ 可替换（如切换 OpenAI → Claude）

**示例**：

```go
// adapters/eino_adapter.go
package adapters

type EinoLLMAdapter struct {
    client *eino.Client
}

func (a *EinoLLMAdapter) Generate(ctx context.Context, req *LLMRequest) (*LLMResponse, error) {
    // 调用 Eino API 并转换为领域对象
}
```

---

## 🔄 Application 层详解

### 何时使用 Application 层？

**使用场景**：
1. ✅ **跨领域编排**：需要协调多个领域
2. ✅ **复杂事务**：涉及多个聚合根的事务
3. ✅ **外部服务调用**：需要调用 LLM、支付、通知等外部服务

**不使用场景**：
1. ❌ **单领域操作**：只操作一个领域 → 用 `handlers/`
2. ❌ **简单 CRUD**：直接调用 repository → 用 `handlers/`

### Application 层结构

```
application/
├── services/              # 应用服务（编排器）
│   ├── chat_orchestrator.go
│   ├── llm_orchestrator.go
│   └── monitoring_orchestrator.go
│
└── dto/                   # 应用层 DTO（可选）
    └── orchestration.go
```

### 示例对比

**场景 1：获取对话历史（单领域）**

```go
// ✅ 正确：使用 domains/chat/handlers/
func (s *HandlerService) GetHistoryHandler(ctx context.Context, c *app.RequestContext) {
    // 只涉及 Chat 领域
    messages, err := s.messageRepo.FindByConversation(ctx, conversationID, limit, offset)
    c.JSON(200, messages)
}
```

**场景 2：发送消息并生成回复（跨领域）**

```go
// ✅ 正确：使用 application/services/
func (o *ChatOrchestrator) SendMessage(ctx context.Context, req *SendMessageRequest) (*SendMessageResponse, error) {
    // 1. Chat 领域：保存用户消息
    userMsg := model.NewUserMessage(convID, req.Message)
    o.messageRepo.Save(ctx, userMsg)
    
    // 2. LLM 领域：生成回复
    llmResp, err := o.llmService.Generate(ctx, &LLMRequest{
        Model:    req.Model,
        Messages: conv.GetHistory(),
    })
    
    // 3. Chat 领域：保存 AI 回复
    assistantMsg := model.NewAssistantMessage(convID, llmResp.Content, req.Model, llmResp.Tokens)
    o.messageRepo.Save(ctx, assistantMsg)
    
    // 4. Monitoring 领域：记录指标
    o.monitoringService.RecordTokenUsage(ctx, req.Model, llmResp.Tokens)
    
    return &SendMessageResponse{...}, nil
}
```

---

## ✅ 检查清单

在提交代码前，检查是否符合以下规则：

### 目录组织
- [ ] 业务错误码在 `domains/shared/errors/`
- [ ] 通用工具在 `pkg/`
- [ ] 全局基础设施在 `infrastructure/`
- [ ] 领域仓储在 `domains/{domain}/repository/`

### 领域结构
- [ ] 每个领域有 6 个必需文件
- [ ] 每个用例有对应的 handler
- [ ] 每个 handler 有对应的 DTO
- [ ] 每个 handler 有对应的测试

### 代码职责
- [ ] `http/router.go` 只做路由注册
- [ ] `handlers/` 实现业务逻辑
- [ ] `model/` 不依赖基础设施
- [ ] `repository/` 使用 `database/sql`

### Application 层
- [ ] 单领域操作在 `domains/{domain}/handlers/`
- [ ] 跨领域编排在 `application/services/`
- [ ] Orchestrator 协调多个领域

---

## 📚 相关文档

- [Backend 架构优化计划](./backend-optimization-plan.md)
- [Backend 快速参考](./backend-quick-reference.md)
- [Vibe Coding DDD 架构](./vibe-coding-ddd-structure.md)
- [用例驱动开发指南](./guides/usecase-driven-development.md)（规划中）

---

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team

