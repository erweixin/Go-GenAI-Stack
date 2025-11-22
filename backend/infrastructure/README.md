# Infrastructure Layer (基础设施层)

本目录包含所有基础设施相关的代码，包括数据库、缓存、队列、中间件、配置等。

## 📁 目录结构

```
infrastructure/
├── persistence/          # 持久化层
│   ├── postgres/        # PostgreSQL 连接和事务管理
│   └── redis/           # Redis 连接和缓存
├── queue/               # 异步任务队列 (Asynq)
│   └── tasks/           # 任务定义和处理器
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

### 2. Queue (异步任务队列)

使用 Asynq 实现分布式异步任务处理。

**使用示例**:
```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/queue"
    "github.com/erweixin/go-genai-stack/backend/infrastructure/queue/tasks"
)

// 创建队列
config := &queue.Config{
    RedisAddr:   "localhost:6379",
    Concurrency: 10,
    Queues:      queue.DefaultQueues(),
}
q, err := queue.NewAsynqClient(config)

// 注册任务处理器
registry := tasks.NewTaskRegistry()
tasks.RegisterDefaultTasks(registry)
registry.RegisterAll(q)

// 启动队列处理器
q.Start()

// 入队任务
payload, _ := json.Marshal(tasks.SendEmailPayload{
    To:      "user@example.com",
    Subject: "Welcome",
    Body:    "Hello!",
})
err = q.Enqueue(tasks.TaskTypeSendEmail, payload)
```

### 3. Middleware (HTTP 中间件)

#### Auth (认证)
- JWT Token 验证
- 用户上下文注入

#### RateLimit (限流)
- 基于 Redis 的分布式限流
- Token Bucket 算法
- 支持按用户、IP、组合等方式限流

#### Tracing (追踪)
- 自动生成 Request ID 和 Trace ID
- 记录请求耗时
- 预留 OpenTelemetry 集成

**使用示例**:
```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// 认证中间件
authMW := middleware.NewAuthMiddleware()
router.Use(authMW.Handle())

// 限流中间件
rateLimitMW := middleware.NewRateLimitMiddleware(
    redisClient,
    60,           // 每分钟 60 次
    time.Minute,
    middleware.UserBasedKeyFunc,
)
router.Use(rateLimitMW.Handle())

// 追踪中间件
tracingMW := middleware.NewTracingMiddleware()
router.Use(tracingMW.Handle())
```

### 4. Config (配置管理)

基于 Viper 的配置加载和验证。

**使用示例**:
```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/config"

// 从文件加载
cfg, err := config.LoadFromFile("config.yaml")

// 从环境变量加载
cfg, err := config.LoadFromEnv()

// 验证配置
err = config.ValidateConfig(cfg)
```

**环境变量命名规则**:
- 前缀：`APP_`
- 分隔符：`_`（替代 `.`）
- 示例：
  - `APP_SERVER_PORT` → `server.port`
  - `APP_DATABASE_HOST` → `database.host`

## 🔄 迁移指南

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
cfg, err := config.LoadFromEnv()
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

4. **异步任务**
   - 耗时操作放入队列异步执行
   - 合理设置任务优先级
   - 实现幂等性

5. **中间件**
   - 按顺序添加中间件（tracing → logging → auth → ratelimit）
   - 避免在中间件中执行耗时操作
   - 中间件异常应该有日志记录

## 🔗 相关文档

- [Vibe Coding Friendly DDD 架构](../../docs/vibe-coding-ddd-structure.md)
- [架构优化计划](../../docs/optimization-plan.md)
- [配置管理指南](../../docs/configuration.md)

