# 数据库管理指南

> 📖 PostgreSQL + Atlas Schema 管理完整指南

**最后更新**：2025-11-23

---

## 🚀 快速开始（5 分钟）

### 前置要求

- Docker & Docker Compose
- Atlas CLI（可选，用于 Schema 管理）
- psql（可选，用于手动操作）

### 一键启动

```bash
# 1. 启动数据库
cd docker
docker-compose up -d

# 2. 等待数据库就绪
docker exec go-genai-stack-postgres pg_isready -U postgres

# 3. 应用 Schema
cd ../backend
./scripts/schema.sh apply

# 4. 加载种子数据
./scripts/seed.sh

# 5. 验证
psql "postgresql://postgres:password@localhost:5432/go_genai_stack" -c "SELECT COUNT(*) FROM tasks;"
```

---

## 📋 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| **PostgreSQL** | 16 | 主数据库 |
| **Redis** | 7 | 缓存和会话 |
| **Atlas** | 最新 | Schema 管理工具 |
| **database/sql** | 标准库 | 数据访问（无 ORM）|

### 为什么选择 PostgreSQL？

- ✅ **功能强大**：支持 JSONB、全文搜索、地理数据
- ✅ **性能优秀**：适合读写混合场景
- ✅ **生态成熟**：工具链完善
- ✅ **开源免费**：无许可证成本

### 为什么使用 Atlas？

- ✅ **声明式 Schema**：只描述目标状态，不描述过程
- ✅ **版本控制友好**：Schema 即代码
- ✅ **自动生成迁移**：对比差异自动生成 SQL
- ✅ **安全性检查**：Lint 和验证

### 为什么不用 ORM？

- ✅ **透明度高**：SQL 清晰可见，AI 易于理解
- ✅ **性能更好**：无 ORM 开销，直接操作数据库
- ✅ **控制力强**：完全控制 SQL 语句，便于优化
- ✅ **Vibe-Coding 友好**：Repository 模式已提供抽象

---

## 🎯 Atlas 日常使用

### 安装 Atlas

```bash
# macOS
brew install ariga/tap/atlas

# Linux
curl -sSf https://atlasgo.sh | sh

# 验证安装
atlas version
```

### 常用命令速查

| 命令 | 用途 | 示例 |
|------|------|------|
| `./scripts/schema.sh diff <name>` | 生成迁移 | `./scripts/schema.sh diff add_tags` |
| `./scripts/schema.sh apply` | 应用迁移 | `./scripts/schema.sh apply` |
| `./scripts/schema.sh status` | 查看状态 | `./scripts/schema.sh status` |
| `./scripts/schema.sh validate` | 验证 Schema | `./scripts/schema.sh validate` |
| `./scripts/schema.sh lint` | 质量检查 | `./scripts/schema.sh lint` |
| `./scripts/schema.sh inspect` | 检查数据库 | `./scripts/schema.sh inspect` |
| `./scripts/schema.sh clean` | 清理数据库 | `./scripts/schema.sh clean` |

### 典型工作流

```bash
# 1. 修改 Schema 文件
vim backend/infrastructure/database/schema/schema.sql

# 2. 生成迁移文件
cd backend
./scripts/schema.sh diff add_new_feature

# 3. 查看生成的迁移
cat migrations/atlas/*.sql

# 4. 应用迁移
./scripts/schema.sh apply

# 5. 验证结果
./scripts/schema.sh status
```

---

## 📝 Schema 管理实践

### Schema 文件位置

```
backend/infrastructure/database/schema/schema.sql
```

这是唯一的数据源（Single Source of Truth）。

### 添加新表

```sql
-- backend/infrastructure/database/schema/schema.sql

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT products_price_positive CHECK (price >= 0),
    CONSTRAINT products_stock_non_negative CHECK (stock >= 0)
);

-- 索引
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);

-- 注释
COMMENT ON TABLE products IS 'Product catalog';
COMMENT ON COLUMN products.price IS 'Price in USD';
```

```bash
./scripts/schema.sh diff add_products_table
./scripts/schema.sh apply
```

### 添加新字段

