# Backend 项目创建完成 ✅

## 📦 项目概述

基于 **Hertz + Eino** 的 Go 后端项目，采用 **Vibe Coding Friendly DDD** 架构。

**特点**：
- ✅ Code-First（不使用 Hertz Generator）
- ✅ 领域驱动设计（DDD）
- ✅ AI 友好（usecases.yaml 驱动）
- ✅ 类型安全（DTO → tygo → TypeScript）

## 📁 已创建的文件

### 1. 项目配置

- `go.mod` - Go 模块定义
- `.gitignore` - Git 忽略规则
- `README.md` - 项目文档

### 2. 应用入口

- `cmd/server/main.go` - 服务器主程序

### 3. Chat Domain (聊天领域)

#### 显式知识文件（6 个必需文件）★

- `domains/chat/README.md` - 领域概述
- `domains/chat/glossary.md` - 术语表（详细）
- `domains/chat/rules.md` - 业务规则（16 条规则）
- `domains/chat/events.md` - 领域事件（11 个事件）
- `domains/chat/usecases.yaml` - 用例声明（6 个用例，AI 可读）
- `domains/chat/ai-metadata.json` - AI 元数据

#### 代码文件

- `domains/chat/model/conversation.go` - 对话聚合根
- `domains/chat/model/message.go` - 消息实体
- `domains/chat/http/dto/send_message.go` - 消息相关 DTO
- `domains/chat/http/dto/conversation.go` - 对话相关 DTO
- `domains/chat/http/router.go` - 路由注册
- `domains/chat/handlers/send_message.handler.go` - 发送消息 Handler
- `domains/chat/handlers/stream_message.handler.go` - 流式消息 Handler
- `domains/chat/handlers/conversation.handler.go` - 对话管理 Handlers

### 4. LLM Domain (LLM 领域)

- `domains/llm/README.md` - 领域概述
- `domains/llm/http/dto/generate.go` - LLM 相关 DTO
- `domains/llm/http/router.go` - 路由注册
- `domains/llm/handlers/generate.handler.go` - LLM Handlers

### 5. Shared (共享代码)

- `shared/errors/errors.go` - 统一错误处理
- `shared/middleware/cors.go` - CORS 中间件
- `shared/middleware/logger.go` - 日志中间件
- `shared/middleware/recovery.go` - Panic 恢复中间件

### 6. 脚本

- `scripts/dev.sh` - 开发环境启动脚本

## 🎯 Vibe Coding Friendly DDD 特点

### 6 个必需文件（每个领域）

1. **README.md** - 领域概述、边界、核心概念
2. **glossary.md** - 术语表（详细定义）
3. **rules.md** - 业务规则（16 条具体规则）
4. **events.md** - 领域事件（11 个事件定义）
5. **usecases.yaml** - 用例声明（AI 可读，声明式）★★★
6. **ai-metadata.json** - AI 元数据（ingestion 优先级等）

### usecases.yaml 驱动开发

AI 可以读取 `usecases.yaml` 并：
- 理解业务流程
- 生成 Handler 骨架
- 生成测试用例
- 理解错误处理

示例：

```yaml
SendMessage:
  description: "发送消息到 AI"
  steps:
    - name: ValidateInput
      on_fail: abort
    - name: CheckRateLimit
      on_fail: abort
      error: RATE_LIMIT_EXCEEDED
    - name: CallLLM
      type: external
      adapter: llmService.Generate
      timeout: 30s
      on_fail: retry
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
go mod download
```

### 2. 运行服务器

```bash
# 方式 1：直接运行
go run cmd/server/main.go

# 方式 2：使用脚本
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### 3. 测试 API

```bash
# 健康检查
curl http://localhost:8080/health

# 发送消息
curl -X POST http://localhost:8080/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "message": "Hello, AI!"
  }'

# 列出模型
curl http://localhost:8080/api/llm/models
```

## 📊 API 端点

### Chat Domain

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/chat/send` | 发送消息 |
| POST | `/api/chat/stream` | 流式消息 |
| GET | `/api/chat/conversations/:id/history` | 获取历史 |
| POST | `/api/chat/conversations` | 创建对话 |
| GET | `/api/chat/conversations` | 列出对话 |
| DELETE | `/api/chat/conversations/:id` | 删除对话 |

### LLM Domain

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/llm/models` | 列出模型 |
| POST | `/api/llm/generate` | 生成文本 |
| POST | `/api/llm/structured` | 结构化输出 |
| POST | `/api/llm/select-model` | 选择模型 |

## 🔄 前后端类型同步

后端 DTO 会自动生成前端 TypeScript 类型：

```bash
# 从项目根目录运行
./scripts/sync_types.sh
```

生成流程：

```
backend/domains/chat/http/dto/send_message.go
    ↓ [tygo]
frontend/shared/types/domains/chat.ts
    ↓ [pnpm workspace]
frontend/web/ + frontend/mobile/
```

## 📝 目前状态

### ✅ 已完成

- [x] 项目结构搭建
- [x] Chat Domain 完整的显式知识文件
- [x] Chat Domain 基础 Handler（发送消息、流式、对话管理）
- [x] LLM Domain 基础结构
- [x] 共享中间件（CORS, Logger, Recovery）
- [x] 统一错误处理
- [x] 路由注册
- [x] Code-First 设计（不使用 hz generator）

### 🚧 待实现（TODO）

- [ ] 集成 Eino LLM 框架
- [ ] 实现数据库持久化（PostgreSQL）
- [ ] 实现 Redis 缓存和限流
- [ ] 实现事件总线（Kafka）
- [ ] 实现 Structured Output
- [ ] 实现多模型路由
- [ ] 添加单元测试和集成测试
- [ ] 添加认证和授权
- [ ] 添加监控和可观测性（Metrics, Tracing）
- [ ] 补充 LLM Domain 的显式知识文件

## 💡 开发建议

### 添加新用例

1. 在 `domains/{domain}/usecases.yaml` 中定义用例
2. 在 `domains/{domain}/http/dto/` 中定义 DTO
3. 在 `domains/{domain}/handlers/` 中实现 Handler
4. 在 `domains/{domain}/tests/` 中编写测试
5. 在 `domains/{domain}/http/router.go` 中注册路由

### 与 Cursor AI 协作

Cursor AI 可以：
- 读取 `usecases.yaml` 理解业务流程
- 读取 `rules.md` 理解业务规则
- 读取 `glossary.md` 理解术语
- 根据以上信息生成 Handler 代码和测试

示例 Prompt：

```
根据 domains/chat/usecases.yaml 中的 SendMessage 用例，
生成完整的 Handler 实现，包括：
1. 参数验证
2. 限流检查
3. LLM 调用
4. 错误处理
5. 事件发布
```

## 🔗 相关文档

- [项目主 README](../README.md)
- [Vibe Coding DDD 架构](../docs/vibe-coding-ddd-structure.md)
- [为什么不用 Hertz Generator](../docs/why-code-first.md)
- [类型同步指南](../docs/type-sync.md)
- [AI 协作工作流](../docs/ai_workflow.md)

## 🎉 总结

后端项目已按照 **Vibe Coding Friendly DDD** 架构搭建完成，包含：

- ✅ 完整的 Chat Domain（6 个显式知识文件 + 代码实现）
- ✅ 基础的 LLM Domain
- ✅ Code-First 设计（无 IDL）
- ✅ 统一的错误处理和中间件
- ✅ AI 友好的目录结构和文档

可以开始使用 Cursor AI 进行 Vibe Coding 开发了！🚀

