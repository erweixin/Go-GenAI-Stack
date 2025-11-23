# Infrastructure Layer (基础设施层)

本目录包含所有基础设施相关的代码，包括数据库、缓存、中间件、配置等。

## 📁 目录结构

```
infrastructure/
├── persistence/          # 持久化层
│   ├── postgres/        # PostgreSQL 连接和事务管理
│   └── redis/           # Redis 连接和缓存
├── middleware/          # HTTP 中间件
├── config/              # 配置管理
└── database/            # (兼容性保留，推荐使用 persistence/)
```

## 🔧 组件说明

### 1. Persistence (持久化层)

#### PostgreSQL
- **connection.go**: 数据库连接管理
  - 连接池配置
  - 健康检查
  - 自动重连

- **transaction.go**: 事务管理辅助
  - `WithTransaction()`: 自动提交/回滚
  - `WithTransactionIsolation()`: 指定隔离级别
  - `WithReadOnlyTransaction()`: 只读事务

**使用示例**:
```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"

// 创建连接
config := &postgres.Config{
    Host:            "localhost",
    Port:            5432,
    User:            "postgres",
    Password:        "password",
    Database:        "go_genai_stack",
    SSLMode:         "disable",
    MaxOpenConns:    25,
    MaxIdleConns:    25,
    ConnMaxLifetime: time.Hour,
}
conn, err := postgres.NewConnection(ctx, config)

// 使用事务
err = postgres.WithTransaction(ctx, conn.DB(), func(tx *sql.Tx) error {
    _, err := tx.ExecContext(ctx, "INSERT INTO ...")
    return err
})
```

#### Redis
- **connection.go**: Redis 连接管理
  - 支持单机和集群模式
  - 连接池配置
  - 健康检查

- **cache.go**: 缓存接口实现
  - 自动 JSON 序列化
  - TTL 管理
  - 分布式锁 (SetNX)

**使用示例**:
```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/redis"
)

// 创建连接
config := &redis.Config{
    Host:     "localhost",
    Port:     6379,
    PoolSize: 10,
}
conn, err := redis.NewConnection(ctx, config)

// 使用缓存
cache := redis.NewCache(conn.Client())
err = cache.Set(ctx, "user:123", user, 10*time.Minute)

var user User
err = cache.Get(ctx, "user:123", &user)
```

### 2. Middleware (HTTP 中间件)

提供生产级别的 HTTP 中间件，保护和增强 API 服务。

#### 📋 中间件清单

| 中间件 | 文件 | 作用 | 依赖 |
|--------|------|------|------|
| **Auth** | `auth.go` | JWT 认证、用户身份验证 | - |
| **RateLimit** | `ratelimit.go` | 分布式限流、防止 API 滥用 | Redis |
| **Tracing** | `tracing.go` | 请求追踪、生成 Request ID | - |
| **Logger** | `logger.go` | 请求日志、耗时统计 | - |
| **Recovery** | `recovery.go` | Panic 恢复、错误处理 | - |
| **CORS** | `cors.go` | 跨域请求处理 | - |
| **Errors** | `errors.go` | 统一错误响应格式 | - |

#### 🔐 Auth (认证中间件)

**功能**：
- Bearer Token 验证
- 用户身份注入到上下文
- 支持可选认证（OptionalAuth）

**Extension point**: 集成 JWT 验证（当前为简化实现）

**使用示例**:
```go
authMW := middleware.NewAuthMiddleware()

// 必须认证的路由
protectedRoutes := router.Group("/api/protected")
protectedRoutes.Use(authMW.Handle())

// 可选认证的路由（公开访问，但识别登录用户）
publicRoutes := router.Group("/api/public")
publicRoutes.Use(authMW.OptionalAuth())

// 在 handler 中获取用户ID
userID, exists := middleware.GetUserID(c)
```

**详细文档**: 查看 `auth.go` 的代码注释

#### 🚦 RateLimit (限流中间件)

