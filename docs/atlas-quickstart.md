# Atlas 快速参考

> 📖 日常开发的快速命令参考

---

## 🚀 5 分钟上手

```bash
# 1. 安装 Atlas
brew install ariga/tap/atlas

# 2. 启动数据库
docker-compose up -d postgres

# 3. 应用 schema
cd backend
./scripts/schema.sh apply

# 4. 完成！
```

---

## 📋 常用命令

### 日常开发

```bash
# 修改 schema
vim infrastructure/database/schema/schema.sql

# 生成迁移
./scripts/schema.sh diff add_feature

# 应用迁移
./scripts/schema.sh apply

# 查看状态
./scripts/schema.sh status
```

### 检查和验证

```bash
# 验证 schema 语法
./scripts/schema.sh validate

# Lint（质量检查）
./scripts/schema.sh lint

# 检查当前数据库
./scripts/schema.sh inspect
```

### 清理和重置

```bash
# 清理数据库（开发环境）
./scripts/schema.sh clean

# 重新应用
./scripts/schema.sh apply
```

---

## 🎯 快速示例

### 添加新字段

```sql
-- infrastructure/database/schema/schema.sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    tags JSONB DEFAULT '[]',  -- 👈 新增这行
    created_at TIMESTAMPTZ NOT NULL
);
```

```bash
./scripts/schema.sh diff add_conversation_tags
./scripts/schema.sh apply
```

### 添加新表

```sql
-- infrastructure/database/schema/schema.sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
```

```bash
./scripts/schema.sh diff add_user_sessions
./scripts/schema.sh apply
```

### 添加索引

```sql
-- infrastructure/database/schema/schema.sql
CREATE INDEX idx_messages_conversation_created 
    ON messages(conversation_id, created_at DESC);
```

```bash
./scripts/schema.sh diff add_message_indexes
./scripts/schema.sh apply
```

---

## 🔧 环境变量

```bash
# 本地开发
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/go_genai_stack?sslmode=disable"
export ATLAS_ENV="local"

# 测试
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/go_genai_stack_test?sslmode=disable"
export ATLAS_ENV="test"

# 生产
export DATABASE_URL="<your-production-url>"
export ATLAS_ENV="prod"
```

---

## 🐛 常见问题

### Atlas 未找到

```bash
brew install ariga/tap/atlas
```

### 数据库连接失败

```bash
# 检查数据库是否运行
docker ps | grep postgres

# 启动数据库
docker-compose up -d postgres

# 测试连接
psql "$DATABASE_URL" -c "SELECT 1"
```

### 迁移失败

```bash
# 查看详细错误
./scripts/schema.sh status

# 检查 schema 语法
./scripts/schema.sh validate

# 如果需要，清理并重新开始
./scripts/schema.sh clean
./scripts/schema.sh apply
```

---

## 📚 更多信息

- 详细文档：[backend/infrastructure/database/README.md](../backend/infrastructure/database/README.md)
- 迁移指南：[atlas-migration-guide.md](./atlas-migration-guide.md)
- Atlas 官网：https://atlasgo.io/

---

**快速链接**：
- [Schema 文件](../backend/infrastructure/database/schema/schema.sql)
- [Atlas 配置](../backend/atlas.hcl)
- [迁移目录](../backend/migrations/atlas/)
- [种子数据](../backend/migrations/seed/)

