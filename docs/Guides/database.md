# 数据库管理指南

> 📖 PostgreSQL + Atlas Schema 管理

**最后更新**：2025-11-23

---

## 🚀 快速开始

### 前置要求

- Docker & Docker Compose
- Atlas CLI（Schema 管理）
- PostgreSQL 客户端（psql）

### 一键启动

```bash
# 1. 配置环境变量（可选，使用默认值可直接启动）
cd docker
cp env.example .env  # 如需自定义，编辑 .env 文件

# 2. 启动数据库
docker-compose up -d

# 3. 加载环境变量（重要！）
source .env  # 或 export $(cat .env | grep -v '^#' | xargs)

# 4. 应用 Schema 和种子数据
cd ../backend/database
make apply  # 应用数据库迁移
make seed   # 加载演示数据

# 5. 验证
make status
```

**💡 提示**：如果遇到连接问题，确保已正确加载环境变量：
```bash
# 检查环境变量
echo $APP_DATABASE_USER  # 应该输出: genai
```

---

## 📋 技术栈

| 组件 | 用途 | 说明 |
|------|------|------|
| **PostgreSQL 16** | 主数据库 | 功能强大、性能优秀 |
| **Atlas** | Schema 管理 | 声明式、版本控制友好 |
| **database/sql** | 数据访问 | 原生 SQL，无 ORM |

### 为什么不用 ORM？

- ✅ **透明度高**：SQL 清晰可见，AI 易于理解
- ✅ **性能更好**：无 ORM 开销
- ✅ **控制力强**：完全控制 SQL 语句
- ✅ **Vibe-Coding 友好**：Repository 模式已提供抽象

---

## 🎯 Schema 管理

### 安装 Atlas

```bash
# macOS
brew install ariga/tap/atlas

# Linux
curl -sSf https://atlasgo.sh | sh
```

### 常用命令

```bash
# 进入 database 目录
cd backend/database

# 生成迁移
make diff NAME=<name>

# 应用迁移
make apply

# 查看状态
make status

# 验证 Schema
make validate
```

### 典型工作流

```bash
# 1. 修改 Schema
vim backend/database/schema.sql

# 2. 生成迁移
cd backend/database && make diff NAME=add_new_feature

# 3. 应用迁移
make apply
```

### Schema 示例

**添加新表**：

```sql
-- backend/database/schema.sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT products_price_positive CHECK (price >= 0)
);

CREATE INDEX idx_products_name ON products(name);
```

**添加索引**：

```sql
CREATE INDEX idx_tasks_status_priority 
    ON tasks(status, priority);
```

---

## 🗄️ 数据库配置

### 环境变量

**配置文件位置**：`docker/.env`（参考 `docker/env.example`）

**重要说明**：
- ⚠️ **Go 后端必须使用 `APP_` 前缀**：`APP_DATABASE_*`、`APP_REDIS_*` 等
- Docker Compose 使用无前缀变量：`POSTGRES_*`、`REDIS_*`
- 脚本 `schema.sh` 和 `seed.sh` 支持两种格式

**示例配置**（`docker/.env`）：

```bash
# ==================== Go 后端数据库配置 ====================
# ⚠️ 必须使用 APP_DATABASE_ 前缀
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=5432
APP_DATABASE_USER=genai
APP_DATABASE_PASSWORD=genai_password
APP_DATABASE_DATABASE=go_genai_stack
APP_DATABASE_SSL_MODE=disable

# 连接池配置
APP_DATABASE_MAX_OPEN_CONNS=25
APP_DATABASE_MAX_IDLE_CONNS=25
APP_DATABASE_CONN_MAX_LIFETIME=1h
APP_DATABASE_CONN_MAX_IDLE_TIME=10m

# ==================== Docker Compose 配置 ====================
# 以下变量用于 docker-compose.yml（无需 APP_ 前缀）
POSTGRES_USER=genai
POSTGRES_PASSWORD=genai_password
POSTGRES_DB=go_genai_stack

REDIS_PASSWORD=redis_password
```

