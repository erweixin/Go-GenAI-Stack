# Node.js 后端迁移状态对比

## 📊 迁移进度总览

| 类别         | Go 后端 | Node.js 后端 | 状态    |
| ------------ | ------- | ------------ | ------- |
| **领域**     | 3 个    | 3 个         | ✅ 100% |
| **基础设施** | 完整    | 部分         | ⚠️ 60%  |
| **测试**     | 有      | 无           | ❌ 0%   |
| **共享代码** | 有      | 无           | ❌ 0%   |

---

## ✅ 已迁移的领域（100%）

### 1. Task 领域 ✅

- ✅ Model 层（Task 聚合根）
- ✅ Repository 层（Kysely 实现）
- ✅ Service 层（6 个用例）
- ✅ Handlers（6 个 HTTP Handler）
- ✅ DTO 和路由
- ✅ 错误处理
- ✅ 显式知识文件（README, glossary, rules, events, usecases.yaml, ai-metadata.json）

### 2. User 领域 ✅

- ✅ Model 层（User 聚合根，密码哈希）
- ✅ Repository 层（Kysely 实现）
- ✅ Service 层（3 个用例）
- ✅ Handlers（3 个 HTTP Handler）
- ✅ DTO 和路由
- ✅ 错误处理
- ✅ 显式知识文件

### 3. Auth 领域 ✅

- ✅ JWTService（Token 生成/验证）
- ✅ AuthService（3 个用例）
- ✅ Handlers（3 个 HTTP Handler）
- ✅ DTO 和路由
- ✅ 错误处理
- ✅ 显式知识文件
- ✅ JWT 认证中间件

---

## ❌ 未迁移的内容

### 1. 共享领域（domains/shared）❌

#### 1.1 事件总线（events/bus.go）

**功能**：

- `InMemoryEventBus` - 内存事件总线
- 事件发布/订阅机制
- 支持领域事件

**用途**：

- Task 领域发布 `TaskCreated`、`TaskUpdated` 等事件
- User 领域发布 `UserCreated`、`PasswordChanged` 等事件
- Auth 领域发布 `UserRegistered`、`LoginSucceeded` 等事件

**迁移优先级**：🟡 中（当前代码中已有扩展点注释，但未实现）

**Node.js 实现建议**：

```typescript
// domains/shared/events/bus.ts
export interface Event {
  type: string;
  payload: unknown;
  timestamp: Date;
  source: string;
  id: string;
}

export interface EventBus {
  publish(ctx: unknown, event: Event): Promise<void>;
  subscribe(eventType: string, handler: (event: Event) => Promise<void>): void;
}
```

---

#### 1.2 共享类型（types/common.go）

**功能**：

- `Pagination` - 分页参数
- `PaginatedResponse` - 分页响应
- `UserContext` - 用户上下文
- `TimeRange` - 时间范围
- `RequestMetadata` - 请求元数据
- `ErrorResponse` / `SuccessResponse` - 统一响应格式

**迁移优先级**：🟢 低（当前实现已满足需求，但可以统一）

**Node.js 实现建议**：

```typescript
// domains/shared/types/common.ts
export interface Pagination {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
```

---

### 2. 基础设施中间件（infrastructure/middleware）⚠️

#### 2.1 请求日志中间件（logger.go）❌

**功能**：

- 记录 HTTP 请求日志（方法、路径、状态码、延迟）
- 结构化日志（zap）
- 集成 Metrics
- TraceID 和 RequestID

**迁移优先级**：🟡 中（Fastify 已有内置日志，但可以增强）

**Node.js 实现建议**：

- Fastify 已内置 `pino` 日志
- 可以添加请求日志中间件增强功能

---

#### 2.2 Panic 恢复中间件（recovery.go）❌

**功能**：

- 捕获 panic 并返回 500 错误
- 防止服务崩溃

**迁移优先级**：🟢 低（Node.js 的 try-catch 已足够，但可以添加全局错误处理）

**Node.js 实现建议**：

- Fastify 已有 `setErrorHandler`
- 可以添加全局错误处理增强

---

#### 2.3 统一错误处理中间件（error_handler.go）❌

**功能**：

- 统一错误响应格式
- 错误码到 HTTP 状态码映射
- `handleDomainError` 辅助函数

**迁移优先级**：🟡 中（当前每个 Handler 都有错误处理，可以统一）

**Node.js 实现建议**：

- 创建统一的错误处理中间件
- 统一错误响应格式

---

#### 2.4 限流中间件（ratelimit.go）❌

**功能**：

- 基于 Redis 的限流
- 支持 IP 和用户 ID 限流
- 可配置限流策略

**迁移优先级**：🟡 中（生产环境需要）

**Node.js 实现建议**：

- 使用 `@fastify/rate-limit` 或自定义实现
- 集成 Redis

---

#### 2.5 追踪中间件（tracing.go）❌

**功能**：

- TraceID 生成和传播
- RequestID 生成
- 分布式追踪支持

**迁移优先级**：🟡 中（生产环境需要）

**Node.js 实现建议**：

- 使用 OpenTelemetry
- 或自定义 TraceID/RequestID 中间件

---

#### 2.6 CORS 中间件（cors.go）⚠️

**状态**：✅ 已实现（使用 `@fastify/cors`）

---

### 3. 监控基础设施（infrastructure/monitoring）⚠️

#### 3.1 结构化日志（logger/logger.go）❌

**功能**：

- 基于 zap 的结构化日志
- 支持 JSON 和 Console 格式
- 日志轮转（Lumberjack）
- 日志级别控制

