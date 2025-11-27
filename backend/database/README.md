# 数据库管理

> 使用 Atlas 进行声明式数据库管理 - 简单、快速、AI 友好

**状态**：✅ 生产就绪 | **Atlas 版本**：v0.38.1 | **测试时间**：2024-11-27

---

## 📖 目录

- [快速开始](#-快速开始)
- [首次使用](#-首次使用)
- [日常开发流程](#-日常开发流程)
- [命令参考](#-命令参考)
- [实用示例](#-实用示例)
- [故障排查](#-故障排查)
- [最佳实践](#-最佳实践)

---

## 🚀 快速开始

### 前置要求

```bash
# 1. 安装 Atlas
brew install ariga/tap/atlas

# 2. 验证安装
atlas version  # 应该显示 v0.38.x
```

### 30 秒启动

```bash
# 进入目录
cd backend/database

# 创建初始迁移
make init

# 应用迁移
make apply

# 加载演示数据（可选）
make seed-docker
```

✅ 完成！数据库已准备就绪。

---

## 🎯 首次使用

### 步骤 1：启动数据库

```bash
cd docker
docker-compose up -d postgres
```

### 步骤 2：创建初始迁移

```bash
cd ../backend/database

# Atlas 会基于 schema.sql 创建初始迁移文件
make init
```

**输出示例**：
```
🚀 创建初始迁移...
✅ 初始迁移已创建: migrations/20241127115128_initial_schema.sql
🔐 生成校验和...
✅ 校验和已生成
💡 下一步：运行 'make apply' 应用迁移
```

### 步骤 3：应用迁移到数据库

```bash
make apply
```

**会发生什么**：
- 创建 `users` 表（用户账户）
- 创建 `tasks` 表（任务）
- 创建 `task_tags` 表（任务标签）
- 创建视图（overdue_tasks, task_statistics）
- 创建函数和触发器

### 步骤 4：验证

```bash
make status
```

**输出示例**：
```
📊 迁移状态...
Migration Status: OK
  -- Current Version: 20241127115128
  -- Next Version:    Already at latest version
  -- Executed Files:  1
  -- Pending Files:   0
```

### 步骤 5：加载演示数据（可选）

```bash
make seed-docker
```

这会加载 30+ 个示例任务数据，方便测试。

---

## 💻 日常开发流程

### 标准流程（3 步）

#### 1️⃣ 修改 Schema

编辑 `schema.sql` 文件，描述你想要的**目标状态**：

```sql
-- 示例：给 users 表添加 bio 字段
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE,
    -- ... 其他字段 ...
    bio TEXT,  -- ✨ 新增字段
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

**重要**：
- ✅ 只需描述目标状态，不需要写 `ALTER TABLE`
- ✅ Atlas 会自动计算需要的变更
- ✅ 注意表的顺序（被引用的表要在前面）

#### 2️⃣ 生成迁移

```bash
make diff NAME=add_user_bio
```

Atlas 会：
- 对比 `schema.sql` 和当前数据库
- 自动生成需要的 SQL 语句
- 创建迁移文件：`migrations/YYYYMMDDHHMMSS_add_user_bio.sql`

**查看生成的迁移**：
```bash
cat migrations/*add_user_bio.sql
```

**输出示例**：
```sql
-- Modify "users" table
ALTER TABLE "users" ADD COLUMN "bio" text NULL;
```

#### 3️⃣ 应用迁移

```bash
make apply
```

**输出示例**：
```
⚠️  将要应用迁移到数据库

Migration Status: PENDING
  -- Current Version: 20241127115128
  -- Next Version:    20241127115129
  -- Executed Files:  1
  -- Pending Files:   1

确认应用？(y/N) y

Migrating to version 20241127115129 from 20241127115128:
  -- migrating version 20241127115129
    -> ALTER TABLE "users" ADD COLUMN "bio" text NULL;
  -- ok (1.19ms)

✅ 迁移已应用
```

### 快速参考

```bash
# 完整流程
vim schema.sql              # 1. 修改
make diff NAME=my_change    # 2. 生成
make apply                  # 3. 应用
```

---

## 📋 命令参考

### 基础命令

```bash
make help          # 显示所有命令
make init          # 创建初始迁移（首次使用）
make diff          # 生成新迁移（需要 NAME=xxx）
make apply         # 应用迁移到数据库
make status        # 查看迁移状态
```

### 数据管理

```bash
make seed-docker   # 加载种子数据（使用 Docker）
make clean-docker  # 清空数据库（危险！）
```

### 工具命令

```bash
make inspect       # 查看当前数据库结构
make hash          # 生成迁移校验和
make lint          # 检查迁移质量
make validate      # 验证迁移文件
```

### 命令详解

#### `make init`

**用途**：创建初始迁移（项目首次使用）

**做什么**：
1. 复制 `schema.sql` 到 `migrations/TIMESTAMP_initial_schema.sql`
2. 生成 `atlas.sum` 校验和文件

**何时使用**：
- 新项目首次初始化
- 重置数据库后重新开始

**注意**：如果 `migrations/` 目录不为空会报错

---

#### `make diff NAME=xxx`

**用途**：生成新迁移

**做什么**：
1. 对比 `schema.sql` 和当前数据库
2. 自动生成 SQL 变更语句
3. 创建迁移文件并更新 `atlas.sum`

**参数**：
- `NAME`: 迁移名称（必需），使用下划线分隔，如 `add_user_bio`

**示例**：
```bash
make diff NAME=add_email_verification
make diff NAME=create_posts_table
make diff NAME=add_indexes_to_tasks
```

---

#### `make apply`

**用途**：应用迁移到数据库

**做什么**：
1. 显示待应用的迁移
2. 要求确认（输入 `y` 继续）
3. 按顺序执行迁移 SQL
4. 记录迁移版本到数据库

**特性**：
- ✅ 事务执行（失败自动回滚）
- ✅ 只执行未应用的迁移
- ✅ 记录执行历史

---

#### `make status`

**用途**：查看迁移状态

**输出信息**：
- 当前数据库版本
- 已执行的迁移数量
- 待执行的迁移数量
- 下一个迁移版本

**示例输出**：
```
Migration Status: OK
  -- Current Version: 20241127115128
  -- Next Version:    Already at latest version
  -- Executed Files:  1
  -- Pending Files:   0
```

---

## 💡 实用示例

### 示例 1：添加新表

**场景**：添加 `posts` 表

**步骤**：

1. 编辑 `schema.sql`：
```sql
-- 在文件末尾添加
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

2. 生成迁移：
```bash
make diff NAME=create_posts_table
```

3. 应用：
```bash
make apply
```

---

### 示例 2：添加字段

**场景**：给 `users` 表添加 `phone` 字段

**步骤**：

1. 编辑 `schema.sql`：
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),  -- ✨ 新增
    -- ... 其他字段 ...
);
```

2. 生成并应用：
```bash
make diff NAME=add_user_phone
make apply
```

---

### 示例 3：添加索引

**场景**：优化 `tasks` 表查询性能

**步骤**：

1. 编辑 `schema.sql`，在 tasks 表定义后添加：
```sql
-- 现有索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ✨ 新增复合索引
CREATE INDEX idx_tasks_user_status_priority ON tasks(user_id, status, priority);
```

2. 生成并应用：
```bash
make diff NAME=add_task_performance_index
make apply
```

---

### 示例 4：修改字段类型

**场景**：扩展 `title` 字段长度

**步骤**：

1. 编辑 `schema.sql`：
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,  -- 从 200 改为 500
    -- ... 其他字段 ...
);
```

2. 生成并应用：
```bash
make diff NAME=extend_task_title_length
make apply
```

**Atlas 会生成**：
```sql
ALTER TABLE "tasks" ALTER COLUMN "title" TYPE character varying(500);
```

---

### 示例 5：添加约束

**场景**：确保邮箱格式正确

**步骤**：

1. 编辑 `schema.sql`：
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- ... 其他字段 ...
    
    -- 约束
    CONSTRAINT users_email_not_empty CHECK (LENGTH(TRIM(email)) > 0),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')  -- ✨ 新增
);
```

2. 生成并应用：
```bash
make diff NAME=add_email_format_constraint
make apply
```

---

## 🐛 故障排查

### 问题 1：Atlas 未安装

**错误**：
```
atlas: command not found
```

**解决**：
```bash
# macOS
brew install ariga/tap/atlas

# Linux
curl -sSf https://atlasgo.sh | sh

# 验证
atlas version
```

---

### 问题 2：数据库连接失败

**错误**：
```
Error: dial tcp 127.0.0.1:5432: connect: connection refused
```

**解决**：
```bash
# 检查数据库是否运行
docker ps | grep postgres

# 如果没有运行，启动它
cd docker
docker-compose up -d postgres

# 等待启动完成
docker logs go-genai-postgres
```

---

### 问题 3：迁移冲突

**错误**：
```
Error: sql/migrate: checksum mismatch
```

**原因**：迁移文件被手动修改

**解决**：
```bash
# 重新生成校验和
make hash
```

---

### 问题 4：表依赖顺序错误

**错误**：
```
ERROR: relation "users" does not exist
```

**原因**：`tasks` 表引用了 `users`，但 `users` 定义在后面

**解决**：调整 `schema.sql` 中的表顺序

**正确顺序**：
```sql
-- 1. 函数定义
CREATE OR REPLACE FUNCTION update_updated_at_column() ...

-- 2. 被引用的表
CREATE TABLE users (...);

-- 3. 引用其他表的表
CREATE TABLE tasks (
    user_id UUID NOT NULL REFERENCES users(id)  -- ✅ users 已定义
);
```

---

### 问题 5：迁移文件目录不为空

**错误**：
```
❌ 错误：migrations/ 目录不为空
```

**原因**：运行 `make init` 时已有迁移文件

**解决**：
```bash
# 如果要重新开始，删除旧迁移
rm -rf migrations && mkdir migrations
make init
```

---

## 💎 最佳实践

### 1. 提交前验证

```bash
# 生成迁移后，先查看内容
make diff NAME=my_change
cat migrations/*my_change.sql

# 在测试数据库验证
make apply

# 确认无误后提交
git add migrations/
git commit -m "feat: add my_change migration"
```

---

### 2. 保持 Schema 整洁

✅ **推荐**：
```sql
-- 清晰的注释
-- users 表：存储用户账户信息
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,  -- 邮箱（唯一）
    -- ...
);

-- 索引分组
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- 注释
COMMENT ON TABLE users IS 'User accounts and profiles';
```

❌ **避免**：
```sql
CREATE TABLE users(id UUID PRIMARY KEY,email VARCHAR(255) UNIQUE NOT NULL); -- 难读
```

---

### 3. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 表名 | 复数、小写、下划线 | `users`, `task_tags` |
| 字段名 | 单数、小写、下划线 | `user_id`, `created_at` |
| 索引 | `idx_{表名}_{字段}` | `idx_users_email` |
| 约束 | `{表名}_{描述}` | `users_email_not_empty` |
| 迁移名 | 动词_描述 | `add_user_bio`, `create_posts_table` |

---

### 4. 添加注释

```sql
-- 表注释
COMMENT ON TABLE users IS 'User accounts and profiles';

-- 字段注释
COMMENT ON COLUMN users.email IS 'Email address (unique, case-insensitive)';
COMMENT ON COLUMN users.status IS 'User status: active, inactive, banned';
```

**好处**：
- ✅ 文档即代码
- ✅ 新成员快速理解
- ✅ AI 友好

---

### 5. 使用约束保护数据

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    
    -- 业务规则约束
    CONSTRAINT tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT tasks_due_date_after_created CHECK (due_date IS NULL OR due_date >= created_at)
);
```

**好处**：
- ✅ 数据库层面保证数据完整性
- ✅ 防止脏数据
- ✅ 清晰的业务规则

---

### 6. 定期检查迁移质量

```bash
# 检查迁移质量
make lint

# 验证迁移完整性
make validate
```

---

### 7. 备份重要操作

```bash
# 导出当前 schema
make inspect > backup_$(date +%Y%m%d).sql

# 导出数据
docker exec go-genai-postgres pg_dump -U genai go_genai_stack > data_backup_$(date +%Y%m%d).sql
```

---

## 🔍 查看数据库

### 方法 1：使用 Atlas

```bash
# 查看完整结构
make inspect

# 保存到文件
make inspect > current_schema.sql
```

---

### 方法 2：使用 Docker + psql

```bash
# 进入 psql
docker exec -it go-genai-postgres psql -U genai -d go_genai_stack

# 常用命令
\dt              # 列出所有表
\d users         # 查看 users 表结构
\dv              # 列出所有视图
\di              # 列出所有索引
\df              # 列出所有函数

# 查询数据
SELECT * FROM users LIMIT 10;

# 退出
\q
```

---

## 📚 核心概念

### 声明式 vs 命令式

**命令式（传统方式）**：
```sql
-- 001_up.sql
CREATE TABLE users (id UUID PRIMARY KEY);

-- 002_up.sql
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- 002_down.sql
ALTER TABLE users DROP COLUMN email;
```

❌ 需要维护 up/down 两套 SQL  
❌ 容易出错  
❌ 难以理解全貌

**声明式（Atlas 方式）**：
```sql
-- schema.sql（唯一数据源）
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255)  -- 直接描述最终状态
);
```

✅ 只维护目标状态  
✅ Atlas 自动生成迁移  
✅ 一目了然

---

### 文件结构

```
database/
├── schema.sql              ← 📝 唯一数据源（修改这个文件）
├── atlas.hcl               ← ⚙️  Atlas 配置
├── Makefile                ← 🛠️  简化命令
├── migrations/             ← 📦 自动生成的迁移文件
│   ├── 20241127_initial_schema.sql
│   ├── 20241127_add_user_bio.sql
│   └── atlas.sum           ← 🔐 校验和
├── seed/                   ← 🌱 演示/测试数据
│   └── 01_demo_tasks.sql
├── README.md               ← 📖 本文档
├── QUICK_START.md          ← ⚡ 快速指南
└── MIGRATION_GUIDE.md      ← 📋 迁移指南
```

---

## 🔗 相关资源

- [Atlas 官方文档](https://atlasgo.io/)
- [Atlas CLI 参考](https://atlasgo.io/cli-reference)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [快速指南](./QUICK_START.md) - 测试验证记录
- [迁移指南](./MIGRATION_GUIDE.md) - 从旧结构迁移

---

## 📞 获取帮助

### 常见问题

1. 运行 `make help` 查看所有命令
2. 查看 [故障排查](#-故障排查) 部分
3. 阅读 [QUICK_START.md](./QUICK_START.md)

### 遇到 Bug？

1. 检查 Atlas 版本：`atlas version`（应该是 v0.38.x）
2. 查看迁移状态：`make status`
3. 验证迁移文件：`make validate`
4. 查看数据库日志：`docker logs go-genai-postgres`

---

## ✨ 总结

### 记住三个步骤

```bash
1. vim schema.sql           # 修改目标状态
2. make diff NAME=xxx       # 生成迁移
3. make apply               # 应用迁移
```

### 核心优势

- 🎯 **简单** - 3 步完成修改
- 🤖 **自动** - Atlas 自动生成迁移
- 🔒 **安全** - 事务执行，失败回滚
- ⚡ **快速** - 毫秒级应用速度
- 📝 **清晰** - 单一数据源，易于理解
- 🤝 **AI 友好** - 声明式，易于生成代码

---

**项目**：Go-GenAI-Stack  
**维护者**：Backend Team  
**Atlas 版本**：v0.38.1 ✅  
**最后更新**：2024-11-27
