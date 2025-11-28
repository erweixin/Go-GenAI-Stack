# 前端调试环境设置指南

为前端开发者提供的隔离后端环境，便于独立进行前端开发和调试。

## 📋 概述

**Debug 环境**是专门为前端开发设计的独立环境，提供：

✅ **隔离性** - 独立的后端和数据库，不影响开发环境  
✅ **便捷性** - 一键启动，自动初始化测试数据  
✅ **一致性** - 与 E2E 环境类似的架构，保证可靠性  
✅ **可重置** - 随时重置到初始状态

---

## 🎯 使用场景

### 适用场景

- ✅ 前端独立开发（无需启动本地后端）
- ✅ 前端调试（独立的测试数据）
- ✅ API 接口测试
- ✅ 快速原型开发

### 不适用场景

- ❌ 后端开发（使用开发环境）
- ❌ E2E 测试（使用 E2E 环境）
- ❌ 生产环境（使用生产部署）

---

## 🚀 快速开始

### 方法 1: 一键启动（推荐）

```bash
cd frontend/web
pnpm debug:dev
```

这会自动：
1. 启动后端和数据库
2. 等待服务就绪
3. 启动前端开发服务器（连接到 Debug 环境）

### 方法 2: 分步启动

```bash
# 1. 启动 Debug 环境
./docker/frontend-debug/start.sh

# 2. 启动前端（在新终端）
cd frontend/web
pnpm dev:debug
```

### 方法 3: Docker Compose

```bash
cd docker/debug && docker compose up -d
cd frontend/web
VITE_API_BASE_URL=http://localhost:8082 pnpm dev
```

---

## 📡 服务信息

| 服务 | 地址 | 端口 | 说明 |
|------|------|------|------|
| **Backend API** | http://localhost:8082 | 8082 | 后端 API 服务 |
| **PostgreSQL** | localhost:5434 | 5434 | 数据库服务 |
| **Health Check** | http://localhost:8082/health | - | 健康检查 |

### 测试账号

| 字段 | 值 |
|------|-----|
| Email | `debug@example.com` |
| Password | `Debug123456!` |

### 预置数据

- ✅ 1 个测试用户
- ✅ 4 个示例任务（不同状态和优先级）
- ✅ 完整的表结构和索引

---

## 🛠️ 常用命令

### package.json 脚本

```bash
# 前端开发相关
pnpm dev              # 连接到开发后端 (8080)
pnpm dev:debug        # 连接到调试后端 (8082)

# Debug 环境管理
pnpm debug:setup      # 启动调试环境
pnpm debug:teardown   # 停止调试环境
pnpm debug:clean      # 停止并清理数据
pnpm debug:dev        # 启动环境 + 运行前端
```

### Shell 脚本

```bash
# 启动环境
./docker/frontend-debug/start.sh

# 停止环境（保留数据）
./docker/frontend-debug/stop.sh

# 停止环境（清理数据）
./docker/frontend-debug/stop.sh --clean
```

### Docker Compose

```bash
# 启动
cd docker/debug && docker compose up -d

# 停止
cd docker/debug && docker compose down

# 停止并清理数据
cd docker/debug && docker compose down -v

# 查看日志
cd docker/frontend-debug && docker compose logs -f

# 重启服务
cd docker/frontend-debug && docker compose restart backend-debug
```

---

## 📊 数据库管理

### 连接信息

```bash
Host:     localhost
Port:     5434
Database: go_genai_stack_debug
User:     postgres
Password: postgres
```

### 使用 psql

```bash
psql -h localhost -p 5434 -U postgres -d go_genai_stack_debug
```

### 常用 SQL

```sql
-- 查看所有任务
SELECT * FROM tasks;

-- 查看所有用户
SELECT * FROM users;

-- 重置任务状态
UPDATE tasks SET status = 'pending', completed_at = NULL WHERE status = 'completed';
```

---

## 🔍 故障排查

### 1. 端口冲突

**问题**: `Error: Port 8082 is already in use`

**解决方案**:

```bash
# 检查端口占用
lsof -i :8082

# 停止占用端口的进程
kill -9 <PID>

# 或修改 docker/frontend-debug/docker-compose.yml 中的端口
```

### 2. 服务无法启动

**问题**: 服务启动失败或超时

**解决方案**:

```bash
# 查看详细日志
cd docker/debug && docker compose logs

# 清理并重新启动
./docker/frontend-debug/stop.sh --clean
./docker/frontend-debug/start.sh
```

### 3. 数据库连接失败

**问题**: `Connection refused` 或 `Connection timeout`

**解决方案**:

