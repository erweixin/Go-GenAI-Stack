# Atlas 迁移完成指南

> 🎉 成功从 golang-migrate 迁移到 Atlas！

---

## ✅ 迁移完成

本项目已成功从 **golang-migrate**（命令式）迁移到 **Atlas**（声明式）数据库管理方案。

---

## 🆕 新的工作流

### Before (golang-migrate)

```bash
# 1. 手写 up 迁移
vim migrations/postgres/001_create_users.sql

# 2. 手写 down 迁移
vim migrations/postgres/001_create_users_down.sql

# 3. 应用
./scripts/migrate.sh up
```

❌ 需要维护两套 SQL  
❌ 容易出错  
❌ AI 需要理解多个文件

### After (Atlas)

```bash
# 1. 修改目标状态
vim infrastructure/database/schema/schema.sql

# 2. 生成迁移（自动）
./scripts/schema.sh diff add_users

# 3. 应用
./scripts/schema.sh apply
```

✅ 只维护一个 schema 文件  
✅ 自动生成迁移  
✅ AI 友好

---

## 📁 新的目录结构

```
backend/
├── atlas.hcl                           # Atlas 配置
├── infrastructure/
│   └── database/
│       ├── README.md                   # 详细文档
│       └── schema/
│           └── schema.sql              # 声明式 Schema（唯一数据源）
├── migrations/
│   ├── atlas/                          # Atlas 生成的迁移
│   │   └── (自动生成)
│   └── seed/                           # 种子数据
│       └── 01_initial_data.sql
└── scripts/
    └── schema.sh                       # Schema 管理脚本
```

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

### 2. 初始化数据库

```bash
cd backend

# 启动 PostgreSQL（如果还没启动）
docker-compose up -d postgres

# 生成初始迁移
./scripts/schema.sh diff initial_schema

# 应用迁移和种子数据
./scripts/schema.sh apply
```

### 3. 验证

```bash
# 查看状态
./scripts/schema.sh status

# 检查 schema
./scripts/schema.sh inspect
```

---

## 📖 常用命令

### Schema 管理

```bash
# 修改 schema 后生成迁移
./scripts/schema.sh diff <name>

# 应用迁移
./scripts/schema.sh apply

# 查看迁移状态
./scripts/schema.sh status

# 检查当前数据库 schema
./scripts/schema.sh inspect

# 验证 schema 文件
./scripts/schema.sh validate

# Lint schema（检查质量）
./scripts/schema.sh lint

# 清理开发数据库（谨慎！）
./scripts/schema.sh clean
```

### 日常开发

```bash
# 1. 修改 schema
vim infrastructure/database/schema/schema.sql

# 2. 生成迁移
./scripts/schema.sh diff my_change

# 3. 查看生成的 SQL
cat migrations/atlas/<timestamp>_my_change.sql

# 4. 应用
./scripts/schema.sh apply
```

---

## 🎯 Schema 设计原则

### 1. 单一数据源

**所有数据库定义都在这一个文件**：
```
infrastructure/database/schema/schema.sql
```

### 2. 声明式

只描述**目标状态**，不描述**过程**：

```sql
-- ✅ 好：描述最终状态
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- ❌ 避免：描述过程
-- ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

### 3. 完整的约束

在数据库层面保证数据完整性：

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    tokens INT NOT NULL DEFAULT 0,
    
    -- 约束
    CONSTRAINT messages_content_not_empty CHECK (LENGTH(content) > 0),
    CONSTRAINT messages_tokens_positive CHECK (tokens >= 0)
);
```

### 4. 有意义的索引

为查询优化添加索引：

```sql
-- 单列索引
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 复合索引
CREATE INDEX idx_user_conversations ON conversations(user_id, created_at DESC);

-- 条件索引
CREATE INDEX idx_active_conversations ON conversations(user_id) 
    WHERE deleted_at IS NULL;

-- GIN 索引（JSONB）
CREATE INDEX idx_messages_metadata ON messages USING GIN (metadata);
```

### 5. 清晰的注释

```sql
COMMENT ON TABLE messages IS 'Chat messages - stores individual messages in conversations';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.tokens IS 'Token count for this message';
```

---

## 🔧 环境配置

### 本地开发

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/go_genai_stack?sslmode=disable"
export ATLAS_ENV="local"
```

### 测试环境

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/go_genai_stack_test?sslmode=disable"
export ATLAS_ENV="test"
```

### 生产环境

```bash
export DATABASE_URL="<production-url>"
export ATLAS_ENV="prod"
```

---

## 🤖 AI 协作示例

### 场景 1：添加新字段

**Prompt**：
> "在 conversations 表添加 tags 字段，类型是 JSONB 数组，默认空数组"

**AI 修改**：
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    tags JSONB DEFAULT '[]',  -- 新增
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
```

**生成迁移**：
```bash
./scripts/schema.sh diff add_conversation_tags
```

### 场景 2：添加新表

**Prompt**：
> "创建 user_preferences 表，存储用户偏好设置"

**AI 生成**：
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    theme VARCHAR(50) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**生成迁移**：
```bash
./scripts/schema.sh diff add_user_preferences
```

### 场景 3：添加索引

**Prompt**：
> "为 messages 表的 conversation_id 和 created_at 添加复合索引，优化查询"

**AI 修改**：
```sql
CREATE INDEX idx_messages_conversation_created 
    ON messages(conversation_id, created_at DESC);
