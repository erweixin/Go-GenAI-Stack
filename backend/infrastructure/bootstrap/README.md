# Bootstrap 包

## 📋 概述

`bootstrap` 包负责应用的**启动时初始化**和**依赖注入组装**。它是基础设施层的一部分，但职责是编排和组装，而不是实现具体的技术细节。

## 🎯 设计理念

### 关注点分离

```
┌─────────────────────────────────────────┐
│  cmd/server/main.go                     │  应用入口
│  - 加载配置                              │  职责：编排
│  - 调用 bootstrap 函数                   │
│  - 启动服务器                            │
│  - 处理信号                              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  infrastructure/bootstrap/               │  启动引导
│  - InitDatabase()                        │  职责：组装
│  - InitRedis()                           │
│  - InitDependencies()                    │
│  - CreateServer()                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  infrastructure/persistence/            │  具体实现
│  - postgres.NewConnection()             │  职责：实现
│  - redis.NewConnection()                │
└─────────────────────────────────────────┘
```

## 📁 文件组织

```
bootstrap/
├── README.md           # 本文件
├── database.go         # 数据库初始化
├── redis.go            # Redis 初始化
├── dependencies.go     # 依赖注入容器
├── server.go           # 服务器创建和中间件注册
└── routes.go           # 路由注册
```

### 各文件职责

#### `database.go`
- 将 `config.Config` 转换为 `postgres.Config`
- 调用 `postgres.NewConnection()` 创建连接

#### `redis.go`
- 将 `config.Config` 转换为 `redis.Config`
- 调用 `redis.NewConnection()` 创建连接

#### `dependencies.go`（核心）
- 定义 `AppContainer` 结构体（依赖注入容器）
- 实现 `InitDependencies()` 函数（组装所有依赖）
- 遵循依赖注入原则：外层向内层注入

#### `server.go`
- 创建 Hertz 服务器实例
- 注册全局中间件

#### `routes.go`
- 注册所有领域的路由

## 🏗️ 依赖注入流程

### 层次结构

```
数据库连接 (postgres.Connection)
    ↓
Repository 层 (messageRepo, conversationRepo)
    ↓
Handler Service 层 (ChatHandlerService)
    ↓
容器 (AppContainer)
    ↓
路由注册 (HTTP 层)
```

### 代码示例

```go
// 1. 初始化数据库
dbConn, err := bootstrap.InitDatabase(ctx, cfg)

// 2. 初始化依赖容器
container := bootstrap.InitDependencies(dbConn, redisConn)

// 3. 注册路由
bootstrap.RegisterRoutes(h, container)
```

## 🎨 AppContainer 设计

### 什么是 AppContainer？

`AppContainer` 是一个**依赖注入容器**，包含所有领域服务的实例。

```go
type AppContainer struct {
    // Chat 领域
    ChatHandlerService *chathandlers.HandlerService

    // 未来扩展
    // LLMHandlerService *llmhandlers.HandlerService
    // MonitoringService *monitoring.Service
}
```

### 为什么使用容器模式？

✅ **优点：**
- **单一真相源**：所有依赖在一个地方
- **易于扩展**：添加新领域只需扩展容器
- **测试友好**：可以轻松创建测试容器
- **类型安全**：编译时检查依赖关系

## 🧪 在测试中使用

### 示例：集成测试

```go
func TestChatAPI(t *testing.T) {
    // 1. 创建测试数据库
    db, _ := sql.Open("postgres", testDSN)
    defer db.Close()

    // 2. 初始化依赖（跳过 Redis）
    container := bootstrap.InitDependenciesFromDB(db, nil)

    // 3. 创建测试服务器
    cfg := config.DefaultConfig()
    h := bootstrap.CreateServer(cfg)
    bootstrap.RegisterRoutes(h, container)

    // 4. 发送测试请求
    req := httptest.NewRequest("POST", "/api/chat/send", body)
    resp := httptest.NewRecorder()
    h.ServeHTTP(resp, req)

    // 5. 验证响应
    assert.Equal(t, 200, resp.Code)
}
```

## 📚 扩展指南

### 添加新领域

假设要添加 `llm` 领域：

**1. 在 `dependencies.go` 中添加到容器：**

```go
type AppContainer struct {
    ChatHandlerService *chathandlers.HandlerService
    LLMHandlerService  *llmhandlers.HandlerService  // 新增
}

func InitDependencies(...) *AppContainer {
    // ... Chat 领域初始化 ...

    // LLM 领域初始化
    llmRepo := llmrepo.NewModelRepository(db)
    llmHandlerService := llmhandlers.NewHandlerService(llmRepo)

    return &AppContainer{
        ChatHandlerService: chatHandlerService,
        LLMHandlerService:  llmHandlerService,  // 新增
    }
}
```

**2. 在 `routes.go` 中注册路由：**

