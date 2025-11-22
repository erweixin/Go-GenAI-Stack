# Chat Domain Events (聊天领域事件)

## 事件概述

领域事件用于：
1. **解耦领域**：Chat Domain 通过事件与其他领域通信
2. **审计日志**：记录关键操作
3. **异步处理**：触发后续流程（如统计、通知）
4. **事件溯源**：重建领域状态

## 事件命名约定

- 使用过去时（Past Tense）
- PascalCase 格式
- 动词 + 名词，如 `MessageSent`, `ConversationCreated`

---

## 消息相关事件

### MessageSent
**描述**：用户发送了一条消息

**触发时机**：用户消息通过验证后

**Payload**：
```json
{
  "event_type": "MessageSent",
  "event_id": "evt-123abc",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "message_id": "msg-456",
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "content": "Hello, AI!",
    "role": "user",
    "tokens": 3
  }
}
```

**消费者**：
- LLM Domain（触发模型生成）
- Monitoring Domain（记录 token 使用）
- Analytics Service（统计分析）

**后续动作**：
- 调用 LLM 生成回复
- 更新 token 计数
- 记录用户活跃度

---

### MessageReceived
**描述**：收到了 AI 的回复消息

**触发时机**：LLM 生成完成，消息保存后

**Payload**：
```json
{
  "event_type": "MessageReceived",
  "event_id": "evt-124abc",
  "timestamp": "2024-01-01T12:00:05Z",
  "data": {
    "message_id": "msg-457",
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "content": "Hello! How can I help you?",
    "role": "assistant",
    "model": "gpt-4o",
    "tokens": 8,
    "latency_ms": 1200
  }
}
```

**消费者**：
- Monitoring Domain（记录性能指标）
- Notification Service（推送通知）
- Analytics Service（统计模型使用）

---

### MessageFiltered
**描述**：消息被内容审核过滤

**触发时机**：消息未通过内容审核

**Payload**：
```json
{
  "event_type": "MessageFiltered",
  "event_id": "evt-125abc",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "user_id": "user-123",
    "conversation_id": "conv-789",
    "content_hash": "abc123...",
    "filter_reason": "inappropriate_content",
    "severity": "high"
  }
}
```

**消费者**：
- Security Service（记录安全事件）
- Admin Dashboard（管理员通知）

**注意**：不记录完整内容，只记录哈希值（隐私保护）

---

## 对话相关事件

### ConversationCreated
**描述**：创建了新对话

**触发时机**：新对话初始化完成