```

**生成迁移**：
```bash
./scripts/schema.sh diff add_message_indexes
```

---

## 🔒 生产环境注意事项

### 1. 破坏性操作保护

Atlas 会检测破坏性操作：
- DROP TABLE
- DROP COLUMN
- ALTER COLUMN TYPE（可能丢失数据）

在生产环境，这些操作会被阻止（通过 `atlas.hcl` 配置）。

### 2. 迁移审批流程

1. 开发人员修改 schema
2. 生成迁移
3. 提交 PR
4. CI/CD 自动检查
5. 人工审查迁移 SQL
6. 合并后自动部署

### 3. 回滚策略

Atlas 自动生成 down 迁移，但在生产环境：
- 优先使用**前滚**（forward fix）
- 避免数据丢失
- 必要时使用备份恢复

---

## 📊 CI/CD 集成

### GitHub Actions

新增工作流：
1. **test.yml** - 自动应用 schema 后运行测试
2. **validate.yml** - 验证 schema 格式和质量
3. **schema-check.yml** - PR 中的 schema 变更检查

### Schema 变更检查

当 PR 包含 schema 变更时：
- ✅ 自动 lint 检查
- ✅ 生成迁移预览
- ✅ 兼容性测试
- ✅ 自动评论提醒

---

## 🆚 对比总结

| 特性 | golang-migrate | Atlas |
|------|----------------|-------|
| 方式 | 命令式 | 声明式 ✅ |
| 维护文件 | up + down | 只需 schema ✅ |
| 自动生成迁移 | ❌ | ✅ |
| 类型安全 | ❌ | ✅ |
| Schema Lint | ❌ | ✅ |
| 自动回滚 | 手动编写 | 自动生成 ✅ |
| AI 友好性 | 中等 | 极高 ✅ |
| 学习曲线 | 低 | 中 |
| 社区支持 | 成熟 | 活跃 |

---

## 🎓 学习资源

### 官方文档
- [Atlas 官网](https://atlasgo.io/)
- [快速开始](https://atlasgo.io/getting-started)
- [CLI 参考](https://atlasgo.io/cli-reference)
- [Schema Linting](https://atlasgo.io/lint/analyzers)

### 示例和教程
- [Atlas Examples](https://github.com/ariga/atlas-examples)
- [声明式 vs 版本化](https://atlasgo.io/concepts/declarative-vs-versioned)
- [最佳实践](https://atlasgo.io/guides/testing)

### 项目文档
- [backend/infrastructure/database/README.md](../backend/infrastructure/database/README.md) - 详细使用指南

---

## 🐛 故障排除

### 问题 1：Atlas 命令未找到

```bash
# 重新安装
brew install ariga/tap/atlas

# 或
curl -sSf https://atlasgo.sh | sh
```

### 问题 2：数据库连接失败

```bash
# 检查环境变量
echo $DATABASE_URL

# 测试连接
psql "$DATABASE_URL" -c "SELECT 1"

# 启动 Docker 数据库
docker-compose up -d postgres
```

### 问题 3：迁移冲突

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新生成迁移
./scripts/schema.sh diff my_change

# 3. 解决冲突后应用
./scripts/schema.sh apply
```

### 问题 4：Schema 验证失败

```bash
# 检查语法
./scripts/schema.sh validate

# 查看详细错误
atlas schema validate \
  --env local \
  --dev-url "docker://postgres/15/dev"
```

---

## 💡 提示和技巧

### 1. 使用 Docker Dev Database

Atlas 推荐使用临时 Docker 数据库进行 diff：

```bash
# 自动启动和清理
--dev-url "docker://postgres/15/dev"
```

### 2. 迁移命名规范

使用描述性名称：

```bash
# ✅ 好
./scripts/schema.sh diff add_user_email_index
./scripts/schema.sh diff update_message_constraints

# ❌ 避免
./scripts/schema.sh diff update1
./scripts/schema.sh diff fix
```

### 3. 增量修改

每次只做一个逻辑变更：

```bash
# ✅ 好：分开两个迁移
./scripts/schema.sh diff add_users_table
./scripts/schema.sh diff add_user_indexes

# ❌ 避免：一个大迁移包含多个不相关变更
./scripts/schema.sh diff big_update
```

### 4. 定期 Lint

在提交前检查：

```bash
./scripts/schema.sh lint
```

---

## 🎉 迁移成功！

恭喜！你已经成功迁移到 Atlas。

### 下一步

1. ✅ 阅读 [backend/infrastructure/database/README.md](../backend/infrastructure/database/README.md)
2. ✅ 尝试修改 schema 并生成迁移
3. ✅ 查看 CI/CD 工作流
4. ✅ 开始使用 AI 辅助开发

### 反馈和支持

- 项目问题：提交 GitHub Issue
- Atlas 问题：[Atlas Discord](https://discord.gg/zZ6sWVg6NT)
- 文档改进：提交 PR

---

**最后更新**：2025-11-22  
**状态**：✅ 迁移完成  
**维护者**：Backend Team

