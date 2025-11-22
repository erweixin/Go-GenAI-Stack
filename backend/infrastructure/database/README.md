# Database Management with Atlas

> 🗄️ 使用 Atlas 进行声明式数据库管理

---

## 📖 概述

本项目使用 [Atlas](https://atlasgo.io/) 进行数据库 schema 管理，采用**声明式**（Declarative）而非命令式（Imperative）方法。

### 为什么选择 Atlas？

- ✅ **Schema as Code**：数据库 schema 即代码，版本控制
- ✅ **声明式迁移**：只需描述目标状态，Atlas 自动生成迁移
- ✅ **类型安全**：可以从 Go structs 生成 schema
- ✅ **自动 Diff**：自动对比差异，生成最小化迁移
- ✅ **Schema Linting**：自动检查潜在问题
- ✅ **Vibe-Coding-Friendly**：与 usecases.yaml 理念一致

---

## 🚀 快速开始

### 1. 安装 Atlas

```bash
# macOS
brew install ariga/tap/atlas

# Linux
curl -sSf https://atlasgo.sh | sh

# Go
go install ariga.io/atlas/cmd/atlas@latest
```

### 2. 启动数据库

```bash
# 使用 Docker Compose
docker-compose up -d postgres

# 或直接启动 PostgreSQL
docker run -d \
  --name go-genai-stack-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=go_genai_stack \
  -p 5432:5432 \
  postgres:15
```

### 3. 应用初始 Schema

```bash
# 生成初始迁移
cd backend
./scripts/schema.sh diff initial_schema

# 应用迁移
./scripts/schema.sh apply
```

---

## 📁 目录结构

```
backend/
├── atlas.hcl                           # Atlas 配置文件
├── infrastructure/
│   └── database/
│       ├── README.md                   # 本文档
│       └── schema/
│           └── schema.sql              # 声明式 Schema（唯一数据源）
├── migrations/
│   ├── atlas/                          # Atlas 生成的迁移文件
│   │   ├── 20240101000000_initial_schema.sql
│   │   └── atlas.sum                   # 迁移校验和
│   └── seed/                           # 种子数据（初始化数据）
│       └── 01_initial_data.sql
└── scripts/
    └── schema.sh                       # Schema 管理脚本
```

---

## 🛠️ 工作流

### 修改 Schema

**声明式方式**：只需修改目标状态，Atlas 处理其余工作

```bash
# 1. 编辑 schema 文件
vim infrastructure/database/schema/schema.sql

# 2. 生成迁移（自动对比差异）
./scripts/schema.sh diff add_user_email

# 3. 检查生成的迁移
cat migrations/atlas/<timestamp>_add_user_email.sql

# 4. 应用迁移
./scripts/schema.sh apply
```

### 示例：添加新字段

**修改 schema.sql**：
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    tags JSONB DEFAULT '[]',  -- 新增字段
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
```

**生成迁移**：
```bash
./scripts/schema.sh diff add_conversation_tags
```

Atlas 自动生成：
```sql
-- add_conversation_tags.sql
ALTER TABLE conversations ADD COLUMN tags JSONB DEFAULT '[]';
```

### 查看状态

```bash
# 查看迁移状态
./scripts/schema.sh status

# 检查当前数据库 schema
./scripts/schema.sh inspect

# 检查 schema 质量
./scripts/schema.sh lint

# 验证 schema 文件
./scripts/schema.sh validate
```

---

## 🎯 常见场景

### 1. 添加新表

```sql
-- infrastructure/database/schema/schema.sql
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_table_name ON new_table(name);
```

```bash
./scripts/schema.sh diff add_new_table
./scripts/schema.sh apply
```

### 2. 修改表结构

```sql
-- 添加字段
ALTER TABLE conversations 
    ADD COLUMN description TEXT;

-- 修改字段类型
ALTER TABLE messages 
    ALTER COLUMN content TYPE TEXT;

-- 添加约束
ALTER TABLE conversations 
    ADD CONSTRAINT conversations_title_length 
    CHECK (LENGTH(title) <= 200);
```

```bash
./scripts/schema.sh diff update_table_structure
./scripts/schema.sh apply
```

### 3. 添加索引

```sql
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

```bash
./scripts/schema.sh diff add_indexes
./scripts/schema.sh apply
```

### 4. 创建物化视图

```sql
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_messages,
    SUM(tokens) as total_tokens,
    MAX(created_at) as last_message_at
FROM messages
GROUP BY user_id;

CREATE INDEX idx_user_statistics_user_id ON user_statistics(user_id);
```

```bash
./scripts/schema.sh diff add_user_statistics_view
./scripts/schema.sh apply
```

---

## 🔧 Atlas 配置

### 环境配置（atlas.hcl）

```hcl
env "local" {
  src = "file://infrastructure/database/schema"
  dev = "docker://postgres/15/dev?search_path=public"
  url = env("DATABASE_URL")
  
  migration {
    dir = "file://migrations/atlas"
  }
}

env "prod" {
  src = "file://infrastructure/database/schema"
  url = getenv("DATABASE_URL")
  
  migration {
    dir = "file://migrations/atlas"
    baseline = getenv("MIGRATION_BASELINE")
  }
  
  lint {
    destructive {
      error = true  // 生产环境禁止破坏性操作
    }
  }
}
```

### 使用不同环境

```bash
# 本地环境
ATLAS_ENV=local ./scripts/schema.sh apply

# 测试环境
ATLAS_ENV=test ./scripts/schema.sh apply

# 生产环境
ATLAS_ENV=prod ./scripts/schema.sh apply
```

---

## 🧪 测试环境

### 创建测试数据库

```bash
# 使用 Docker
docker run -d \
  --name go-genai-stack-test \
  -e POSTGRES_DB=go_genai_stack_test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:15

# 应用 schema
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/go_genai_stack_test?sslmode=disable" \
  ./scripts/schema.sh apply
```

### 在测试中使用

```go
func TestWithDatabase(t *testing.T) {
    // 设置测试数据库
    db := setupTestDB(t)
    defer db.Close()
    
    // 运行测试
    // ...
}
```

---

## 📊 Schema Linting

Atlas 自动检查常见问题：

```bash
./scripts/schema.sh lint
```

检查项包括：
- ✅ 缺少主键
- ✅ 缺少索引
- ✅ 数据类型不当
- ✅ 命名规范
- ✅ 破坏性变更

---

## 🔒 生产环境最佳实践

### 1. 使用 Baseline

首次在已有数据库上使用 Atlas：

```bash
atlas migrate hash --dir file://migrations/atlas
MIGRATION_BASELINE=<hash> ATLAS_ENV=prod ./scripts/schema.sh apply
```

### 2. Dry Run

先检查将要执行的 SQL：

```bash
atlas schema apply \
  --env prod \
  --url "$DATABASE_URL" \
  --to file://infrastructure/database/schema \
  --dry-run
```

### 3. 审批流程

在 CI/CD 中：
1. 生成迁移
2. 提交 PR
3. 人工审查
4. 自动应用（通过后）

---

## 🤖 AI 友好特性

### 1. 单一数据源

```
infrastructure/database/schema/schema.sql
↓
唯一的数据库定义
↓
AI 只需理解这个文件
```

### 2. 声明式

AI 提示：
> "在 conversations 表添加 tags 字段"

AI 只需修改 schema.sql，Atlas 自动生成迁移。

### 3. 自文档化

Schema 文件包含：
- 表结构
- 索引
- 约束
- 注释

全部信息在一处，AI 易于理解。

---

## 🆚 对比传统方式

### 传统方式（命令式）

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
❌ AI 需要理解多个文件

### Atlas 方式（声明式）

```sql
-- schema.sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255)  -- 直接添加
);
```

✅ 只需维护目标状态  
✅ 自动生成迁移  
✅ AI 只需理解一个文件

---

## 🔗 相关资源

- [Atlas 官方文档](https://atlasgo.io/)
- [Atlas CLI 参考](https://atlasgo.io/cli-reference)
- [声明式 vs 命令式](https://atlasgo.io/concepts/declarative-vs-versioned)
- [Schema Linting](https://atlasgo.io/lint/analyzers)

---

## 💡 提示

### Schema 设计原则

1. **显式优于隐式**：添加清晰的注释
2. **约束优于代码**：在数据库层面保证数据完整性
3. **索引优化**：为查询添加合适的索引
4. **命名规范**：使用一致的命名风格

### 常见问题

**Q: 如何回滚迁移？**  
A: Atlas 自动生成 down 迁移，可以安全回滚。

**Q: 如何处理数据迁移？**  
A: 使用 seed 文件或在迁移中添加 DATA 语句。

**Q: 多人协作如何处理冲突？**  
A: Schema 文件冲突时合并，然后重新生成迁移。

---

**最后更新**：2025-11-22  
**维护者**：Backend Team

