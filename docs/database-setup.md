# 数据库设置指南

本文档详细说明如何设置和初始化 Go-GenAI-Stack 项目的数据库环境。

## 目录

- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
  - [1. 使用 Docker Compose 启动数据库](#1-使用-docker-compose-启动数据库)
  - [2. 配置环境变量](#2-配置环境变量)
  - [3. 初始化数据库 Schema](#3-初始化数据库-schema)
  - [4. 验证数据库连接](#4-验证数据库连接)
- [数据库配置详解](#数据库配置详解)
- [Schema 管理](#schema-管理)
- [常见问题](#常见问题)

---

## 技术栈

- **数据库**: PostgreSQL 16
- **缓存**: Redis 7
- **Schema 管理**: Atlas
- **数据访问**: `database/sql` (原生 SQL，无 ORM)
- **容器化**: Docker Compose

### 为什么选择这些技术？

#### PostgreSQL vs MySQL

- ✅ **JSONB 支持**：原生 JSON 存储和查询，适合 AI 应用的灵活数据结构
- ✅ **全文搜索**：内置 FTS，无需额外的搜索引擎
- ✅ **数组类型**：支持数组字段，简化数据模型
- ✅ **更严格的数据完整性**：事务处理更可靠

#### database/sql vs GORM

- ✅ **透明度**：SQL 语句清晰可见，AI 易于理解和优化
- ✅ **性能**：无 ORM 开销，直接操作数据库
- ✅ **控制力**：完全控制 SQL，便于性能优化
- ✅ **可调试性**：SQL 一目了然，调试更容易
- ✅ **Vibe-Coding 友好**：Repository 模式已提供足够的抽象

#### Atlas vs Goose/Migrate

- ✅ **声明式 Schema**：定义目标状态，Atlas 自动生成迁移
- ✅ **可视化 Diff**：清晰展示 Schema 变更
- ✅ **安全检查**：内置 Linting，防止危险操作
- ✅ **多环境支持**：统一管理 dev/test/prod

---

## 快速开始

```bash
# 1. 启动数据库服务
docker compose up -d postgres redis

# 2. 配置环境变量
cp env.example .env
# 编辑 .env，修改数据库密码等敏感信息

# 3. 初始化 Schema (首次运行)
cd backend
./scripts/schema.sh apply

# 4. 验证连接
./scripts/schema.sh status
```

---

## 详细步骤

### 1. 使用 Docker Compose 启动数据库

项目提供了完整的 Docker Compose 配置，包含 PostgreSQL、Redis 和可选的 pgAdmin。

#### 启动核心服务

```bash
# 启动 PostgreSQL 和 Redis
docker compose up -d postgres redis

# 查看日志
docker compose logs -f postgres

# 检查健康状态
docker compose ps
```

#### 启动管理工具（可选）

```bash
# 启动 pgAdmin (Web 数据库管理工具)
docker compose --profile tools up -d pgadmin

# 访问 pgAdmin
# URL: http://localhost:5050
# 邮箱: admin@genai.local (见 env.example)
# 密码: admin_password (见 env.example)
```

#### 配置 pgAdmin 连接

在 pgAdmin 中添加服务器：

1. **右键 Servers → Register → Server**
2. **General 标签**:
   - Name: `Go-GenAI-Stack`
3. **Connection 标签**:
   - Host: `postgres` (容器内网络)
   - Port: `5432`
   - Database: `go_genai_stack`
   - Username: `genai`
   - Password: `genai_password`

### 2. 配置环境变量

#### 创建本地配置

```bash
# 复制示例配置
cp env.example .env

# 编辑配置文件
vim .env  # 或使用你喜欢的编辑器
```

#### 关键配置项

```bash
# 数据库连接
DB_HOST=localhost          # Docker 内使用 'postgres'
DB_PORT=5432
DB_USER=genai
DB_PASSWORD=genai_password  # ⚠️ 生产环境务必修改
DB_NAME=go_genai_stack
DB_SSLMODE=disable         # 本地开发用，生产环境改为 require

# 连接池配置（根据负载调整）
DB_MAX_OPEN_CONNS=25       # 最大连接数 = CPU 核心数 * 2-4
DB_MAX_IDLE_CONNS=10       # 空闲连接数 = MAX_OPEN_CONNS / 2
DB_CONN_MAX_LIFETIME=1h    # 连接最大生命周期
DB_CONN_MAX_IDLE_TIME=10m  # 空闲连接超时
```

#### 连接池配置建议

| 场景 | MAX_OPEN_CONNS | MAX_IDLE_CONNS | 说明 |
|------|----------------|----------------|------|
| 开发环境 | 10-25 | 5-10 | 足够开发测试使用 |
| 低负载生产 | 25-50 | 10-25 | 小型应用 |
| 中负载生产 | 50-100 | 25-50 | 中型应用 |
| 高负载生产 | 100-200 | 50-100 | 大型应用，配合监控调优 |

> **提示**: 连接数不是越大越好，过多的连接会增加数据库负担。建议从小开始，根据监控数据逐步调整。

### 3. 初始化数据库 Schema

本项目使用 **Atlas** 进行声明式 Schema 管理。

#### 安装 Atlas (首次使用)

```bash
# macOS
brew install ariga/tap/atlas

# Linux
curl -sSf https://atlasgo.sh | sh

# 验证安装
atlas version
```

#### 初始化 Schema

```bash
cd backend

# 应用 Schema 到数据库 (首次运行)
./scripts/schema.sh apply

# 查看 Schema 状态
./scripts/schema.sh status

# 检查 Schema 是否与声明一致
./scripts/schema.sh inspect
```

#### Schema 文件位置

- **声明式 Schema**: `backend/infrastructure/database/schema/schema.sql`
- **迁移历史**: `backend/migrations/atlas/`
- **种子数据**: `backend/migrations/seed/01_initial_data.sql`

### 4. 验证数据库连接

#### 方式 1: 使用 psql 命令行

```bash
# 连接到数据库
psql -h localhost -U genai -d go_genai_stack

# 查看表
\dt

# 查看表结构
\d conversations
\d messages

# 退出
\q
```

#### 方式 2: 使用 Go 代码验证

创建测试文件 `backend/cmd/check_db.go`:

```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/erweixin/go-genai-stack/backend/infrastructure/config"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 连接数据库
	conn, err := postgres.NewConnection(context.Background(), cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	// 测试查询
	var version string
	err = conn.DB().QueryRow("SELECT version()").Scan(&version)
	if err != nil {
		log.Fatalf("Failed to query database: %v", err)
	}

	fmt.Println("✅ Database connection successful!")
	fmt.Printf("PostgreSQL version: %s\n", version)
}
```

运行测试:

```bash
cd backend
go run cmd/check_db.go
```

#### 方式 3: 使用健康检查接口

启动服务后访问:

```bash
curl http://localhost:8080/health
```

---

## 数据库配置详解

### 配置结构

配置定义在 `backend/infrastructure/config/config.go`:

```go
type DatabaseConfig struct {
    Host            string        // 数据库主机
    Port            int           // 端口
    User            string        // 用户名
    Password        string        // 密码
    DBName          string        // 数据库名
    SSLMode         string        // SSL 模式
    MaxOpenConns    int           // 最大打开连接数
    MaxIdleConns    int           // 最大空闲连接数
    ConnMaxLifetime time.Duration // 连接最大生命周期
    ConnMaxIdleTime time.Duration // 连接最大空闲时间
}
```

### 配置加载流程

1. **读取环境变量** (`config/loader.go`)
2. **应用默认值** (`config/config.go`)
3. **验证配置** (`config/validator.go`)
4. **建立连接** (`persistence/postgres/connection.go`)

### 连接池工作原理

```
请求进入 → 从池获取连接 → 执行查询 → 归还连接到池

空闲连接 → 超时检查 → 关闭超时连接 → 保持最小空闲数
           (ConnMaxIdleTime)

所有连接 → 生命周期检查 → 关闭老化连接 → 创建新连接
           (ConnMaxLifetime)
```

### 连接池监控

在生产环境中，应监控以下指标：

```go
stats := db.Stats()
fmt.Printf("Max Open Connections: %d\n", stats.MaxOpenConnections)
fmt.Printf("Open Connections: %d\n", stats.OpenConnections)
fmt.Printf("In Use: %d\n", stats.InUse)
fmt.Printf("Idle: %d\n", stats.Idle)
fmt.Printf("Wait Count: %d\n", stats.WaitCount)
fmt.Printf("Wait Duration: %v\n", stats.WaitDuration)
```

关键指标：
- **WaitCount 持续增长**: 连接池不足，考虑增加 `MaxOpenConns`
- **Idle 长期为 0**: 连接池过小或负载过高
- **OpenConnections 接近 MaxOpenConns**: 可能需要扩容

---

## Schema 管理

### Schema 文件结构

```sql
-- backend/infrastructure/database/schema/schema.sql

-- 对话表
CREATE TABLE IF NOT EXISTS conversations (
    id         VARCHAR(64) PRIMARY KEY,
    user_id    VARCHAR(64) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id              VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    tokens          INTEGER DEFAULT 0,
    model           VARCHAR(100),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 修改 Schema 的工作流程

#### 1. 修改声明式 Schema

编辑 `backend/infrastructure/database/schema/schema.sql`:

```sql
-- 例如：为 conversations 表添加 is_archived 字段
ALTER TABLE conversations ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
```

#### 2. 生成迁移

```bash
cd backend

# 生成迁移文件
./scripts/schema.sh diff add_is_archived_field

# 查看生成的迁移文件
cat migrations/atlas/<timestamp>_add_is_archived_field.sql
```

#### 3. 审查迁移

Atlas 会生成如下迁移文件:

```sql
-- migrations/atlas/20250101120000_add_is_archived_field.sql
-- Add column "is_archived" to table: "conversations"
ALTER TABLE "conversations" ADD COLUMN "is_archived" boolean NOT NULL DEFAULT false;
```

#### 4. 应用迁移

```bash
# 应用到数据库
./scripts/schema.sh apply

# 验证 Schema
./scripts/schema.sh status
```

#### 5. 更新 Go Model

```go
// backend/domains/chat/model/conversation.go
type Conversation struct {
    ID         string
    UserID     string
    Title      string
    IsArchived bool      // 新增字段
    Messages   []*Message
    CreatedAt  time.Time
    UpdatedAt  time.Time
}
```

#### 6. 更新 Repository

```go
// 更新 Create 方法
func (r *conversationRepository) Create(ctx context.Context, conv *model.Conversation) error {
    query := `
        INSERT INTO conversations (id, user_id, title, is_archived, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `
    _, err := r.db.ExecContext(ctx, query,
        conv.ID, conv.UserID, conv.Title, conv.IsArchived, conv.CreatedAt, conv.UpdatedAt,
    )
    return err
}
```

### Atlas 命令速查

```bash
# 生成迁移
./scripts/schema.sh diff <migration_name>

# 应用迁移
./scripts/schema.sh apply

# 查看状态
./scripts/schema.sh status

# 检查 Schema
./scripts/schema.sh inspect

# Lint 检查（推荐在 CI 中使用）
./scripts/schema.sh lint

# 验证 Schema 语法
./scripts/schema.sh validate

# 清理测试数据
./scripts/schema.sh clean
```

---

## 常见问题

### Q1: 连接失败 "connection refused"

**症状**:
```
failed to connect to database: dial tcp [::1]:5432: connect: connection refused
```

**解决方案**:
```bash
# 检查 PostgreSQL 是否运行
docker compose ps postgres

# 查看日志
docker compose logs postgres

# 重启服务
docker compose restart postgres
```

### Q2: 权限错误 "FATAL: password authentication failed"

**症状**:
```
FATAL: password authentication failed for user "genai"
```

**解决方案**:
```bash
# 检查环境变量
grep DB_ .env

# 重置 PostgreSQL 数据（⚠️ 会删除所有数据）
docker compose down -v
docker compose up -d postgres
```

### Q3: Schema 不一致

**症状**:
```
atlas schema inspect shows differences from schema.sql
```

**解决方案**:
```bash
# 检查差异
./scripts/schema.sh inspect

# 强制同步
./scripts/schema.sh apply --force

# 如果需要重置整个 Schema
docker compose exec postgres psql -U genai -d go_genai_stack -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
./scripts/schema.sh apply
```

### Q4: 连接池耗尽

**症状**:
```
WaitCount: 1000+
wait duration: 5s+
```

**解决方案**:

1. **检查是否有连接泄漏**:
```go
// 确保所有 QueryRow/Query 后都调用了 Close
rows, err := db.Query(...)
defer rows.Close() // ⚠️ 不要忘记
```

2. **调整连接池大小**:
```bash
# 增加连接数
DB_MAX_OPEN_CONNS=50
DB_MAX_IDLE_CONNS=25
```

3. **检查慢查询**:
```sql
-- 查看活动连接
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE datname = 'go_genai_stack';

-- 查看慢查询
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Q5: Docker Compose 启动失败

**症状**:
```
Error response from daemon: Conflict. The container name "/go-genai-postgres" is already in use
```

**解决方案**:
```bash
# 停止并删除所有容器
docker compose down

# 如果仍有问题，手动删除
docker rm -f go-genai-postgres go-genai-redis

# 重新启动
docker compose up -d
```

### Q6: 如何备份和恢复数据库？

**备份**:
```bash
# 备份数据库
docker compose exec postgres pg_dump -U genai go_genai_stack > backup_$(date +%Y%m%d).sql

# 只备份 Schema
docker compose exec postgres pg_dump -U genai --schema-only go_genai_stack > schema_backup.sql

# 只备份数据
docker compose exec postgres pg_dump -U genai --data-only go_genai_stack > data_backup.sql
```

**恢复**:
```bash
# 恢复数据库
cat backup_20250101.sql | docker compose exec -T postgres psql -U genai go_genai_stack

# 或者使用 psql
docker compose exec postgres psql -U genai go_genai_stack < backup_20250101.sql
```

---

## 下一步

- 📖 [数据库架构评审](./database-architecture-review.md) - 深入了解数据库设计理念
- 📖 [Vibe-Coding 最佳实践](./Vibe-Coding-Friendly.md) - AI 友好的编码规范
- 📖 [Atlas 迁移指南](./atlas-migration-guide.md) - 完整的 Schema 管理教程
- 🚀 [快速开始](../README.md#快速开始) - 启动整个项目

---

## 相关资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Atlas 官方文档](https://atlasgo.io/)
- [database/sql 包文档](https://pkg.go.dev/database/sql)
- [连接池最佳实践](https://www.alexedwards.net/blog/configuring-sqldb)

