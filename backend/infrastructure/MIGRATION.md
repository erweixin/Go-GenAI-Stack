# 基础设施层迁移指南

## 📋 变更概览

### 目录重命名
- ✅ `backend/infra/` → `backend/infrastructure/`

### 新增组件
- ✅ `infrastructure/persistence/postgres/` - PostgreSQL 连接和事务管理
- ✅ `infrastructure/persistence/redis/` - Redis 连接和缓存
- ✅ `infrastructure/queue/` - 异步任务队列 (Asynq)
- ✅ `infrastructure/config/` - 配置管理 (Viper)
- ✅ `infrastructure/middleware/auth.go` - 认证中间件
- ✅ `infrastructure/middleware/ratelimit.go` - 限流中间件
- ✅ `infrastructure/middleware/tracing.go` - 追踪中间件

### 目录移动
- ✅ `shared/middleware/` → `infrastructure/middleware/`

## 🔄 需要更新的文件

### 1. Import 路径更新

需要批量更新以下 import:

```bash
# 查找需要更新的文件
grep -r "backend/infra/" backend/ --include="*.go"
grep -r "backend/shared/middleware" backend/ --include="*.go"
```

**需要更新的 import**:
```go
// 旧
import "github.com/erweixin/go-genai-stack/backend/infra/database"
import "github.com/erweixin/go-genai-stack/backend/shared/middleware"

// 新
import "github.com/erweixin/go-genai-stack/backend/infrastructure/database"
import "github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
```

### 2. 主要文件列表

以下文件可能需要更新 import 路径：

1. **`cmd/server/main.go`**
   - import database 路径
   - import middleware 路径

2. **领域仓储实现文件**
   - `domains/chat/repository/conversation_repo.go`
   - `domains/chat/repository/message_repo.go`

3. **HTTP 路由文件**
   - `domains/chat/http/router.go`
   - `domains/llm/http/router.go`

4. **应用服务文件**
   - `application/services/chat_orchestrator.go`

## 📝 迁移步骤

### 步骤 1: 更新 main.go

**文件**: `backend/cmd/server/main.go`

```go
import (
    // 更新这些 import
    "github.com/erweixin/go-genai-stack/backend/infrastructure/database"
    "github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
    "github.com/erweixin/go-genai-stack/backend/infrastructure/config"
)
```

### 步骤 2: 更新路由文件

**文件**: `backend/domains/chat/http/router.go`

```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

func RegisterRoutes(router *server.Hertz) {
    // 使用新的中间件
    authMW := middleware.NewAuthMiddleware()
    tracingMW := middleware.NewTracingMiddleware()
    
    chat := router.Group("/api/chat")
    chat.Use(tracingMW.Handle())
    chat.Use(authMW.Handle())
    
    // ... 其他路由
}
```

### 步骤 3: 更新仓储实现

**文件**: `backend/domains/chat/repository/conversation_repo.go`

如果使用了旧的 database 包，建议迁移到新的 persistence 包：

```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"
)

// 使用新的事务管理
func (r *ConversationRepository) CreateWithMessages(ctx context.Context, conv *model.Conversation) error {
    return postgres.WithTransaction(ctx, r.db, func(tx *sql.Tx) error {
        // 事务操作
        return nil
    })
}
```

### 步骤 4: 运行测试

```bash
cd backend

# 更新依赖
go mod tidy

# 运行测试
go test ./...

# 检查编译
go build ./...
```

## 🔍 验证清单

- [ ] 所有文件的 import 路径已更新
- [ ] `go mod tidy` 执行成功
- [ ] `go build ./...` 编译成功
- [ ] 单元测试通过
- [ ] 应用能正常启动
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] 中间件功能正常

## ⚠️ 注意事项

1. **兼容性保留**
   - 旧的 `infrastructure/database/database.go` 保留以兼容性
   - 新代码建议使用 `infrastructure/persistence/`

2. **配置迁移**
   - 考虑使用新的 `infrastructure/config/` 统一管理配置
   - 环境变量命名遵循新的规范 (`APP_` 前缀)

3. **中间件顺序**
   - 推荐顺序：tracing → logging → recovery → auth → ratelimit
   - 确保 tracing 在最外层

4. **事件总线**
   - 新增的 `domains/shared/events/` 可用于领域间通信
   - 考虑重构跨领域调用为事件驱动

## 🐛 常见问题

### Q1: 找不到 infrastructure 包
```
package github.com/erweixin/go-genai-stack/backend/infrastructure/xxx: cannot find package
```

**解决方案**:
```bash
cd backend
go mod tidy
go get github.com/erweixin/go-genai-stack/backend/infrastructure/...
```

### Q2: Import 路径冲突
```
imported and not used
```

**解决方案**:
- 删除未使用的 import
- 运行 `goimports -w .` 自动整理

### Q3: 中间件不生效

**检查清单**:
1. 是否正确注册中间件
2. 中间件顺序是否正确
3. 是否在路由之前注册

## 📞 需要帮助？

如果遇到问题，请查看：
- [Infrastructure README](./README.md)
- [优化计划文档](../../docs/optimization-plan.md)
- 或在团队群提问

---

**迁移完成后，请在这里打勾确认**: [ ]