```go
func RegisterRoutes(h *server.Hertz, container *AppContainer) {
    api := h.Group("/api")
    {
        chathttp.RegisterRoutes(api, container.ChatHandlerService)
        llmhttp.RegisterRoutes(api, container.LLMHandlerService)  // 新增
    }
}
```

**3. 完成！** `main.go` 无需修改。

### 添加新的基础设施

假设要添加 Elasticsearch：

**1. 创建 `elasticsearch.go`：**

```go
func InitElasticsearch(ctx context.Context, cfg *config.Config) (*es.Client, error) {
    esConfig := es.Config{
        Addresses: []string{cfg.Elasticsearch.URL},
        Username:  cfg.Elasticsearch.Username,
        Password:  cfg.Elasticsearch.Password,
    }
    return es.NewClient(esConfig)
}
```

**2. 在 `InitDependencies()` 中使用：**

```go
func InitDependencies(
    dbConn *postgres.Connection,
    redisConn *redis.Connection,
    esClient *es.Client,  // 新增参数
) *AppContainer {
    // 使用 esClient 初始化需要它的 repository
}
```

**3. 在 `main.go` 中调用：**

```go
esClient, err := bootstrap.InitElasticsearch(ctx, cfg)
container := bootstrap.InitDependencies(dbConn, redisConn, esClient)
```

## 🎯 设计原则

### 1. 单一职责原则 (SRP)

每个文件只负责一个方面的初始化：
- `database.go` - 数据库
- `redis.go` - Redis
- `dependencies.go` - 依赖注入
- `server.go` - 服务器配置
- `routes.go` - 路由注册

### 2. 依赖倒置原则 (DIP)

```
高层 (main.go) 依赖 → 抽象 (bootstrap) ← 低层实现 (persistence)
```

- `main.go` 不直接依赖 `postgres` 或 `redis` 包
- 通过 `bootstrap` 包作为中介

### 3. 开闭原则 (OCP)

- 对扩展开放：添加新领域无需修改现有代码
- 对修改封闭：核心初始化流程稳定

### 4. 接口隔离原则 (ISP)

- `InitDependenciesFromDB()` - 测试专用，不需要 `Connection`
- 各个 `Init*()` 函数独立，可按需调用

## 🔍 对比：重构前 vs 重构后

### 重构前

```go
// main.go (251 行)
func main() {
    // ... 配置加载 ...
    
    // 数据库初始化（20 行）
    pgConfig := &postgres.Config{...}
    dbConn, _ := postgres.NewConnection(ctx, pgConfig)
    
    // Redis 初始化（15 行）
    redisConfig := &redis.Config{...}
    redisConn, _ := redis.NewConnection(ctx, redisConfig)
    
    // 依赖注入（30 行）
    messageRepo := chatrepo.NewMessageRepository(db)
    conversationRepo := chatrepo.NewConversationRepository(db)
    chatHandlerService := chathandlers.NewHandlerService(...)
    
    // 服务器创建（10 行）
    h := server.Default(...)
    
    // 中间件注册（5 行）
    h.Use(middleware.CORS())
    // ...
    
    // 路由注册（10 行）
    api := h.Group("/api")
    chathttp.RegisterRoutes(api, chatHandlerService)
    
    // ... 启动逻辑 ...
}
```

### 重构后

```go
// main.go (145 行，减少 42%)
func main() {
    // ... 配置加载 ...
    
    dbConn, _ := bootstrap.InitDatabase(ctx, cfg)
    redisConn, _ := bootstrap.InitRedis(ctx, cfg)
    container := bootstrap.InitDependencies(dbConn, redisConn)
    
    h := bootstrap.CreateServer(cfg)
    bootstrap.RegisterMiddleware(h)
    bootstrap.RegisterRoutes(h, container)
    
    // ... 启动逻辑 ...
}
```

✅ **改进：**
- 代码量减少 42%
- 职责更清晰
- 可测试性提升
- 可复用性提升

## 🚀 最佳实践

### DO ✅

1. **按功能分文件**：不要把所有初始化都放在一个文件
2. **使用容器模式**：通过 `AppContainer` 传递依赖
3. **参数化配置**：所有 `Init*()` 函数接受 `config.Config`
4. **返回错误**：让调用者决定如何处理错误
5. **提供测试变体**：如 `InitDependenciesFromDB()`

### DON'T ❌

1. **不要在 bootstrap 中实现业务逻辑**
2. **不要使用全局变量**
3. **不要在 bootstrap 中处理 HTTP 请求**
4. **不要硬编码配置值**
5. **不要循环依赖**

## 📖 相关文档

- [Vibe-Coding DDD 架构](../../../docs/vibe-coding-ddd-structure.md)
- [依赖注入指南](../../../docs/dependency-injection.md)
- [测试策略](../../../docs/testing-strategy.md)

---

**设计时间**：2025-11-22  
**设计人员**：AI Assistant  
**架构原则**：Vibe-Coding Friendly DDD

