# E2E 测试 Docker 环境

本目录包含 E2E 测试所需的 Docker 配置和脚本。

---

## 📁 目录结构

```
docker/e2e/
├── seed.sql          # 测试数据种子文件
├── start.sh          # 启动脚本
├── stop.sh           # 停止脚本
└── README.md         # 本文档
```

---

## 🚀 快速开始

### 1. 启动 E2E 环境

```bash
# 方式 1：使用启动脚本（推荐）
./docker/e2e/start.sh

# 方式 2：使用 Docker Compose
docker-compose -f docker/docker-compose-e2e.yml up -d
```

### 2. 运行 E2E 测试

```bash
cd frontend/web
pnpm e2e              # 运行所有测试
pnpm e2e:ui           # UI 模式（推荐）
```

### 3. 停止 E2E 环境

```bash
# 停止但保留数据
./docker/e2e/stop.sh

# 停止并清理所有数据
./docker/e2e/stop.sh --clean
```

---

## 🐳 服务配置

### docker-compose-e2e.yml

包含两个服务：

#### 1. postgres-e2e（测试数据库）

- **镜像**: postgres:15-alpine
- **端口**: 5433（避免与开发环境冲突）
- **数据库**: go_genai_stack_e2e
- **凭据**: postgres/postgres
- **数据卷**: postgres-e2e-data
- **初始化**: 自动执行 seed.sql

#### 2. backend-e2e（后端服务）

- **构建**: backend/Dockerfile
- **端口**: 8081（映射到容器的 8080）
- **数据库**: postgres-e2e:5432
- **JWT Secret**: e2e-test-secret-key-for-testing-only
- **环境**: test
- **健康检查**: /ping 端点

---

## 📊 测试数据

### seed.sql

自动创建：

1. **表结构**
   - users（用户表）
   - tasks（任务表）
   - task_tags（任务标签表）

2. **测试用户**
   - Email: `e2e-test@example.com`
   - Password: `Test123456!`
   - 自动创建，预验证

3. **示例任务**
   - 一个预置任务用于测试列表

---

## 🔧 脚本说明

### start.sh

**功能**：
- ✅ 检查 Docker 是否运行
- ✅ 启动 Docker Compose 服务
- ✅ 等待服务健康检查通过
- ✅ 显示服务信息和测试凭据

**输出示例**：

```
✅ E2E Test Environment is Ready!

📋 Service Information:
  ┌─────────────────────────────────────────────┐
  │ Service   │ URL / Connection                │
  ├───────────┼─────────────────────────────────┤
  │ Postgres  │ localhost:5433                  │
  │ Backend   │ http://localhost:8081           │
  │ Frontend  │ http://localhost:5173 (Host)    │
  └─────────────────────────────────────────────┘

👤 Test User Credentials:
  Email:    e2e-test@example.com
  Password: Test123456!
```

### stop.sh

**功能**：
- ✅ 停止所有服务
- ✅ 可选：清理数据卷

**参数**：
- 无参数：停止服务但保留数据
- `--clean`：停止服务并删除所有数据

---

## 🌐 网络配置

### 端口映射

| 服务 | 容器端口 | 主机端口 | 说明 |
|------|---------|---------|------|
| Postgres | 5432 | 5433 | 避免与开发环境冲突 |
| Backend | 8080 | 8081 | 避免与开发环境冲突 |
| Frontend | - | 5173 | 在 Host 运行 |

### 网络

- **网络名**: go-genai-stack-e2e-network
- **驱动**: bridge
- **内部通信**: 服务间通过容器名访问

---

## 🔍 调试和故障排查

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker/docker-compose-e2e.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose-e2e.yml logs -f postgres-e2e
docker-compose -f docker/docker-compose-e2e.yml logs -f backend-e2e
```

### 检查服务状态

```bash
docker-compose -f docker/docker-compose-e2e.yml ps
```

### 进入容器

```bash
# 进入 Postgres 容器
docker exec -it go-genai-stack-postgres-e2e psql -U postgres -d go_genai_stack_e2e

# 进入 Backend 容器
docker exec -it go-genai-stack-backend-e2e sh
```

### 手动测试后端

```bash
# 健康检查
curl http://localhost:8081/ping

# 登录测试
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-test@example.com","password":"Test123456!"}'
```

### 常见问题

#### 问题 1：端口已被占用

**错误**：`port is already allocated`

**解决**：
```bash
# 检查端口占用
lsof -i :5433
lsof -i :8081

# 停止占用端口的服务或修改 docker-compose-e2e.yml 中的端口
```

#### 问题 2：服务启动失败

**解决**：
```bash
# 查看日志
docker-compose -f docker/docker-compose-e2e.yml logs

# 重新构建并启动
docker-compose -f docker/docker-compose-e2e.yml up -d --build
```

#### 问题 3：数据库连接失败

**解决**：
```bash
# 检查 Postgres 健康状态
docker-compose -f docker/docker-compose-e2e.yml ps postgres-e2e

# 手动连接测试
docker exec -it go-genai-stack-postgres-e2e psql -U postgres -d go_genai_stack_e2e -c "SELECT 1"
```

---

## 🧹 清理

### 完全清理

```bash
# 停止服务并删除数据卷
./docker/e2e/stop.sh --clean

# 或使用 Docker Compose
docker-compose -f docker/docker-compose-e2e.yml down -v

# 清理未使用的镜像
docker image prune -f
```

---

## ⚙️ 高级配置

### 修改测试数据

编辑 `seed.sql` 文件，然后：

```bash
# 重新创建环境
./docker/e2e/stop.sh --clean
./docker/e2e/start.sh
```

### 修改后端配置

编辑 `docker-compose-e2e.yml` 中的环境变量，然后重启：

```bash
docker-compose -f docker/docker-compose-e2e.yml restart backend-e2e
```

### 使用自定义环境变量

创建 `.env.e2e` 文件（在项目根目录）：

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5433/go_genai_stack_e2e?sslmode=disable
BACKEND_URL=http://localhost:8081
```

---

## 📚 相关文档

- [E2E 测试文档](../../frontend/web/e2e/README.md)
- [E2E 测试方案](../../docs/FRONTEND_E2E_PLAN.md)
- [E2E 完成报告](../../docs/FRONTEND_E2E_COMPLETE.md)

---

**维护者**: AI Assistant  
**最后更新**: 2025-11-27