**Payload**：
```json
{
  "event_type": "ConversationCreated",
  "event_id": "evt-126abc",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "title": "新对话",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**消费者**：
- Analytics Service（统计新对话数）
- User Service（更新用户活跃度）

---

### ConversationUpdated
**描述**：对话信息被更新（如标题修改）

**触发时机**：对话元数据变更

**Payload**：
```json
{
  "event_type": "ConversationUpdated",
  "event_id": "evt-127abc",
  "timestamp": "2024-01-01T12:05:00Z",
  "data": {
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "changes": {
      "title": {
        "old": "新对话",
        "new": "关于 AI 的讨论"
      }
    }
  }
}
```

**消费者**：
- Audit Log Service（审计追踪）

---

### ConversationDeleted
**描述**：对话被删除

**触发时机**：用户删除对话且确认

**Payload**：
```json
{
  "event_type": "ConversationDeleted",
  "event_id": "evt-128abc",
  "timestamp": "2024-01-01T13:00:00Z",
  "data": {
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "message_count": 10,
    "total_tokens": 1500,
    "deleted_by": "user"
  }
}
```

**消费者**：
- Analytics Service（统计删除率）
- Cleanup Service（清理关联数据）

**重要**：此事件后，相关数据应被清理

---

## 流式传输事件

### StreamStarted
**描述**：流式传输开始

**触发时机**：SSE 连接建立，开始生成

**Payload**：
```json
{
  "event_type": "StreamStarted",
  "event_id": "evt-129abc",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "stream_id": "stream-111",
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "model": "gpt-4o"
  }
}
```

**消费者**：
- Monitoring Domain（监控并发连接数）

---

### StreamCompleted
**描述**：流式传输完成

**触发时机**：消息生成完毕，连接关闭

**Payload**：
```json
{
  "event_type": "StreamCompleted",
  "event_id": "evt-130abc",
  "timestamp": "2024-01-01T12:00:15Z",
  "data": {
    "stream_id": "stream-111",
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "message_id": "msg-458",
    "total_tokens": 150,
    "duration_ms": 15000,
    "chunks_sent": 75
  }
}
```

**消费者**：
- Monitoring Domain（记录流式性能）
- Analytics Service（统计流式使用率）

---

### StreamFailed
**描述**：流式传输失败

**触发时机**：连接中断或生成失败

**Payload**：
```json
{
  "event_type": "StreamFailed",
  "event_id": "evt-131abc",
  "timestamp": "2024-01-01T12:00:10Z",
  "data": {
    "stream_id": "stream-111",
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "error_type": "connection_timeout",
    "error_message": "Client connection closed",
    "duration_ms": 10000,
    "partial_tokens": 50
  }
}
```

**消费者**：
- Monitoring Domain（监控失败率）
- Alert Service（高失败率时告警）

---

## 错误相关事件

### RateLimitExceeded
**描述**：用户触发限流

**触发时机**：请求频率超过限制

**Payload**：
```json
{
  "event_type": "RateLimitExceeded",
  "event_id": "evt-132abc",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "user_id": "user-123",
    "limit_type": "per_minute",
    "limit_value": 60,
    "current_count": 61,
    "retry_after": 30
  }
}
```

**消费者**：
- Security Service（检测异常行为）
- User Service（通知用户）

---

### ContextLimitExceeded
**描述**：对话上下文超过 Token 限制

**触发时机**：尝试发送消息但上下文过长

**Payload**：
```json
{
  "event_type": "ContextLimitExceeded",
  "event_id": "evt-133abc",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "conversation_id": "conv-789",
    "user_id": "user-123",
    "current_tokens": 130000,
    "max_tokens": 128000,
    "model": "gpt-4o"
  }
}
```

**消费者**：
- Chat Domain 内部（触发历史截断）
- User Service（提示用户）

---

## 事件处理模式

### 同步事件
在同一事务内处理，确保一致性。

**示例**：`MessageSent` 后立即触发 LLM 生成（虽然可以异步，但为了用户体验选择同步）

### 异步事件
通过消息队列异步处理，解耦系统。

**示例**：`MessageReceived` 后的统计分析、通知推送

### 事件总线
使用事件总线（如 Kafka, RabbitMQ）传递事件。

**配置示例**：
```yaml
event_bus:
  type: kafka
  brokers:
    - localhost:9092
  topics:
    chat_events: "chat.events"
```

---

## 事件订阅关系

```
MessageSent
  ├─→ LLM Domain (生成回复)
  ├─→ Monitoring Domain (记录 token)
  └─→ Analytics Service (统计)

MessageReceived
  ├─→ Monitoring Domain (性能指标)
  ├─→ Notification Service (推送)
  └─→ Analytics Service (统计)

ConversationCreated
  ├─→ Analytics Service (统计)
  └─→ User Service (用户活跃度)

ConversationDeleted
  ├─→ Analytics Service (删除率)
  └─→ Cleanup Service (清理数据)

RateLimitExceeded
  ├─→ Security Service (异常检测)
  └─→ User Service (通知用户)
```

---

## 事件存储

### 事件日志表结构（示例）

```sql
CREATE TABLE chat_events (
    event_id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(36) NOT NULL,  -- conversation_id or message_id
    user_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    payload JSON NOT NULL,
    version INT NOT NULL DEFAULT 1,
    INDEX idx_aggregate (aggregate_id, timestamp),
    INDEX idx_user (user_id, timestamp),
    INDEX idx_type (event_type, timestamp)
);
```

### 事件重放
通过事件日志可以重建对话状态：

```go
func ReplayConversation(conversationID string) (*Conversation, error) {
    events := LoadEvents(conversationID)
    conv := &Conversation{}
    
    for _, event := range events {
        switch event.Type {
        case "ConversationCreated":
            conv = NewConversation(event.Data)
        case "MessageSent":
            conv.AddMessage(event.Data)
        case "MessageReceived":
            conv.AddMessage(event.Data)
        }
    }
    
    return conv, nil
}
```

---

## 事件版本控制

当事件结构变化时，使用版本号：

```json
{
  "event_type": "MessageSent",
  "event_version": 2,  // ← 版本号
  "data": {
    // V2 的新字段
    "sentiment": "positive"
  }
}
```

处理时根据版本号适配：

```go
switch event.Version {
case 1:
    return handleMessageSentV1(event)
case 2:
    return handleMessageSentV2(event)
}
```