**功能**：
- 基于 Redis 的分布式限流
- 滑动窗口计数算法
- 支持多种限流策略（用户、IP、组合）
- 标准的 `X-RateLimit-*` 响应头
- Redis 故障时不阻塞服务（容错设计）

**三种限流策略**：
```go
// 1. 基于用户ID（推荐，需要认证）
middleware.UserBasedKeyFunc

// 2. 基于IP地址（公开API）
middleware.IPBasedKeyFunc

// 3. 组合策略（优先用户，回退到IP）
middleware.CombinedKeyFunc
```

**使用示例**:
```go
// 全局限流：每分钟60次
rateLimitMW := middleware.NewRateLimitMiddleware(
    redisClient,
    60,                           // 每分钟限额
    time.Minute,                  // 时间窗口
    middleware.UserBasedKeyFunc,  // 限流策略
)
router.Use(rateLimitMW.Handle())

// 针对特定路由的限流（更严格）
sensitiveAPI := router.Group("/api/sensitive")
sensitiveAPI.Use(middleware.NewRateLimitMiddleware(
    redisClient,
    10,           // 更低的限额
    time.Minute,
    middleware.UserBasedKeyFunc,
).Handle())
```

**响应示例**:
```http
# 正常请求
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700000000

# 超过限额
HTTP/1.1 429 Too Many Requests
{
  "error": "rate limit exceeded",
  "message": "too many requests, please try again later",
  "retry_after": 60
}
```

**详细文档**: 查看 `ratelimit.go` 的完整注释（包含高级用法）

#### 🔍 Tracing (追踪中间件)

**功能**：
- 自动生成唯一的 Request ID 和 Trace ID
- 记录请求耗时（`X-Response-Time` 响应头）
- 支持跨服务追踪（通过 `X-Trace-ID` 传播）

**Extension point**: 集成 OpenTelemetry

**使用示例**:
```go
tracingMW := middleware.NewTracingMiddleware()
router.Use(tracingMW.Handle())

// 在 handler 中获取追踪信息
requestID := middleware.GetRequestID(c)
traceID := middleware.GetTraceID(c)
duration := middleware.GetDuration(c)
```

**详细文档**: 查看 `tracing.go` 的代码注释

#### 📝 其他中间件

- **Logger**: 记录每个请求的详细信息（方法、路径、状态码、耗时）
- **Recovery**: 捕获 panic 并返回友好的 500 错误，防止服务崩溃
- **CORS**: 配置跨域访问策略
- **Errors**: 统一错误响应格式

#### 🔄 中间件执行顺序

推荐的中间件顺序（从外到内）：
```go
router.Use(
    recoveryMW.Handle(),    // 1. 最外层：捕获所有 panic
    tracingMW.Handle(),     // 2. 生成 Request ID
    loggerMW.Handle(),      // 3. 记录请求日志
    corsMW.Handle(),        // 4. 处理跨域
    authMW.Handle(),        // 5. 认证（注入用户信息）
    rateLimitMW.Handle(),   // 6. 限流（依赖用户信息）
)
```

**原则**: 
- Recovery 在最外层（捕获所有错误）
- Tracing 在前面（确保有 Request ID）
- Auth 在 RateLimit 前（限流可能需要用户信息）

### 3. Config (配置管理)

**完全基于标准库的配置加载**，直接使用 `os.Getenv` 读取环境变量，零第三方依赖。

**设计理念**：
- ✅ **零依赖**：仅使用 Go 标准库（os, strconv, time）
- ✅ **完全透明**：每个环境变量的读取、类型转换、默认值逻辑都显式可见
- ✅ **AI 最友好**：无任何"魔法"行为，所有代码逻辑清晰明了
- ✅ **自动验证**：配置加载后自动执行业务规则验证
- ✅ **易于调试**：错误信息精确到具体的环境变量和原因

**使用示例**:
```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/config"

// 从环境变量加载配置
cfg, err := config.Load()
if err != nil {
    log.Fatal(err)
}

// 访问配置
fmt.Printf("Server running on %s:%d\n", cfg.Server.Host, cfg.Server.Port)
```

