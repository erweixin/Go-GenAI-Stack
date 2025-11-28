# 后端调试环境（仅数据库）

后端调试环境专门为后端开发设计，只启动 PostgreSQL 数据库，方便在本地 IDE 中直接运行和调试后端代码。

## 📋 目录

- [快速开始](#快速开始)
- [环境说明](#环境说明)
- [使用方式](#使用方式)
- [数据库连接](#数据库连接)
- [测试数据](#测试数据)
- [常见问题](#常见问题)

## 🚀 快速开始

### 启动环境

```bash
# 方式 1: 使用启动脚本（推荐）
cd docker/backend-debug
./start.sh

# 方式 2: 使用 Docker Compose
cd docker/backend-debug && docker compose up -d
```

### 停止环境

```bash
# 方式 1: 使用停止脚本
cd docker/backend-debug
./stop.sh              # 保留数据
./stop.sh --clean      # 删除数据

# 方式 2: 使用 Docker Compose
cd docker/backend-debug && docker compose down
cd docker/backend-debug && docker compose down -v  # 删除数据
```

## 📦 环境说明

### 服务组成

- **Postgres**: PostgreSQL 15 数据库
  - 端口: `5435:5432`
  - 数据库: `go_genai_stack_backend_debug`
  - 用户: `postgres`
  - 密码: `postgres`

### 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|---------|---------|------|
| Postgres | 5432 | 5435 | 避免与其他环境冲突 |

### 容器命名

- `go-genai-stack-postgres-backend-debug`

## 💻 使用方式

### 1. 启动数据库环境

```bash
cd docker/backend-debug
./start.sh
```

### 2. 配置后端环境变量

在你的 IDE 或终端中设置以下环境变量：

```bash
export APP_DATABASE_HOST=localhost
export APP_DATABASE_PORT=5435
export APP_DATABASE_USER=postgres
export APP_DATABASE_PASSWORD=postgres
export APP_DATABASE_DATABASE=go_genai_stack_backend_debug
export APP_DATABASE_SSL_MODE=disable
export APP_JWT_SECRET=backend-debug-secret-key
```

或者创建 `.env` 文件：

```bash
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=5435
APP_DATABASE_USER=postgres
APP_DATABASE_PASSWORD=postgres
APP_DATABASE_DATABASE=go_genai_stack_backend_debug
APP_DATABASE_SSL_MODE=disable
APP_JWT_SECRET=backend-debug-secret-key
```

### 3. 运行后端代码

```bash
cd backend
go run cmd/server/main.go
```

### 4. 使用 IDE 调试

#### VS Code 配置

创建或编辑 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/backend/cmd/server",
      "env": {
        "APP_DATABASE_HOST": "localhost",
        "APP_DATABASE_PORT": "5435",
        "APP_DATABASE_USER": "postgres",
        "APP_DATABASE_PASSWORD": "postgres",
        "APP_DATABASE_DATABASE": "go_genai_stack_backend_debug",
        "APP_DATABASE_SSL_MODE": "disable",
        "APP_JWT_SECRET": "backend-debug-secret-key"
      }
    }
  ]
}
```

#### GoLand / IntelliJ IDEA 配置

1. 打开 Run/Debug Configurations
2. 添加 Go Build
3. 设置 Environment Variables:
   ```
   APP_DATABASE_HOST=localhost;
   APP_DATABASE_PORT=5435;
   APP_DATABASE_USER=postgres;
   APP_DATABASE_PASSWORD=postgres;
   APP_DATABASE_DATABASE=go_genai_stack_backend_debug;
   APP_DATABASE_SSL_MODE=disable;
   APP_JWT_SECRET=backend-debug-secret-key
   ```

## 🗄️ 数据库连接

### 连接信息

```
Host:     localhost
Port:     5435
Database: go_genai_stack_backend_debug
User:     postgres
Password: postgres
```

### 使用数据库工具连接

**DBeaver**:
```
URL: jdbc:postgresql://localhost:5435/go_genai_stack_backend_debug
```

**psql**:
```bash
psql -h localhost -p 5435 -U postgres -d go_genai_stack_backend_debug
```

**pgAdmin**:
- Host: localhost
- Port: 5435
- Maintenance database: go_genai_stack_backend_debug
- Username: postgres
- Password: postgres

### 在代码中连接

```go
connStr := "host=localhost port=5435 user=postgres password=postgres dbname=go_genai_stack_backend_debug sslmode=disable"
db, err := sql.Open("postgres", connStr)
```

## 👤 测试数据

环境启动时会自动加载数据库结构和测试数据：

### 测试用户

- **Email**: `backend-debug@example.com`
- **Password**: `Backend123456!`
- **用途**: 后端开发和测试

### 数据结构

数据库 schema 来自 `backend/database/schema.sql`（自动加载），测试数据来自 `seed-data.sql`：

**表结构**：
- `users` - 用户表
- `llm_models` - LLM 模型配置表
- `tasks` - 任务表

**数据加载顺序**：
1. `01-schema.sql` - 表结构（来自 backend/database/schema.sql）
2. `02-seed-data.sql` - 测试数据（本环境的 seed-data.sql）

## 🔍 常见操作

### 查看容器状态

```bash
cd docker/backend-debug && docker compose ps
```

### 查看日志

```bash
# 所有日志
cd docker/backend-debug && docker compose logs -f

# 只看 Postgres 日志
cd docker/backend-debug && docker compose logs -f postgres-backend-debug
```

### 重启数据库

```bash
cd docker/backend-debug && docker compose restart postgres-backend-debug
```

### 清空并重新初始化数据

```bash
# 停止并删除数据
cd docker/backend-debug
./stop.sh --clean

# 重新启动（会重新执行 schema.sql 和 seed-data.sql）
./start.sh
```

### 手动执行 SQL

```bash
# 连接到数据库
docker exec -it go-genai-stack-postgres-backend-debug psql -U postgres -d go_genai_stack_backend_debug

# 或者从文件执行
docker exec -i go-genai-stack-postgres-backend-debug psql -U postgres -d go_genai_stack_backend_debug < your_script.sql
```

## ❓ 常见问题

### 问题 1：端口 5435 被占用

**现象**：
```
Error starting userland proxy: listen tcp4 0.0.0.0:5435: bind: address already in use
```

**解决**：
```bash
# 停止占用端口的服务或修改 docker/backend-debug/docker-compose.yml 中的端口
# 例如改为 5436:5432
```

### 问题 2：数据库连接失败

**现象**：
```
connection refused
```

**解决**：
```bash
# 1. 检查容器是否运行
cd docker/backend-debug && docker compose ps

# 2. 检查健康状态
docker inspect go-genai-stack-postgres-backend-debug | grep Health -A 10

# 3. 查看日志
cd docker/backend-debug && docker compose logs postgres-backend-debug
```

### 问题 3：想要使用不同的测试数据

**解决**：

1. 编辑 `docker/backend-debug/seed-data.sql`
2. 重新初始化：
   ```bash
   cd docker/backend-debug
   ./stop.sh --clean
   ./start.sh
   ```

### 问题 4：Schema 更新后数据不一致

**说明**：Schema 由 `backend/database/schema.sql` 统一管理，更新后需要重新初始化。

**解决**：
```bash
# 清空旧数据，重新加载（会自动加载最新的 schema.sql）
cd docker/backend-debug
./stop.sh --clean
./start.sh
```

## 🔄 与其他环境的对比

| 环境 | 数据库 | 后端 | 端口 | 用途 |
|------|--------|------|------|------|
| **backend-debug** | ✅ | ❌ | 5435 | 后端开发（本地运行） |
| frontend-debug | ✅ | ✅ | 5434, 8082 | 前端开发 |
| e2e | ✅ | ✅ | 5433, 8081 | E2E 测试 |
| prod | ✅ | ✅ | 5432, 8080 | 生产环境 |

## 📚 相关文档

- [Docker 环境总览](../README.md)
- [前端调试环境](../frontend-debug/README.md)
- [E2E 测试环境](../e2e/README.md)
- [生产环境](../prod/README.md)

## 💡 提示

1. **数据持久化**：默认情况下，数据会持久化在 Docker volume 中
2. **性能优化**：如果不需要持久化，可以注释掉 `docker-compose.yml` 中的 volume 配置
3. **多人开发**：每个开发者可以使用自己的本地数据库实例，互不干扰
4. **Schema 同步**：定期使用 `./stop.sh --clean && ./start.sh` 确保 schema 与最新代码一致

