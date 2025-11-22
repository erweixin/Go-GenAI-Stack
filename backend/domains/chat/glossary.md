# Chat Domain Glossary (聊天领域术语表)

## 核心术语

### Conversation (对话)
**定义**：用户与 AI 助手之间的一次完整交互会话，包含多轮消息往返。

**属性**：
- ConversationID: 唯一标识符
- UserID: 所属用户
- Title: 对话标题（通常由首条消息生成）
- CreatedAt: 创建时间
- UpdatedAt: 最后更新时间

**相关实体**：Message, User

**生命周期**：创建 → 活跃 → 归档 → 删除

---

### Message (消息)
**定义**：对话中的单条消息，可以是用户输入或 AI 回复。

**属性**：
- MessageID: 唯一标识符
- ConversationID: 所属对话
- Role: 角色（user/assistant/system）
- Content: 消息内容
- Tokens: Token 数量
- Model: 使用的模型（仅 assistant 消息）
- Timestamp: 时间戳

**角色类型**：
- `user`: 用户发送的消息
- `assistant`: AI 助手的回复
- `system`: 系统消息（如提示词）

**相关事件**：MessageSent, MessageReceived

---

### History (历史记录)
**定义**：一个对话的完整消息序列，用于上下文管理。

**用途**：
- 提供上下文给 LLM
- 用户查看对话记录
- 对话恢复和导出

**限制**：
- 最大长度受 Token 限制约束
- 可能需要截断或摘要

---

### Context Window (上下文窗口)
**定义**：发送给 LLM 的消息历史的 Token 数量限制。

**不同模型的限制**：
- GPT-4o: 128K tokens
- Claude 3.5 Sonnet: 200K tokens
- Gemini 1.5 Pro: 1M tokens

**管理策略**：
- 截断：保留最近 N 条消息
- 摘要：压缩旧消息
- 滑动窗口：保留首尾，摘要中间

---

### Streaming (流式传输)
**定义**：AI 生成内容时逐步返回结果，而不是等待完整响应。

**技术实现**：Server-Sent Events (SSE)

**优势**：
- 降低首字延迟
- 提升用户体验
- 节省等待时间

**相关接口**：/api/chat/stream

---

## 操作术语

### Send Message (发送消息)
**定义**：用户向 AI 发送一条消息并等待回复。

**前置条件**：
- 消息内容非空
- 消息长度不超过限制
- 用户未超过限流

**后置条件**：
- 消息已记录
- AI 已回复
- Token 使用已统计

---

### Create Conversation (创建对话)
**定义**：为用户创建一个新的空对话。

**触发时机**：
- 用户首次发送消息
- 用户主动创建新对话

**生成内容**：
- 唯一的 ConversationID
- 默认标题（可后续修改）

---

### Delete Conversation (删除对话)
**定义**：永久删除一个对话及其所有消息。

**权限检查**：
- 只能删除自己的对话
- 管理员可删除任意对话

**影响范围**：
- Conversation 记录
- 所有 Message 记录
- 相关统计数据

---

## 错误码术语

### MESSAGE_EMPTY
消息内容为空。

### MESSAGE_TOO_LONG
消息超过最大长度限制（10000 字符）。

### CONVERSATION_NOT_FOUND
对话不存在或已被删除。

### UNAUTHORIZED_ACCESS
无权访问该对话。

### RATE_LIMIT_EXCEEDED
请求频率过高，超过限流。

---

## 相关术语（其他领域）

### Model (模型)
属于 **LLM Domain**，Chat Domain 通过模型名称引用。

### Token
属于 **Monitoring Domain**，Chat Domain 记录使用量。

### User
属于 **User Domain**（未实现），Chat Domain 通过 UserID 引用。

---

## 度量术语

### Message Count (消息数量)
一个对话中的消息总数。

### Total Tokens (总 Token 数)
一个对话消耗的总 Token 数（输入 + 输出）。

### Average Latency (平均延迟)
从发送消息到收到回复的平均时间。

---

## 约定俗成

- 对话 ID 格式：`conv-{uuid}`
- 消息 ID 格式：`msg-{uuid}`
- 时间戳格式：ISO 8601（`2024-01-01T12:00:00Z`）
- 消息内容编码：UTF-8