**环境变量命名规则**:
- 前缀：`APP_`
- 分隔符：`_`
- 格式：`APP_<SECTION>_<FIELD>`
- 示例：
  - `APP_SERVER_PORT=8080` → `Config.Server.Port`
  - `APP_DATABASE_HOST=localhost` → `Config.Database.Host`
  - `APP_REDIS_PASSWORD=secret` → `Config.Redis.Password`

**默认值**:
所有字段都有合理的默认值，定义在 `DefaultConfig()` 函数中：
```go
func DefaultConfig() *Config {
    return &Config{
        Server: ServerConfig{
            Host: "0.0.0.0",
            Port: 8080,
            ReadTimeout: 10 * time.Second,
        },
        // ...
    }
}
```

无需设置任何环境变量即可直接运行，生产环境只需覆盖需要的配置。

**类型支持**:
- ✅ 字符串（string）
- ✅ 整数（int, int64）
- ✅ 浮点数（float64）
- ✅ 布尔值（bool）- 支持 "true", "false", "1", "0"
- ✅ 时间间隔（time.Duration）- 如 "10s", "5m", "2h"

**错误处理**:
类型转换错误会返回清晰的错误信息：
```
invalid APP_SERVER_PORT: invalid integer value '9999999': strconv.Atoi: parsing "9999999": value out of range
```

## 🔄 迁移指南

### 从 Viper 迁移到原生 os.Getenv

项目已从 Viper 切换到原生 Go 标准库，**零第三方依赖**，配置更加透明。

**旧代码（Viper）**:
```go
loader := config.NewLoader()
cfg, err := loader.LoadFromEnv()
```

**新代码（原生标准库）**:
```go
cfg, err := config.Load()
```

**变更说明**：
- ✅ 环境变量命名规则不变（`APP_` 前缀）
- ✅ 配置结构体不变，无需修改使用配置的代码
- ✅ 默认值在 `DefaultConfig()` 中定义，清晰明了
- ✅ 自动验证已集成到 `Load()` 函数中
- ✅ **零依赖**：不再需要任何第三方配置管理库

### 从旧的 infra/database 迁移

**旧代码**:
```go
import "github.com/erweixin/go-genai-stack/backend/infra/database"

db, err := database.InitDB()
```

**新代码**:
```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"
    "github.com/erweixin/go-genai-stack/backend/infrastructure/config"
)

// 使用配置管理
cfg, err := config.Load()
if err != nil {
    log.Fatal(err)
}

// 创建数据库连接
conn, err := postgres.NewConnection(ctx, &postgres.Config{
    Host:            cfg.Database.Host,
    Port:            cfg.Database.Port,
    User:            cfg.Database.User,
    Password:        cfg.Database.Password,
    Database:        cfg.Database.Database,
    SSLMode:         cfg.Database.SSLMode,
    MaxOpenConns:    cfg.Database.MaxOpenConns,
    MaxIdleConns:    cfg.Database.MaxIdleConns,
    ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
})
```

## 📝 最佳实践

1. **配置管理**
   - 生产环境使用环境变量
   - 开发环境可以使用配置文件
   - 敏感信息（密码、密钥）永远不提交到代码库

2. **连接管理**
   - 使用连接池
   - 配置合理的超时时间
   - 实现健康检查

3. **事务处理**
   - 使用 `WithTransaction()` 自动管理事务
   - 避免长时间持有事务
   - 根据场景选择合适的隔离级别

4. **中间件**
   - 按顺序添加中间件（tracing → logging → auth → ratelimit）
   - 避免在中间件中执行耗时操作
   - 中间件异常应该有日志记录

## 🔗 相关文档

- [Vibe Coding Friendly DDD 架构](../../docs/vibe-coding-ddd-structure.md)
- [架构优化计划](../../docs/optimization-plan.md)
- [配置管理指南](../../docs/configuration.md)