```sql
-- 在 tasks 表中添加 estimated_hours 字段
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    -- ... 其他字段 ...
    estimated_hours DECIMAL(5, 2),  -- 👈 新增字段
    created_at TIMESTAMPTZ NOT NULL
);
```

```bash
./scripts/schema.sh diff add_task_estimated_hours
./scripts/schema.sh apply
```

### 添加索引

```sql
-- 为常用查询添加索引
CREATE INDEX idx_tasks_status_priority 
    ON tasks(status, priority);

CREATE INDEX idx_tasks_due_date_status 
    ON tasks(due_date, status) 
    WHERE status != 'completed';
```

```bash
./scripts/schema.sh diff add_task_indexes
./scripts/schema.sh apply
```

### 修改表结构

```sql
-- 修改字段类型
ALTER TABLE tasks 
    ALTER COLUMN description TYPE TEXT;

-- 添加约束
ALTER TABLE tasks 
    ADD CONSTRAINT tasks_title_length CHECK (LENGTH(title) >= 1);

-- 添加默认值
ALTER TABLE tasks 
    ALTER COLUMN priority SET DEFAULT 'medium';
```

---

## 🗄️ 数据库配置

### 连接配置

**环境变量**（推荐）：

```bash
# backend/.env 或 docker/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=go_genai_stack
DB_SSL_MODE=disable

# 或使用连接字符串
DATABASE_URL="postgresql://postgres:password@localhost:5432/go_genai_stack?sslmode=disable"
```

**Go 代码**（`backend/infrastructure/config/config.go`）：

```go
type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    Database string
    SSLMode  string
}

func (c *DatabaseConfig) ConnectionString() string {
    return fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        c.Host, c.Port, c.User, c.Password, c.Database, c.SSLMode,
    )
}
```

### 连接池配置

**推荐设置**（`backend/infrastructure/persistence/postgres/connection.go`）：

```go
// 连接池设置
db.SetMaxOpenConns(25)                  // 最大打开连接数
db.SetMaxIdleConns(5)                   // 最大空闲连接数
db.SetConnMaxLifetime(5 * time.Minute)  // 连接最大生命周期
db.SetConnMaxIdleTime(10 * time.Minute) // 空闲连接最大生命周期
```

**不同场景的配置**：

| 场景 | MaxOpenConns | MaxIdleConns | 说明 |
|------|--------------|--------------|------|
| **开发环境** | 10 | 2 | 资源有限 |
| **生产环境（小流量）** | 25 | 5 | 平衡性能和资源 |
| **生产环境（高流量）** | 100 | 20 | 高并发支持 |
| **API 密集型** | 50 | 10 | 短连接多 |

---

## 🌱 种子数据

### 加载种子数据

```bash
# 使用脚本（推荐）
cd backend
./scripts/seed.sh

# 手动加载
psql "postgresql://postgres:password@localhost:5432/go_genai_stack" \
    -f migrations/seed/01_initial_data.sql
```

### 清空并重新加载

```bash
# 使用 --clear 标志
./scripts/seed.sh --clear

# 或手动清空
psql "$DATABASE_URL" -c "TRUNCATE TABLE tasks, task_tags CASCADE;"
psql "$DATABASE_URL" -f migrations/seed/01_initial_data.sql
```

### 创建种子数据文件

```sql
-- backend/migrations/seed/02_demo_users.sql

-- 插入演示用户
INSERT INTO users (id, email, name, created_at) VALUES
('user-001', 'alice@example.com', 'Alice', NOW()),
('user-002', 'bob@example.com', 'Bob', NOW()),
('user-003', 'charlie@example.com', 'Charlie', NOW());

-- 插入用户任务关联
UPDATE tasks SET assigned_to = 'user-001' WHERE title LIKE '%文档%';
UPDATE tasks SET assigned_to = 'user-002' WHERE title LIKE '%Bug%';
```

---

## 🐛 故障排查

### 常见问题

#### 1. 数据库连接失败

**症状**：
```
ERROR: connection to server at "localhost", port 5432 failed
```

**解决方案**：

