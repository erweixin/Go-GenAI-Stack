# Application Layer & Repository 设置完成 ✅

## 🎯 完成内容

按照 **Vibe Coding Friendly** 原则，使用**手写 Repository** 方式创建了完整的应用层和仓储层。

## 📁 新增文件清单

### 1. Application Layer（应用层）★★★

**应用服务**：
- ✅ `application/services/chat_orchestrator.go` - 聊天编排服务
  - 编排 Chat Domain + LLM Domain + Monitoring Domain
  - 跨领域事务管理
  - 复杂业务流程实现

**应用 DTO**：
- ✅ `application/dto/orchestration.go` - 应用层 DTO
  - 组合多个领域的数据
  - 跨领域的请求/响应结构

**文档**：
- ✅ `application/README.md` - 应用层职责说明

### 2. Repository Layer（仓储层）★★★

**仓储接口**（领域定义）：
- ✅ `domains/chat/repository/interface.go`
  - `MessageRepository` 接口
  - `ConversationRepository` 接口
  - 使用领域语言定义

**仓储实现**（手写）：
- ✅ `domains/chat/repository/message_repo.go` - 消息仓储实现
  - Save, FindByID, FindByConversation, FindRecent, Count, Delete
  - 领域模型 ↔ 持久化对象转换
  
- ✅ `domains/chat/repository/conversation_repo.go` - 对话仓储实现
  - Create, FindByID, FindByUser, Update, Delete, CountByUser

### 3. Persistent Objects（持久化对象）

**PO 定义**（数据库映射）：
- ✅ `domains/chat/internal/po/message_po.go` - 消息 PO
  - GORM 标签定义
  - 表名：`messages`
  
- ✅ `domains/chat/internal/po/conversation_po.go` - 对话 PO
  - GORM 标签定义
  - 表名：`conversations`

### 4. Infrastructure（基础设施）

**数据库初始化**：
- ✅ `infra/database/database.go`
  - 数据库连接
  - 自动迁移
  - 配置管理

**依赖更新**：
- ✅ `go.mod` - 添加 GORM 依赖

## 🏗️ 完整的分层架构

```
backend/
├── cmd/server/main.go          # 【入口层】启动服务器
│
├── application/                # 【应用层】★ 跨领域编排
│   ├── services/
│   │   └── chat_orchestrator.go
│   ├── dto/
│   │   └── orchestration.go
│   └── README.md
│
├── domains/                    # 【领域层】单一领域
│   └── chat/
│       ├── README.md          # 显式知识文件
│       ├── glossary.md
│       ├── rules.md
│       ├── events.md
│       ├── usecases.yaml      # ★ AI 可读
│       ├── ai-metadata.json
│       │
│       ├── model/             # 领域模型（纯业务）
│       │   ├── conversation.go
│       │   └── message.go
│       │
│       ├── repository/        # 仓储接口 + 实现 ★
│       │   ├── interface.go
│       │   ├── message_repo.go
│       │   └── conversation_repo.go
│       │
│       ├── internal/          # 内部实现
│       │   └── po/           # 持久化对象 ★
│       │       ├── message_po.go
│       │       └── conversation_po.go
│       │
│       ├── handlers/          # 用例实现
│       └── http/              # HTTP 接口
│
├── shared/                     # 【基础设施层】
│   ├── middleware/
│   └── errors/
│
└── infra/                      # 【数据层】★
    └── database/
        └── database.go
```

## 🔄 数据流向

### 完整的请求流程

```
HTTP Request
    ↓
HTTP Handler (domains/chat/http/)
    ↓ 调用
Application Service (application/services/chat_orchestrator.go)
    ↓ 编排
    ├─→ Chat Domain (repository → model)
    ├─→ LLM Domain (TODO: 生成回复)
    └─→ Monitoring Domain (TODO: 记录指标)
    ↓
Repository (domains/chat/repository/)
    ↓ 转换
PO (domains/chat/internal/po/)
    ↓ GORM
Database (PostgreSQL)
```

