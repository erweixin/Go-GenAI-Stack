# Chat Domain (聊天领域)

## 概述

聊天领域负责处理用户与 LLM 的对话交互，包括消息发送、历史记录管理、对话管理等功能。

## 领域边界

### 职责范围

- ✅ 管理用户对话（Conversation）
- ✅ 处理消息发送和接收
- ✅ 存储和检索对话历史
- ✅ 流式消息传输（SSE）
- ✅ 对话上下文管理

### 不包含的职责

- ❌ LLM 模型选择和路由（属于 LLM Domain）
- ❌ Token 计费和限流（属于 Monitoring Domain）
- ❌ 用户认证和授权（属于 User Domain，未实现）

## 核心概念

参考 `glossary.md` 了解领域术语。

## 用例列表

参考 `usecases.yaml` 查看所有用例的声明式定义。

主要用例：
1. **SendMessage** - 发送消息到 LLM
2. **StreamMessage** - 流式发送消息
3. **GetHistory** - 获取对话历史
4. **CreateConversation** - 创建新对话
5. **DeleteConversation** - 删除对话

## 聚合根

- **Conversation** - 对话聚合根
  - ConversationID
  - UserID
  - Messages[]
  - Metadata

- **Message** - 消息实体
  - MessageID
  - Role (user/assistant/system)
  - Content
  - Tokens
  - Timestamp

## 领域事件

参考 `events.md` 查看所有领域事件。

## 业务规则

参考 `rules.md` 查看所有业务规则和约束。

## 依赖关系

### 下游依赖

- LLM Domain (通过事件或接口调用模型生成)
- Monitoring Domain (记录 token 使用和成本)

### 上游依赖

- 无

## 技术栈

- HTTP 框架：Hertz
- 流式传输：SSE (Server-Sent Events)
- 存储：待定（可选 PostgreSQL / MongoDB）

## 快速开始

### 发送消息示例

```bash
curl -X POST http://localhost:8080/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "message": "Hello, AI!",
    "model": "gpt-4o"
  }'
```

### 流式消息示例

```bash
curl -N http://localhost:8080/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "message": "Tell me a story"
  }'
```

## 待办事项

- [ ] 实现对话持久化
- [ ] 添加消息过滤和审查
- [ ] 实现对话分享功能
- [ ] 添加对话导出功能

## 相关文档

- [Glossary](./glossary.md) - 领域术语表
- [Rules](./rules.md) - 业务规则
- [Events](./events.md) - 领域事件
- [Use Cases](./usecases.yaml) - 用例定义

