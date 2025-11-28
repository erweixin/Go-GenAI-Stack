# 共享 Schema 目录

这个目录包含所有 Docker 环境共享的数据库 Schema。

## 📁 文件说明

- **`schema.sql`**: 软链接到 `backend/database/schema.sql`

## 🎯 设计原则

### 单一数据源（Single Source of Truth）

所有 Docker 环境的数据库 Schema 都来自 `backend/database/schema.sql`：

- ✅ **统一管理**：Schema 只需在一处维护
- ✅ **自动同步**：通过软链接，Schema 更新自动生效
- ✅ **避免重复**：消除了多环境维护的成本

### 两阶段初始化

每个 Docker 环境使用两阶段初始化：

```yaml
volumes:
  # 阶段 1: 加载 Schema（共享）
  - ../schema/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
  
  # 阶段 2: 加载测试数据（环境独立）
  - ./seed-data.sql:/docker-entrypoint-initdb.d/02-seed-data.sql:ro
```

PostgreSQL 的 `docker-entrypoint-initdb.d` 会按文件名顺序执行：
1. 先执行 `01-schema.sql` 创建表结构
2. 再执行 `02-seed-data.sql` 插入测试数据

## 🔄 使用的环境

以下环境使用了共享 Schema：

| 环境 | Schema | 测试数据 |
|------|--------|----------|
| **backend-debug** | ✅ 共享 | `backend-debug/seed-data.sql` |
| **frontend-debug** | ✅ 共享 | `frontend-debug/seed-data.sql` |
| **e2e** | ✅ 共享 | `e2e/seed-data.sql` |

## 📝 维护指南

### 更新 Schema

Schema 更新只需在一处进行：

```bash
# 编辑 Schema
vim backend/database/schema.sql

# 使用 Atlas 生成迁移
cd backend/database
atlas schema diff --from "file://schema.sql" --to "postgres://..." --dev-url "docker://postgres"

# 重启环境以应用新 Schema
cd docker/backend-debug
./stop.sh --clean  # 清除旧数据
./start.sh         # 重新初始化
```

### 更新测试数据

每个环境的测试数据独立维护：

```bash
# Backend Debug 测试数据
vim docker/backend-debug/seed-data.sql

# Frontend Debug 测试数据
vim docker/frontend-debug/seed-data.sql

# E2E 测试数据
vim docker/e2e/seed-data.sql
```

### 验证软链接

```bash
# 检查软链接状态
ls -la docker/schema/

# 应该看到：
# lrwxr-xr-x  schema.sql -> ../../backend/database/schema.sql

# 验证文件可访问
cat docker/schema/schema.sql
```

## ⚠️ 注意事项

### 软链接的跨平台兼容性

- ✅ **macOS/Linux**: 原生支持软链接
- ⚠️ **Windows**: 
  - Git Bash: 支持
  - PowerShell: 需要管理员权限
  - 如果软链接不工作，可以改用硬拷贝

### 硬拷贝替代方案（可选）

如果软链接有问题，可以使用硬拷贝：

```bash
# 复制而不是链接
cp backend/database/schema.sql docker/schema/schema.sql

# 需要记得在更新 Schema 后重新复制
```

但这样会失去自动同步的优势。

## 🔍 故障排查

### 问题：容器启动失败，找不到 schema.sql

**检查**：
```bash
# 1. 验证软链接
ls -la docker/schema/schema.sql

# 2. 验证 Docker Compose 配置
docker compose -f docker/backend-debug/docker-compose.yml config
```

**解决**：
- 确保软链接指向正确的路径
- 确保 `backend/database/schema.sql` 存在
- 如果软链接不工作，改用硬拷贝

### 问题：Schema 更新后没有生效

**原因**：数据库已经初始化，不会重新执行初始化脚本

**解决**：
```bash
# 停止并清除数据
cd docker/backend-debug
./stop.sh --clean

# 重新启动（会重新执行初始化）
./start.sh
```

## 📚 相关文档

- [Backend Database 文档](../../backend/database/README.md)
- [Backend Debug 环境](../backend-debug/README.md)
- [Frontend Debug 环境](../frontend-debug/README.md)
- [E2E 环境](../e2e/README.md)

## 💡 最佳实践

1. **Schema 更新后测试所有环境**
   ```bash
   # 测试 Backend Debug
   cd docker/backend-debug && ./stop.sh --clean && ./start.sh
   
   # 测试 Frontend Debug
   cd docker/frontend-debug && ./stop.sh --clean && ./start.sh
   
   # 测试 E2E
   cd docker/e2e && ./stop.sh --clean && ./start.sh
   ```

2. **保持测试数据简洁**
   - 每个环境只包含必要的测试数据
   - 避免在 seed-data.sql 中重复定义 Schema

3. **定期清理和重建**
   - 开发过程中定期清理数据库
   - 确保 Schema 和数据保持一致

