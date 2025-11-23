# 数据库提供者（Database Providers）

> 🔌 灵活的数据库依赖注入系统，轻松切换 PostgreSQL、MySQL、SQLite 等数据库

**最后更新**：2025-11-23

---

## 📖 概述

Go-GenAI-Stack 采用 **Database Provider 模式**，通过依赖注入实现数据库的灵活切换。用户只需修改配置文件，无需修改代码即可切换数据库。

### 核心优势

- ✅ **统一接口**：所有数据库实现相同的 `DatabaseProvider` 接口
- ✅ **零侵入**：Repository 层仍使用标准 `*sql.DB`，无需修改
- ✅ **插件化**：轻松添加自定义数据库支持
- ✅ **自动注册**：数据库提供者通过 `init()` 自动注册
- ✅ **配置驱动**：通过配置文件切换数据库，无需编译

---

## 🚀 快速开始

### 使用 PostgreSQL（默认）

```bash
# docker/env.example
APP_DATABASE_TYPE=postgres
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=5432
APP_DATABASE_USER=genai
APP_DATABASE_PASSWORD=genai_password
APP_DATABASE_DATABASE=go_genai_stack
APP_DATABASE_SSL_MODE=disable
```

### 切换到 MySQL

```bash
# 1. 修改配置
APP_DATABASE_TYPE=mysql
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=3306
APP_DATABASE_USER=genai
APP_DATABASE_PASSWORD=genai_password
APP_DATABASE_DATABASE=go_genai_stack

# 2. 重启应用（无需修改代码！）
cd backend && go run cmd/server/main.go
```

---

## 🎯 支持的数据库

### 内置支持

| 数据库 | Type 值 | 驱动 | 状态 |
|--------|---------|------|------|
| **PostgreSQL** | `postgres` | `github.com/lib/pq` | ✅ 已实现 |
| **MySQL** | `mysql` | `github.com/go-sql-driver/mysql` | ✅ 已实现 |
| **SQLite** | `sqlite` | `github.com/mattn/go-sqlite3` | 🔄 待实现 |

### 添加自定义数据库

