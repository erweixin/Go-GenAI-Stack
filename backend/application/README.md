# Application Layer (应用层)

## 概述

应用层负责**编排多个领域**之间的交互，实现跨领域的业务流程。

## 职责

### ✅ 应用层的职责

1. **编排领域服务**：协调多个领域完成复杂业务流程
2. **事务管理**：管理跨领域的事务边界
3. **适配外部接口**：将 HTTP 请求适配到领域操作
4. **数据组合**：组合多个领域的数据返回给客户端

### ❌ 不属于应用层

- 业务逻辑实现（属于 Domain Layer）
- 技术基础设施（属于 Infrastructure Layer）
- HTTP 路由和中间件（属于 HTTP Layer）

## 目录结构

```
application/
├── services/           # 应用服务（编排多个领域）
│   ├── chat_orchestrator.go
│   ├── model_router.go
│   └── ...
│
├── dto/               # 应用层 DTO（可能组合多个领域）
│   └── orchestration.go
│
└── workflows/         # 复杂工作流（可选）
    └── ...
```

## 应用服务示例

### ChatOrchestrator

**职责**：编排 Chat Domain 和 LLM Domain

```go
type ChatOrchestrator struct {
    messageRepo      repository.MessageRepository  // Chat Domain
    conversationRepo repository.ConversationRepository
    llmService       *llm.Service                 // LLM Domain
    monitoring       *monitoring.Service           // Monitoring Domain
}

// SendMessage 编排多个领域完成发送消息
func (o *ChatOrchestrator) SendMessage(ctx context.Context, req *SendMessageRequest) (*SendMessageResponse, error) {
    // 1. Chat: 获取或创建对话
    conv, err := o.getOrCreateConversation(...)
    
    // 2. Chat: 保存用户消息
    userMsg, err := o.messageRepo.Save(...)
    
    // 3. LLM: 调用模型生成回复
    llmResp, err := o.llmService.Generate(...)
    
    // 4. Chat: 保存 AI 回复
    assistantMsg, err := o.messageRepo.Save(...)
    
    // 5. Monitoring: 记录指标
    o.monitoring.RecordUsage(...)
    
    return response, nil
}
```

## 分层架构

```
HTTP Layer (domains/*/http/)
    ↓ 调用
Application Layer (application/services/)  ← 编排多个领域
    ↓ 调用
Domain Layer (domains/*)                   ← 单一领域逻辑
    ↓ 调用
Infrastructure Layer (repository, infra/)  ← 持久化、外部服务
```

## 使用场景

### 场景 1：发送消息（跨 Chat + LLM）

```go
// HTTP Handler 调用应用服务
func SendMessageHandler(ctx context.Context, c *app.RequestContext) {
    var req dto.SendMessageRequest
    c.BindAndValidate(&req)
    
    // 调用应用层编排服务
    resp, err := chatOrchestrator.SendMessage(ctx, &services.SendMessageRequest{
        UserID: req.UserID,
        Message: req.Message,
    })
    
    c.JSON(200, resp)
}
```

### 场景 2：智能模型路由（跨 LLM + Monitoring）

```go
type ModelRouter struct {
    llmService  *llm.Service
    monitoring  *monitoring.Service
}

func (r *ModelRouter) SelectBestModel(ctx context.Context, req *SelectRequest) (string, error) {
    // 1. Monitoring: 获取各模型的性能指标
    metrics := r.monitoring.GetModelMetrics()
    
    // 2. LLM: 根据策略选择模型
    model := r.llmService.RouteModel(req.Strategy, metrics)
    
    return model, nil
}
```

## 与领域层的关系

### 领域层（Domain）

- **职责**：实现单一领域的业务逻辑
- **独立性**：不依赖其他领域
- **示例**：Chat Domain 只关注对话和消息

### 应用层（Application）

- **职责**：编排多个领域
- **依赖性**：可以依赖多个领域
- **示例**：ChatOrchestrator 协调 Chat + LLM + Monitoring

## 测试策略

### 应用层测试

```go
func TestChatOrchestrator_SendMessage(t *testing.T) {
    // Mock 领域服务
    mockMessageRepo := &MockMessageRepository{}
    mockConversationRepo := &MockConversationRepository{}
    mockLLMService := &MockLLMService{}
    
    orchestrator := NewChatOrchestrator(
        mockMessageRepo,
        mockConversationRepo,
        mockLLMService,
    )
    
    // 测试编排逻辑
    resp, err := orchestrator.SendMessage(ctx, req)
    
    // 验证各个领域服务被正确调用
    assert.NoError(t, err)
    assert.True(t, mockMessageRepo.SaveCalled)
    assert.True(t, mockLLMService.GenerateCalled)
}
```

## 最佳实践

### ✅ 应该做的

1. **编排，不实现**：应用层只编排，不实现业务逻辑
2. **事务边界**：在应用层管理跨领域事务
3. **薄层**：应用层应该保持简单，复杂逻辑放在领域层
4. **依赖注入**：通过构造函数注入领域服务

### ❌ 不应该做的

1. **不要在应用层实现业务规则**：业务规则属于领域层
2. **不要直接访问数据库**：通过领域的仓储接口
3. **不要跨领域直接调用**：通过应用层编排或事件
4. **不要在应用层处理 HTTP 细节**：HTTP 层的职责

## 相关文档

- [DDD 架构](../../docs/vibe-coding-ddd-structure.md)
- [Chat Domain](../domains/chat/README.md)
- [LLM Domain](../domains/llm/README.md)