**数据库管理使用**：

Atlas 会按以下优先级读取变量：
1. `DATABASE_URL`（完整连接字符串）
2. `POSTGRES_*`（Docker Compose 格式，优先）
3. `APP_DATABASE_*`（Go 后端格式）
4. 默认值：`postgresql://genai:genai_password@localhost:5432/go_genai_stack?sslmode=disable`

```bash
# 加载环境变量并执行命令
source docker/.env
cd backend/database
make apply
```

**⚠️ 安全提示**：
- 生产环境必须修改默认密码
- 不要将 `.env` 文件提交到 Git
- 使用 `docker/env.example` 作为模板：`cp docker/env.example docker/.env`

### 连接池配置

```go
// backend/infrastructure/persistence/postgres/connection.go
db.SetMaxOpenConns(25)                  // 最大连接数
db.SetMaxIdleConns(5)                   // 最大空闲连接数
db.SetConnMaxLifetime(5 * time.Minute)  // 连接生命周期
```

| 场景 | MaxOpenConns | MaxIdleConns |
|------|--------------|--------------|
| 开发环境 | 10 | 2 |
| 生产环境（小流量）| 25 | 5 |
| 生产环境（高流量）| 100 | 20 |

---

## 🌱 种子数据

### 加载种子数据

```bash
# 加载种子数据
cd backend/database
make seed

# 清空数据库并重新加载
make clean
make apply
make seed
```

### 创建种子文件

```sql
-- backend/database/seed/02_demo_users.sql
INSERT INTO users (id, email, username, password_hash) VALUES
('user-001', 'alice@example.com', 'alice', 'hashed_password'),
('user-002', 'bob@example.com', 'bob', 'hashed_password');
```

---

## 🐛 常见问题

### 连接失败

```bash
# 检查容器状态
docker ps | grep postgres

# 查看日志
cd docker && docker-compose logs postgres

# 测试连接（使用默认配置）
psql "postgresql://genai:genai_password@localhost:5432/go_genai_stack" -c "SELECT 1;"
```

### 迁移失败

```bash
# 查看状态
cd backend/database
make status

# 清理并重建（⚠️ 会删除数据）
make clean
make apply
```

### 连接池耗尽

```go
// 确保关闭 rows
rows, err := db.QueryContext(ctx, query)
if err != nil {
    return err
}
defer rows.Close()  // 重要！
```

---

## 🔧 高级功能

### 事务管理

```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"

err := postgres.WithTransaction(ctx, db, func(tx *sql.Tx) error {
    _, err := tx.ExecContext(ctx, "INSERT INTO tasks ...")
    if err != nil {
        return err  // 自动回滚
    }
    return nil  // 自动提交
})
```

### 查询优化

```sql
-- 部分索引
CREATE INDEX idx_tasks_pending 
    ON tasks(created_at DESC) 
    WHERE status = 'pending';

-- 分析查询
EXPLAIN ANALYZE
SELECT * FROM tasks 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ⚡ 快速参考

### 常用命令

```bash
# 启动数据库
cd docker && docker-compose up -d

# 加载环境变量（推荐）
source docker/.env

# 应用 Schema
cd backend/database
make apply

# 加载种子数据
make seed

# 连接数据库（使用默认配置）
psql "postgresql://genai:genai_password@localhost:5432/go_genai_stack"

# 或使用环境变量
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
```

### 常用 SQL

```sql
-- 查看所有表
\dt

-- 查看表结构
\d tasks

-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看表大小
SELECT pg_size_pretty(pg_total_relation_size('tasks'));
```

---

## 📚 参考资料

- [Backend README](../../backend/README.md)
- [Database README](../../backend/database/README.md) ⭐
- [Schema 文件](../../backend/database/schema.sql)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Atlas 文档](https://atlasgo.io/docs)

---

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team
