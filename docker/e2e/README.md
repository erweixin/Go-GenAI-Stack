# E2E 测试 Docker 环境

本目录包含 E2E 测试所需的 Docker 配置和脚本。

---

## 📁 目录结构

```
docker/e2e/
├── docker-compose.yml  # E2E 环境配置
├── seed-data.sql       # 测试数据（Schema 由 backend/database/schema.sql 统一管理）
├── start.sh            # 启动脚本
├── stop.sh             # 停止脚本
└── README.md         # 本文档
```

---

## 🚀 快速开始

### 1. 启动 E2E 环境

```bash
# 方式 1：使用启动脚本（推荐）
./docker/e2e/start.sh

# 方式 2：使用 Docker Compose
cd docker/e2e && docker compose up -d
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

### docker-compose.yml

包含四个服务：

#### 1. postgres-e2e（测试数据库）

- **镜像**: postgres:15-alpine
- **端口**: 5433（避免与开发环境冲突）
- **数据库**: go_genai_stack_e2e
- **凭据**: postgres/postgres
- **数据卷**: postgres-e2e-data
- **初始化**: 
  1. 自动加载 Schema (`backend/database/schema.sql`)
  2. 自动加载测试数据 (`seed-data.sql`)

#### 2. redis-e2e（Redis 缓存）

- **镜像**: redis:7-alpine
- **端口**: 6381（避免与开发环境冲突）
- **数据卷**: redis-e2e-data
- **用途**: Node.js 后端需要 Redis 支持
- **配置**: 
  - 禁用 RDB 持久化（`--save ""`）
  - 禁用 AOF 持久化（`--appendonly no`）
  - 最大内存：256MB
  - 淘汰策略：allkeys-lru
- **注意**: 已配置以减少内存 overcommit 警告

#### 3. backend-e2e（Go 后端服务）

- **构建**: backend/Dockerfile
- **端口**: 8081（映射到容器的 8080）
- **数据库**: postgres-e2e:5432
- **JWT Secret**: e2e-test-secret-key-for-testing-only
- **环境**: test
- **健康检查**: /health 端点

#### 4. backend-nodejs-e2e（Node.js 后端服务）

- **构建**: backend-nodejs/Dockerfile
- **端口**: 8082（映射到容器的 8080）
- **数据库**: postgres-e2e:5432
- **Redis**: redis-e2e:6379
- **JWT Secret**: e2e-test-secret-key-for-testing-only
- **健康检查**: /health 端点

---

## 🔧 故障排查

### Redis 内存 Overcommit 警告

如果看到以下警告：
```
WARNING Memory overcommit must be enabled!
```

**原因**：
- Redis 在低内存条件下进行后台保存或复制时可能会失败
- 需要启用 `vm.overcommit_memory = 1`

**解决方案**：
1. **E2E 测试环境**（已配置）：
   - 禁用 RDB 持久化（`--save ""`）
   - 禁用 AOF 持久化（`--appendonly no`）
   - 这样可以避免触发后台保存操作

2. **生产环境**：
   - 在宿主机上配置 `vm.overcommit_memory = 1`
   - 或在 Docker Compose 中使用 `sysctls`（需要特权模式）

**当前配置**（E2E 测试）：
```yaml
command: >
  redis-server
  --save ""
  --appendonly no
  --protected-mode no
  --maxmemory 256mb
  --maxmemory-policy allkeys-lru
```

这个配置会：
- ✅ 禁用持久化（E2E 测试不需要）
- ✅ 减少内存 overcommit 警告
- ✅ 设置内存限制和淘汰策略

### 服务启动失败

**检查服务状态**：
```bash
cd docker/e2e
docker compose ps
```

**查看日志**：
```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs postgres-e2e
docker compose logs redis-e2e
docker compose logs backend-e2e
docker compose logs backend-nodejs-e2e
```

**检查健康状态**：
```bash
docker inspect --format='{{.State.Health.Status}}' go-genai-stack-postgres-e2e
docker inspect --format='{{.State.Health.Status}}' go-genai-stack-redis-e2e
docker inspect --format='{{.State.Health.Status}}' go-genai-stack-backend-e2e
docker inspect --format='{{.State.Health.Status}}' go-genai-stack-backend-nodejs-e2e
```

### 端口冲突

如果遇到端口冲突：
- **PostgreSQL**: 默认使用 5433（开发环境使用 5432）
- **Redis**: 默认使用 6381（开发环境使用 6379）
- **Go Backend**: 默认使用 8081（开发环境使用 8080）
- **Node.js Backend**: 默认使用 8082（开发环境使用 8081）

---

## 📊 健康检查

所有服务都配置了健康检查：

| 服务 | 健康检查命令 | 间隔 | 超时 | 重试 |
|------|------------|------|------|------|
| postgres-e2e | `pg_isready -U postgres -d go_genai_stack_e2e` | 3s | 3s | 10 |
| redis-e2e | `redis-cli ping` | 3s | 3s | 10 |
| backend-e2e | `wget --quiet --tries=1 --spider http://localhost:8080/health` | 5s | 3s | 10 |
| backend-nodejs-e2e | `node -e "require('http').get('http://localhost:8080/health', ...)"` | 5s | 3s | 10 |

---

## 🔄 CI/CD 集成

在 GitHub Actions 中，E2E 测试会自动：
1. 启动所有服务
2. 等待服务健康检查通过
3. 运行 E2E 测试
4. 清理环境

**相关文件**：
- `.github/workflows/frontend-e2e.yml` - E2E 测试工作流

---

## 📚 相关文档

- [E2E 测试指南](../../frontend/web/doc/e2e-testing.md)
- [Docker 部署指南](../../docs/Guides/docker-deployment.md)