**迁移优先级**：🟡 中（Fastify 的 pino 已足够，但可以增强）

**Node.js 实现建议**：

- Fastify 已内置 `pino`（结构化日志）
- 可以配置日志轮转和级别

---

#### 3.2 Metrics 指标（metrics/metrics.go）❌

**功能**：

- Prometheus 指标收集
- HTTP 请求指标（QPS、延迟、错误率）
- 系统指标（Goroutine、内存、CPU）
- `/metrics` 端点

**迁移优先级**：🟡 中（生产环境需要）

**Node.js 实现建议**：

- 使用 `prom-client` 库
- 实现 Prometheus 指标收集
- 添加 `/metrics` 端点

---

#### 3.3 分布式追踪（tracing/tracing.go）❌

**功能**：

- OpenTelemetry 集成
- 分布式追踪支持

**迁移优先级**：🟢 低（高级功能）

**Node.js 实现建议**：

- 使用 `@opentelemetry/api`

---

#### 3.4 健康检查（health/health.ts）✅

**状态**：✅ 已实现

---

### 4. Handler 辅助函数（infrastructure/handler_utils）❌

#### 4.1 helpers.go

**功能**：

- `handleDomainError` - 统一错误处理
- 错误码提取和映射
- HTTP 状态码映射

**迁移优先级**：🟡 中（当前每个领域都有类似实现，可以统一）

**Node.js 实现建议**：

- 创建共享的错误处理工具
- 统一错误响应格式

---

### 5. 测试文件 ❌

#### 5.1 单元测试

**Go 后端测试**：

- `task/model/task_test.go` - Task 模型测试
- `task/repository/task_repo_test.go` - Repository 测试
- `task/handlers/converters_test.go` - 转换器测试
- `task/tests/*_test.go` - Handler 集成测试
- `user/repository/user_repo_test.go` - User Repository 测试

**Node.js 后端**：

- ❌ 无测试文件

**迁移优先级**：🔴 高（测试是代码质量保障）

**Node.js 实现建议**：

- 使用 `vitest` 或 `jest`
- 使用 `supertest` 进行 HTTP 测试
- 参考 Go 后端的测试用例

---

### 6. 领域事件实现 ❌

**当前状态**：

- ✅ 所有领域都有 `events.md` 文档
- ❌ 代码中只有扩展点注释，未实际实现事件发布

**需要实现**：

- 事件总线（InMemoryEventBus）
- 事件发布（在 Service 层）
- 事件订阅（可选）

**迁移优先级**：🟡 中（当前功能正常，但缺少事件驱动能力）

---

### 7. 其他功能差异

#### 7.1 数据库事务管理

**Go 后端**：

- `postgres/transaction.go` - 事务管理工具

**Node.js 后端**：

- ⚠️ 当前使用 Kysely，支持事务，但可能需要封装工具函数

**迁移优先级**：🟢 低（Kysely 已支持）

---

#### 7.2 配置验证

**Go 后端**：

- `config/validator.go` - 配置验证

**Node.js 后端**：

- ⚠️ 当前只有基本配置加载，缺少验证

**迁移优先级**：🟡 中（可以使用 `zod` 进行验证）

---

## 📋 迁移优先级建议

### 🔴 高优先级（核心功能）

1. **测试文件** - 代码质量保障
   - 单元测试（Model, Repository, Service）
   - 集成测试（Handlers）
   - E2E 测试（可选）

### 🟡 中优先级（增强功能）

2. **事件总线** - 领域事件支持
   - 实现 `InMemoryEventBus`
   - 在 Service 层发布事件

3. **统一错误处理** - 代码质量
   - 创建共享的错误处理工具
   - 统一错误响应格式

4. **Metrics 指标** - 生产环境监控
   - Prometheus 指标收集
   - `/metrics` 端点

5. **请求日志中间件** - 可观测性
   - 增强 Fastify 日志
   - 添加 TraceID/RequestID

### 🟢 低优先级（可选功能）

6. **限流中间件** - 生产环境需要时添加
7. **分布式追踪** - 高级功能
8. **共享类型** - 代码统一性
9. **配置验证** - 使用 `zod` 增强

---

## 📊 完成度统计

### 领域层

- ✅ Task: 100%
- ✅ User: 100%
- ✅ Auth: 100%
- ❌ Shared: 0%

### 基础设施层

- ✅ Config: 100%
- ✅ Database: 100%
- ✅ Redis: 100%
- ✅ Health: 100%
- ✅ Auth Middleware: 100%
- ⚠️ Logger: 50% (Fastify 内置，可增强)
- ❌ Metrics: 0%
- ❌ Tracing: 0%
- ❌ Error Handler: 0%
- ❌ Rate Limit: 0%
- ❌ Recovery: 0%

### 测试

- ❌ 单元测试: 0%
- ❌ 集成测试: 0%
- ❌ E2E 测试: 0%

### 总体完成度

- **核心功能**: 85% ✅
- **基础设施**: 60% ⚠️
- **测试**: 0% ❌
- **总体**: ~70%

---

## 🎯 下一步建议

### 立即开始（高优先级）

1. **添加测试文件** - 确保代码质量
   - 从 Task 领域开始
   - 使用 vitest + supertest

### 后续完善（中优先级）

2. **实现事件总线** - 支持领域事件
3. **统一错误处理** - 代码质量提升
4. **Metrics 指标** - 生产环境准备

### 按需添加（低优先级）

5. 其他中间件和工具

---

**最后更新**: 2025-01-XX