参见 [扩展自定义数据库](#扩展自定义数据库) 章节。

---

## 📝 配置详解

### 环境变量配置

```bash
# ==================== 基础配置 ====================
APP_DATABASE_TYPE=postgres           # 数据库类型（必需）
APP_DATABASE_HOST=localhost          # 主机地址
APP_DATABASE_PORT=5432              # 端口号
APP_DATABASE_USER=genai             # 用户名
APP_DATABASE_PASSWORD=genai_password # 密码
APP_DATABASE_DATABASE=go_genai_stack # 数据库名

# ==================== 连接池配置 ====================
APP_DATABASE_MAX_OPEN_CONNS=25      # 最大打开连接数
APP_DATABASE_MAX_IDLE_CONNS=5       # 最大空闲连接数
APP_DATABASE_CONN_MAX_LIFETIME=1h   # 连接最大生命周期
APP_DATABASE_CONN_MAX_IDLE_TIME=10m # 连接最大空闲时间

# ==================== PostgreSQL 特定配置 ====================
APP_DATABASE_SSL_MODE=disable        # SSL 模式：disable, require, verify-ca, verify-full

# ==================== MySQL 特定配置 ====================
# 使用 APP_DATABASE_OPTIONS_* 前缀
# APP_DATABASE_OPTIONS_CHARSET=utf8mb4
# APP_DATABASE_OPTIONS_PARSETIME=True
# APP_DATABASE_OPTIONS_LOC=Local
```

### Go 代码配置

```go
// backend/infrastructure/config/config.go
type DatabaseConfig struct {
    Type            string            `mapstructure:"type"`
    Host            string            `mapstructure:"host"`
    Port            int               `mapstructure:"port"`
    User            string            `mapstructure:"user"`
    Password        string            `mapstructure:"password"`
    Database        string            `mapstructure:"database"`
    MaxOpenConns    int               `mapstructure:"max_open_conns"`
    MaxIdleConns    int               `mapstructure:"max_idle_conns"`
    ConnMaxLifetime time.Duration     `mapstructure:"conn_max_lifetime"`
    ConnMaxIdleTime time.Duration     `mapstructure:"conn_max_idle_time"`
    Options         map[string]string `mapstructure:"options"`
}
```

---

## 🏗️ 架构设计

### 核心接口

```go
// backend/infrastructure/persistence/provider.go
type DatabaseProvider interface {
    // Connect 连接数据库
    Connect(ctx context.Context) error
    
    // DB 获取底层的 *sql.DB 实例
    DB() *sql.DB
    
    // Close 关闭数据库连接
    Close() error
    
    // HealthCheck 健康检查
    HealthCheck(ctx context.Context) error
    
    // Stats 获取连接池统计信息
    Stats() sql.DBStats
    
    // Type 返回数据库类型
    Type() string
    
    // Dialect 返回 SQL 方言
    Dialect() SQLDialect
}
```

### SQL 方言接口

```go
type SQLDialect interface {
    // Placeholder 返回占位符（PostgreSQL: $1, MySQL: ?）
    Placeholder(n int) string
    
    // QuoteIdentifier 引用标识符
    QuoteIdentifier(name string) string
    
    // CurrentTimestamp 返回当前时间戳函数
    CurrentTimestamp() string
    
    // AutoIncrement 返回自增语法
    AutoIncrement() string
    
    // JSONType 返回 JSON 列类型
    JSONType() string
}
```

### 依赖注入流程

```
Config (用户配置)
    ↓
ProviderFactory.Create()
    ↓
DatabaseProvider (postgres/mysql/...)
    ↓
provider.Connect()
    ↓
provider.DB() → *sql.DB
    ↓
Repository(db *sql.DB)
    ↓
Handler Service
```

---

## 🔧 实现示例

### PostgreSQL 提供者

```go
// backend/infrastructure/persistence/postgres/provider.go
package postgres

import (
    "github.com/erweixin/go-genai-stack/infrastructure/persistence"
    _ "github.com/lib/pq"
)

type Provider struct {
    db     *sql.DB
    config *persistence.Config
}

func NewProvider(config *persistence.Config) (persistence.DatabaseProvider, error) {
    return &Provider{config: config}, nil
}

func (p *Provider) Connect(ctx context.Context) error {
    dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        p.config.Host, p.config.Port, p.config.User, 
        p.config.Password, p.config.Database,
        p.config.Options["sslmode"])
    
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return err
    }
    
    // 配置连接池
    db.SetMaxOpenConns(p.config.MaxOpenConns)
    db.SetMaxIdleConns(p.config.MaxIdleConns)
    
    p.db = db
    return db.PingContext(ctx)
}

// 自动注册
func init() {
    persistence.DefaultFactory.Register("postgres", NewProvider)
}
```

### MySQL 提供者

```go
// backend/infrastructure/persistence/mysql/provider.go
package mysql

import (
    "github.com/erweixin/go-genai-stack/infrastructure/persistence"
    _ "github.com/go-sql-driver/mysql"
)

type Provider struct {
    db     *sql.DB
    config *persistence.Config
}

func NewProvider(config *persistence.Config) (persistence.DatabaseProvider, error) {
    return &Provider{config: config}, nil
}

func (p *Provider) Connect(ctx context.Context) error {
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True",
        p.config.User, p.config.Password,
        p.config.Host, p.config.Port, p.config.Database)
    
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return err
    }
    
    p.db = db
    return db.PingContext(ctx)
}

// 自动注册
func init() {
    persistence.DefaultFactory.Register("mysql", NewProvider)
}
```

---

## 🎨 扩展自定义数据库

### 步骤 1：实现 DatabaseProvider 接口

```go
// backend/infrastructure/persistence/custom/provider.go
package custom

import (
    "context"
    "database/sql"
    "github.com/erweixin/go-genai-stack/infrastructure/persistence"
    _ "your-custom-driver"
)

type CustomProvider struct {
    db     *sql.DB
    config *persistence.Config
}

func NewProvider(config *persistence.Config) (persistence.DatabaseProvider, error) {
    return &CustomProvider{config: config}, nil
}

func (p *CustomProvider) Connect(ctx context.Context) error {
    // 实现连接逻辑
    dsn := buildCustomDSN(p.config)
    db, err := sql.Open("custom-driver", dsn)
    if err != nil {
        return err
    }
    
    p.db = db
    return db.PingContext(ctx)
}

func (p *CustomProvider) DB() *sql.DB {
    return p.db
}

func (p *CustomProvider) Close() error {
    if p.db != nil {
        return p.db.Close()
    }
    return nil
}

func (p *CustomProvider) HealthCheck(ctx context.Context) error {
    return p.db.PingContext(ctx)
}

func (p *CustomProvider) Stats() sql.DBStats {
    return p.db.Stats()
}

func (p *CustomProvider) Type() string {
    return "custom"
}

func (p *CustomProvider) Dialect() persistence.SQLDialect {
    return &CustomDialect{}
}
```

### 步骤 2：自动注册

```go
// backend/infrastructure/persistence/custom/register.go
package custom

import (
    "github.com/erweixin/go-genai-stack/infrastructure/persistence"
)

func init() {
    persistence.DefaultFactory.Register("custom", NewProvider)
}
```

### 步骤 3：导入到 bootstrap

```go
// backend/infrastructure/bootstrap/database.go
import (
    _ "github.com/erweixin/go-genai-stack/infrastructure/persistence/custom"
)
```

### 步骤 4：使用

```bash
# docker/.env
APP_DATABASE_TYPE=custom
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=9999
# ... 其他配置
```

---

## 🧪 测试支持

### Repository 测试

Repository 测试无需修改，仍然使用 `*sql.DB`：

```go
func TestTaskRepository_Create(t *testing.T) {
    // 可以使用任何数据库的 *sql.DB
    db, err := sql.Open("postgres", testDSN)
    require.NoError(t, err)
    defer db.Close()
    
    repo := repository.NewTaskRepository(db)
    
    // 测试...
}
```

### 使用 Provider 进行集成测试

```go
func TestWithPostgreSQL(t *testing.T) {
    config := &persistence.Config{
        Type:     "postgres",
        Host:     "localhost",
        Port:     5432,
        User:     "test",
        Password: "test",
        Database: "test_db",
    }
    
    provider, err := persistence.NewProvider(config)
    require.NoError(t, err)
    
    err = provider.Connect(context.Background())
    require.NoError(t, err)
    defer provider.Close()
    
    // 使用 provider.DB() 进行测试
}
```

---

## 📊 性能对比

### 连接池配置建议

| 场景 | PostgreSQL | MySQL | SQLite |
|------|-----------|-------|--------|
| **开发环境** | MaxOpen: 10, MaxIdle: 2 | MaxOpen: 10, MaxIdle: 2 | MaxOpen: 1 |
| **生产环境（小流量）** | MaxOpen: 25, MaxIdle: 5 | MaxOpen: 25, MaxIdle: 5 | MaxOpen: 1 |
| **生产环境（高流量）** | MaxOpen: 100, MaxIdle: 20 | MaxOpen: 100, MaxIdle: 20 | 不推荐 |

---

## 🔍 故障排查

### 数据库类型未注册

**错误**：
```
unsupported database type: xyz (available: [postgres mysql])
```

**解决方案**：
1. 检查配置中的 `APP_DATABASE_TYPE` 值
2. 确保导入了对应的数据库包：
   ```go
   import _ "github.com/erweixin/go-genai-stack/infrastructure/persistence/xyz"
   ```

### 连接失败

**错误**：
```
failed to connect to database: connection refused
```

**解决方案**：
1. 检查数据库是否已启动
2. 验证配置中的 host、port、user、password
3. 检查网络连接和防火墙

### 驱动未找到

**错误**：
```
sql: unknown driver "mysql" (forgotten import?)
```

**解决方案**：
```bash
go get github.com/go-sql-driver/mysql
```

---

## 📚 参考资料

### 内部文档
- [数据库管理指南](../Guides/database.md)
- [Backend README](../../backend/README.md)
- [Provider 源码](../../backend/infrastructure/persistence/provider.go)

### 外部资源
- [database/sql 文档](https://pkg.go.dev/database/sql)
- [PostgreSQL 驱动](https://github.com/lib/pq)
- [MySQL 驱动](https://github.com/go-sql-driver/mysql)

---

## 💡 最佳实践

### 1. Repository 层保持数据库无关

```go
// ✅ 正确：使用标准 *sql.DB
type TaskRepository struct {
    db *sql.DB
}

// ❌ 错误：不要依赖特定数据库
type TaskRepository struct {
    postgresConn *postgres.Connection
}
```

### 2. 使用 SQL 方言处理差异

```go
// 使用方言接口
dialect := provider.Dialect()
query := fmt.Sprintf("SELECT * FROM tasks WHERE id = %s", 
    dialect.Placeholder(1))
```

### 3. 配置驱动，而非代码驱动

```go
// ✅ 正确：通过配置选择数据库
provider, _ := persistence.NewProvider(config)

// ❌ 错误：硬编码数据库类型
dbConn := postgres.NewConnection(config)
```

### 4. 优雅降级

```go
// 如果连接失败，记录日志但不中断启动
provider, err := InitDatabase(ctx, cfg)
if err != nil {
    log.Printf("Database unavailable: %v", err)
    // 可以使用内存数据库作为降级
}
```

---

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team