```bash
# 检查容器状态
cd docker/frontend-debug && docker compose ps

# 查看健康检查状态
docker inspect go-genai-stack-postgres-debug --format='{{.State.Health.Status}}'

# 查看数据库日志
cd docker/debug && docker compose logs postgres-debug
```

### 4. 后端 API 502/503

**问题**: API 返回 502 Bad Gateway 或 503 Service Unavailable

**解决方案**:

```bash
# 检查后端健康状态
curl http://localhost:8082/health

# 查看后端日志
cd docker/debug && docker compose logs backend-debug

# 重启后端
cd docker/frontend-debug && docker compose restart backend-debug
```

---

## 🔄 数据重置

### 为什么需要重置？

- 测试数据被污染
- 需要恢复到初始状态
- 数据库结构变更

### 如何重置？

```bash
# 方法 1: 使用脚本（推荐）
./docker/frontend-debug/stop.sh --clean
./docker/frontend-debug/start.sh

# 方法 2: 使用 npm 脚本
cd frontend/web
pnpm debug:clean
pnpm debug:setup

# 方法 3: 手动清理
cd docker/debug && docker compose down -v
cd docker/debug && docker compose up -d
```

---

## 📈 与其他环境的对比

| 特性 | 开发环境 | Debug 环境 | E2E 环境 |
|------|---------|-----------|---------|
| **用途** | 后端开发 | 前端开发 | E2E 测试 |
| **Backend 端口** | 8080 | 8082 | 8081 |
| **DB 端口** | 5432 | 5434 | 5433 |
| **数据管理** | 手动 | 示例数据 | 测试数据 |
| **数据持久化** | ✅ | ✅ | ✅ |
| **快速重置** | ❌ | ✅ | ✅ |

---

## 💡 最佳实践

### 1. 隔离开发

- ✅ 前端开发**始终使用** Debug 环境
- ✅ 避免污染开发环境的数据
- ✅ 保持开发和测试数据分离

### 2. 定期重置

```bash
# 建议每天或每个功能开发前重置
./docker/frontend-debug/stop.sh --clean
./docker/frontend-debug/start.sh
```

### 3. 日志查看

```bash
# 遇到问题时，先查看日志
cd docker/frontend-debug && docker compose logs -f backend-debug
```

### 4. 端口管理

- ✅ Debug: 8082 (前端开发)
- ✅ E2E: 8081 (E2E 测试)
- ✅ Dev: 8080 (后端开发)

### 5. 数据管理

- ✅ 使用 `--clean` 重置数据
- ✅ 不要在 Debug 环境存储重要数据
- ✅ 定期检查数据是否符合预期

---

## 🔧 高级用法

### 自定义种子数据

编辑 `docker/frontend-debug/seed-data.sql`，添加你需要的测试数据：

```sql
-- 添加更多测试用户
INSERT INTO users (email, username, full_name, password_hash, email_verified)
VALUES ('custom@example.com', 'customuser', 'Custom User', '$2a$10$...', TRUE);

-- 添加更多测试任务
INSERT INTO tasks (user_id, title, description, status, priority)
VALUES ('user-uuid', 'Custom Task', 'Description', 'pending', 'high');
```

### 修改端口映射

编辑 `docker/frontend-debug/docker-compose.yml`：

```yaml
services:
  backend-debug:
    ports:
      - "8083:8080"  # 改为 8083
  postgres-debug:
    ports:
      - "5435:5432"  # 改为 5435
```

### 环境变量配置

```bash
# 在 frontend/web/.env.local 中添加
VITE_API_BASE_URL=http://localhost:8082
VITE_DEBUG_MODE=true
```

---

## 📚 相关文档

- [E2E 测试环境](../docker/e2e/README.md)
- [前端开发指南](../frontend/web/README.md)
- [单元测试指南](../frontend/web/doc/unit-testing.md)
- [E2E 测试指南](../frontend/web/doc/e2e-testing.md)

---

## ❓ 常见问题

### Q: Debug 环境和开发环境有什么区别？

A: Debug 环境是隔离的，专为前端开发设计，有独立的端口和预置数据。开发环境用于后端开发，数据手动管理。

### Q: 可以同时启动多个环境吗？

A: 可以！Debug (8082)、E2E (8081)、Dev (8080) 使用不同端口，可以同时运行。

### Q: 数据会持久化吗？

A: 是的，数据存储在 Docker volume 中，重启容器不会丢失。使用 `--clean` 才会删除。

### Q: 如何调试后端 API？

A: 可以使用浏览器开发者工具、Postman 或 curl 访问 `http://localhost:8082`。

### Q: 可以修改测试数据吗？

A: 可以！直接连接数据库修改，或编辑 `seed-data.sql` 后重新启动。

---

**维护者**: Frontend Team  
**最后更新**: 2025-11-28  
**版本**: 1.0.0