### 层级职责

```
┌─────────────────────────────────────┐
│  HTTP Layer                         │  接收请求、返回响应
│  domains/*/http/                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Application Layer ★                │  编排多个领域
│  application/services/              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Domain Layer                       │  业务逻辑实现
│  domains/*/model/                   │
│  domains/*/repository/interface.go  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Repository Implementation ★        │  持久化实现
│  domains/*/repository/*_repo.go     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Persistent Object ★                │  数据库映射
│  domains/*/internal/po/             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │  持久化存储
└─────────────────────────────────────┘
```

## ✨ Vibe Coding Friendly 特点

### 1. **清晰的职责分离**

```go
// 领域模型（纯业务概念）
type Message struct {
    MessageID string
    Content   string
    // 无数据库细节
}

// 持久化对象（数据库映射）
type MessagePO struct {
    ID        uint64 `gorm:"primaryKey"`
    MessageID string `gorm:"uniqueIndex"`
    // GORM 标签
}
```

**优点**：
- ✅ AI 容易理解业务模型和数据库模型的区别
- ✅ 领域模型独立于持久化方式

### 2. **手写 Repository，简单直接**

```go
// 仓储接口（领域语言）
type MessageRepository interface {
    Save(ctx context.Context, message *model.Message) error
    FindByConversation(ctx context.Context, conversationID string) ([]*model.Message, error)
}

// 实现（清晰易懂）
func (r *messageRepository) Save(ctx context.Context, message *model.Message) error {
    messagePO := r.toMessagePO(message)  // 转换
    return r.db.Create(messagePO).Error  // 保存
}
```

**优点**：
- ✅ 代码量少（~100 行/仓储）
- ✅ AI 一看就懂
- ✅ 直接修改，无需生成

### 3. **应用层编排清晰**

```go
func (o *ChatOrchestrator) SendMessage(ctx context.Context, req *SendMessageRequest) (*SendMessageResponse, error) {
    // Step 1: Chat - 创建对话
    conv, err := o.conversationRepo.Create(...)
    
    // Step 2: Chat - 保存用户消息
    userMsg, err := o.messageRepo.Save(...)
    
    // Step 3: LLM - 生成回复（TODO）
    llmResp, err := o.llmService.Generate(...)
    
    // Step 4: Chat - 保存 AI 回复
    assistantMsg, err := o.messageRepo.Save(...)
    
    // Step 5: Monitoring - 记录指标（TODO）
    o.monitoring.RecordUsage(...)
    
    return response, nil
}
```

**优点**：
- ✅ 流程一目了然
- ✅ AI 理解业务编排
- ✅ 注释清晰标注 TODO

### 4. **internal/ 隔离内部细节**

```
domains/chat/
├── model/         # 公开：领域模型
├── repository/    # 公开：仓储接口
└── internal/      # 私有：实现细节
    └── po/        # ← 数据库映射不外露
```

**优点**：
- ✅ PO 不会污染领域层
- ✅ Go 的 internal 包机制天然隔离

## 🎓 使用示例

### 示例 1：HTTP Handler 使用应用服务

```go
// domains/chat/http/handler.go
package http

import "github.com/your-org/go-genai-stack/application/services"

type Handler struct {
    orchestrator *services.ChatOrchestrator
}

func (h *Handler) SendMessage(ctx context.Context, c *app.RequestContext) {
    var req dto.SendMessageRequest
    c.BindAndValidate(&req)
    
    // 调用应用层编排服务
    resp, err := h.orchestrator.SendMessage(ctx, &services.SendMessageRequest{
        UserID:  req.UserID,
        Message: req.Message,
        Model:   req.Model,
    })
    
    if err != nil {
        c.JSON(500, map[string]string{"error": err.Error()})
        return
    }
    
    c.JSON(200, resp)
}
```

### 示例 2：应用服务使用仓储