```bash
# 检查 Docker 容器状态
docker ps | grep postgres

# 启动数据库
cd docker
docker-compose up -d postgres

# 查看日志
docker-compose logs postgres

# 测试连接
psql "postgresql://postgres:password@localhost:5432/go_genai_stack" -c "SELECT 1;"
```

#### 2. Atlas 未找到

**解决方案**：

```bash
# macOS
brew install ariga/tap/atlas

# Linux
curl -sSf https://atlasgo.sh | sh

# 验证
atlas version
```

#### 3. 迁移失败

**症状**：
```
ERROR: relation "tasks" does not exist
```

**解决方案**：

```bash
# 查看迁移状态
./scripts/schema.sh status

# 检查 Schema 语法
./scripts/schema.sh validate

# 如果数据不重要，清理并重新开始
./scripts/schema.sh clean
./scripts/schema.sh apply
```

#### 4. 种子数据加载失败

**症状**：
```
ERROR: duplicate key value violates unique constraint
```

**解决方案**：

```bash
# 清空现有数据
./scripts/seed.sh --clear

# 或手动清空特定表
psql "$DATABASE_URL" -c "TRUNCATE TABLE tasks CASCADE;"
```

#### 5. 连接池耗尽

**症状**：
```
ERROR: remaining connection slots are reserved
```

**解决方案**：

1. 检查是否有连接泄漏：
```go
// 确保使用 Context
rows, err := db.QueryContext(ctx, query)
defer rows.Close()  // ← 重要！
```

2. 调整连接池配置：
```go
db.SetMaxOpenConns(50)  // 增加最大连接数
```

3. 检查 PostgreSQL 配置：
```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看最大连接数
SHOW max_connections;
```

---

## 🔧 高级配置

### 事务管理

使用事务辅助函数（`backend/infrastructure/persistence/postgres/transaction.go`）：

```go
import "github.com/erweixin/go-genai-stack/infrastructure/persistence/postgres"

err := postgres.WithTransaction(ctx, db, func(tx *sql.Tx) error {
    // 执行多个操作
    _, err := tx.ExecContext(ctx, "INSERT INTO tasks ...")
    if err != nil {
        return err  // 自动回滚
    }
    
    _, err = tx.ExecContext(ctx, "INSERT INTO task_tags ...")
    if err != nil {
        return err  // 自动回滚
    }
    
    return nil  // 自动提交
})
```

### 查询优化

**使用索引**：

```sql
-- 为常用查询添加索引
CREATE INDEX idx_tasks_status_created 
    ON tasks(status, created_at DESC);

-- 部分索引（过滤掉不需要的数据）
CREATE INDEX idx_tasks_pending 
    ON tasks(created_at DESC) 
    WHERE status = 'pending';
```

**使用 EXPLAIN ANALYZE**：

```sql
EXPLAIN ANALYZE
SELECT * FROM tasks 
WHERE status = 'pending' 
  AND priority = 'high' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📚 参考资料

### 内部文档
- [Backend README](../../backend/README.md)
- [Schema 文件](../../backend/infrastructure/database/schema/schema.sql)
- [Atlas 配置](../../backend/atlas.hcl)
- [Connection 实现](../../backend/infrastructure/persistence/postgres/connection.go)

### 外部资源
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Atlas 官方文档](https://atlasgo.io/docs)
- [database/sql 教程](https://go.dev/doc/database/querying)

---

## ⚡ 快速参考卡

### 最常用命令

```bash
# 启动数据库
docker-compose -f docker/docker-compose.yml up -d

# 应用 Schema
cd backend && ./scripts/schema.sh apply

# 加载种子数据
cd backend && ./scripts/seed.sh

# 生成迁移
./scripts/schema.sh diff <name>

# 查看状态
./scripts/schema.sh status

# 连接数据库
psql "postgresql://postgres:password@localhost:5432/go_genai_stack"
```

### 常用 SQL

```sql
-- 查看所有表
\dt

-- 查看表结构
\d tasks

-- 查看索引
\di

-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看表大小
SELECT pg_size_pretty(pg_total_relation_size('tasks'));

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team