```go
// application/services/chat_orchestrator.go
func (o *ChatOrchestrator) GetConversationHistory(ctx context.Context, convID, userID string) ([]*model.Message, error) {
    // 1. 验证所有权
    conv, err := o.conversationRepo.FindByID(ctx, convID)
    if conv.UserID != userID {
        return nil, errors.New("unauthorized")
    }
    
    // 2. 获取消息
    messages, err := o.messageRepo.FindByConversation(ctx, convID, 100, 0)
    
    return messages, nil
}
```

### 示例 3：领域模型 ↔ PO 转换

```go
// repository/message_repo.go

// 领域模型 → PO（保存时）
func (r *messageRepository) toMessagePO(message *model.Message) *po.MessagePO {
    return &po.MessagePO{
        MessageID:      message.MessageID,
        ConversationID: message.ConversationID,
        Role:           message.Role,
        Content:        message.Content,
        Tokens:         message.Tokens,
        Timestamp:      message.Timestamp,
    }
}

// PO → 领域模型（查询时）
func (r *messageRepository) toMessage(po *po.MessagePO) *model.Message {
    return &model.Message{
        MessageID:      po.MessageID,
        ConversationID: po.ConversationID,
        Role:           po.Role,
        Content:        po.Content,
        Tokens:         po.Tokens,
        Timestamp:      po.Timestamp,
    }
}
```

## 🚀 下一步

### 1. 初始化数据库

```bash
# 安装 PostgreSQL（如果还没有）
brew install postgresql  # macOS
# 或 docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres

# 创建数据库
createdb go_genai_stack

# 运行服务器（会自动迁移表结构）
go run cmd/server/main.go
```

### 2. 更新 main.go 使用应用层

```go
// cmd/server/main.go
import (
    "github.com/your-org/go-genai-stack/application/services"
    "github.com/your-org/go-genai-stack/domains/chat/repository"
    "github.com/your-org/go-genai-stack/infra/database"
)

func main() {
    // 1. 初始化数据库
    db, err := database.InitDB()
    if err != nil {
        log.Fatal(err)
    }
    
    // 2. 创建仓储
    messageRepo := repository.NewMessageRepository(db)
    conversationRepo := repository.NewConversationRepository(db)
    
    // 3. 创建应用服务
    chatOrchestrator := services.NewChatOrchestrator(
        messageRepo,
        conversationRepo,
    )
    
    // 4. 创建 HTTP Handler（注入应用服务）
    chatHandler := http.NewChatHandler(chatOrchestrator)
    
    // 5. 注册路由
    h := server.Default()
    // ...
}
```

### 3. 集成 LLM Domain

在 `application/services/chat_orchestrator.go` 中：

```go
// 取消注释 LLM 调用
llmResponse, err := o.llmService.Generate(ctx, &llm.Request{
    Model: req.Model,
    Messages: conv.GetHistory(),
})
```

## 📊 对比：gorm.io/gen vs 手写

| 维度 | gorm.io/gen | 手写 Repository ✅ |
|------|-------------|-------------------|
| **代码量** | 生成 ~800 行/表 | 手写 ~100 行/表 |
| **AI 理解** | ❌ 难（大量样板） | ✅ 易（清晰直接） |
| **修改流程** | ❌ 改配置→生成 | ✅ 直接修改 |
| **Vibe Coding** | ❌ 2/10 | ✅ 9/10 |
| **DDD 原则** | ⚠️ 弱 | ✅ 强 |

## 🎉 总结

已完成：

1. ✅ **Application Layer** - 跨领域编排
2. ✅ **Repository Layer** - 手写仓储（Vibe Coding Friendly）
3. ✅ **Persistent Objects** - 轻量级 GORM 映射
4. ✅ **Database Infrastructure** - 数据库初始化
5. ✅ **清晰的分层架构** - 符合 DDD 原则

**核心优势**：
- ✅ 代码清晰，AI 容易理解
- ✅ 直接修改，无需代码生成
- ✅ 完全控制，灵活度高
- ✅ 符合 DDD 和 Vibe Coding 原则

现在可以开始实现真正的业务逻辑了！🚀

