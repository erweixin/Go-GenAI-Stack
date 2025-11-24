# Docker 开发环境

本目录包含 Go-GenAI-Stack 项目的 Docker 开发环境配置。

## 📁 文件说明

- **`docker-compose.yml`**: Docker Compose 配置文件，定义 PostgreSQL、Redis 和 pgAdmin 服务（仅基础设施）
- **`docker-compose-debug.yml`**: Debug 环境配置，包含后端服务，支持热重载和 Delve 调试
- **`env.example`**: 环境变量配置示例文件
- **`.env`**: 实际环境变量配置（从 env.example 复制，不提交到 Git）

## 🚀 快速开始

### 场景 1: 仅启动基础设施（推荐）

适用于本地开发，后端服务在宿主机运行。

```bash
# 1. 配置环境变量
cp docker/env.example docker/.env
vim docker/.env  # 修改密码等配置

# 2. 启动核心服务（PostgreSQL + Redis）
docker compose -f docker/docker-compose.yml up -d

# 3. 查看服务状态
docker compose -f docker/docker-compose.yml ps

# 4. 在宿主机运行后端
cd backend
go run cmd/server/main.go
```

### 场景 2: 启动完整调试环境

适用于容器内调试，支持热重载和 Delve 调试器。

```bash
# 1. 配置环境变量（同上）
cp docker/env.example docker/.env
vim docker/.env

# 2. 启动基础服务 + 后端服务
docker compose -f docker/docker-compose-debug.yml --profile debug up -d

# 3. 查看日志（实时查看后端输出）
docker compose -f docker/docker-compose-debug.yml logs -f backend

# 4. 访问应用
# API: http://localhost:8080
# Delve 调试端口: localhost:2345

# 5. 停止服务
docker compose -f docker/docker-compose-debug.yml --profile debug down
```

### 启动管理工具（可选）

```bash
# 启动 pgAdmin（数据库管理）
docker compose -f docker/docker-compose.yml --profile tools up -d pgadmin

# 访问 pgAdmin: http://localhost:5050
# 默认登录信息见 docker/.env 文件
```

### 场景 3: 启动完整可观测性栈（可选）

适用于需要完整监控的场景（开发/测试/生产模拟）。

```bash
# 1. 启动基础服务 + 可观测性服务
docker compose -f docker/docker-compose.yml --profile observability up -d

# 2. 配置应用启用 Tracing
vim docker/.env
# 设置：
# APP_MONITORING_TRACING_ENABLED=true
# APP_MONITORING_TRACING_ENDPOINT=localhost:4317

# 3. 启动后端应用
cd backend
go run cmd/server/main.go

# 4. 访问监控工具
# - Jaeger UI: http://localhost:16686  (分布式追踪)
# - Prometheus: http://localhost:9090  (指标查询)
# - Grafana:    http://localhost:3000  (可视化，admin/admin)

# 5. 查看应用指标
curl http://localhost:8080/metrics

# 6. 停止所有服务
docker compose -f docker/docker-compose.yml --profile observability down
```

### 停止服务

```bash
# 停止基础设施
docker compose -f docker/docker-compose.yml down

# 停止调试环境
docker compose -f docker/docker-compose-debug.yml --profile debug down

# 停止并删除数据卷（⚠️ 会删除所有数据）
docker compose -f docker/docker-compose.yml down -v
```

## 🔧 服务说明

### PostgreSQL

- **镜像**: `postgres:16-alpine`
- **端口**: `5432` (可通过 `DB_PORT` 环境变量修改)
- **数据持久化**: 
  - `postgres_data` (docker-compose.yml)
  - `postgres_debug_data` (docker-compose-debug.yml)
- **初始化脚本**: `backend/migrations/seed/` 目录下的 SQL 文件会在首次启动时自动执行
- **健康检查**: 每 10 秒检查一次，超时 5 秒，重试 5 次

**默认配置**:
- 用户名: `genai`
- 密码: `genai_password`
- 数据库: `go_genai_stack`

### Redis

- **镜像**: `redis:7-alpine`
- **端口**: `6379` (可通过 `REDIS_PORT` 环境变量修改)
- **数据持久化**: 
  - `redis_data` (docker-compose.yml)
  - `redis_debug_data` (docker-compose-debug.yml)
- **内存限制**: 256MB
- **淘汰策略**: `allkeys-lru` (最近最少使用)

**默认配置**:
- 密码: `redis_password`

### Backend (仅 docker-compose-debug.yml)

- **基础镜像**: `golang:1.21-alpine`
- **端口**: 
  - `8080` - HTTP API 端口
  - `2345` - Delve 调试端口
- **热重载**: 使用 [Air](https://github.com/cosmtrek/air) 监控代码变更
- **调试器**: 集成 [Delve](https://github.com/go-delve/delve) 远程调试
- **数据库连接**: 使用容器内网络（`postgres:5432`, `redis:6379`）

**特性**:
- ✅ 代码热重载（修改代码自动重启）
- ✅ Delve 远程调试支持
- ✅ 源码挂载（本地修改即时生效）
- ✅ Go 模块缓存（加速依赖下载）

**使用 VS Code 调试**:

1. 启动调试环境：
```bash
docker compose -f docker/docker-compose-debug.yml --profile debug up -d
```

2. 在 `.vscode/launch.json` 添加配置：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Docker",
      "type": "go",
      "request": "attach",
      "mode": "remote",
      "remotePath": "/app",
      "port": 2345,
      "host": "localhost"
    }
  ]
}
```

3. 在 VS Code 中按 F5 开始调试

### pgAdmin (可选)

- **镜像**: `dpage/pgadmin4:latest`
- **端口**: `5050` (可通过 `PGADMIN_PORT` 环境变量修改)
- **用途**: Web 界面管理 PostgreSQL
- **Profile**: `tools`

**默认配置**:
- 邮箱: `admin@genai.local`
- 密码: `admin_password`

**连接 PostgreSQL**:
1. 访问 http://localhost:5050
2. 登录后，右键 Servers → Register → Server
3. 填写连接信息：
   - Host: `postgres` (容器内网络) 或 `localhost` (宿主机)
   - Port: `5432`
   - Username: `genai`
   - Password: `genai_password`

### 可观测性服务（可选）

#### Jaeger - 分布式追踪

- **镜像**: `jaegertracing/all-in-one:latest`
- **端口**:
  - `4317` - OTLP gRPC (应用发送 traces)
  - `4318` - OTLP HTTP
  - `16686` - Jaeger UI (查看 traces)
- **用途**: 分布式链路追踪，查看请求在系统中的完整路径
- **Profile**: `observability`

**使用方式**:
1. 启动 Jaeger: `docker compose --profile observability up -d jaeger`
2. 配置应用: `APP_MONITORING_TRACING_ENABLED=true`
3. 访问 UI: http://localhost:16686
4. 选择 Service: `go-genai-stack`，点击 "Find Traces"

**查看示例**:
- 搜索最近的 traces
- 查看 Span 详情（耗时、标签、错误）
- 分析性能瓶颈

#### Prometheus - 指标收集

- **镜像**: `prom/prometheus:latest`
- **端口**: `9090` - Web UI
- **配置文件**: `docker/prometheus.yml`
- **用途**: 时序数据库，收集和查询指标
- **Profile**: `observability`

**使用方式**:
1. 启动 Prometheus: `docker compose --profile observability up -d prometheus`
2. 访问 UI: http://localhost:9090
3. 执行 PromQL 查询：
   ```promql
   # QPS（每秒请求数）
   rate(http_requests_total[1m])
   
   # P99 延迟
   histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
   
   # 错误率
   sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m]))
   ```

**配置文件说明**:
- `docker/prometheus.yml` - Prometheus 主配置
- 应用指标端点: `host.docker.internal:8080/metrics` (Mac/Windows)

#### Grafana - 可视化

- **镜像**: `grafana/grafana:latest`
- **端口**: `3000` - Web UI
- **用途**: 可视化 Dashboard，展示监控数据
- **Profile**: `observability`

**默认配置**:
- 用户名: `admin`
- 密码: `admin` (首次登录需修改)

**使用方式**:
1. 启动 Grafana: `docker compose --profile observability up -d grafana`
2. 访问 UI: http://localhost:3000
3. 添加 Prometheus 数据源：
   - Configuration → Data Sources → Add data source
   - 选择 Prometheus
   - URL: `http://prometheus:9090`
   - Save & Test
4. 导入 Dashboard：
   - Create → Import
   - 输入 Dashboard ID: `6671` (Go Processes)
   - 或使用自定义 Dashboard

**推荐 Dashboard**:
- **Go Processes** (ID: 6671) - Go 运行时指标
- **HTTP Metrics** - 自定义 HTTP 请求监控
- **System Metrics** - 系统资源监控

**快速启动**:
```bash
# 启动完整可观测性栈
docker compose --profile observability up -d

# 访问工具
open http://localhost:16686  # Jaeger
open http://localhost:9090   # Prometheus
open http://localhost:3000   # Grafana (admin/admin)
```

## 💡 使用技巧

### 从项目根目录启动

为了方便，可以在项目根目录添加别名或脚本：

```bash
# 方式 1: 使用别名
alias dc='docker compose -f docker/docker-compose.yml'

# 然后可以直接使用
dc up -d
dc ps
dc logs -f postgres

# 方式 2: 创建脚本（推荐）
# 见 scripts/docker.sh
```

### 连接到数据库容器

```bash
# 使用 psql 连接
docker compose -f docker/docker-compose.yml exec postgres psql -U genai -d go_genai_stack

# 使用 redis-cli 连接
docker compose -f docker/docker-compose.yml exec redis redis-cli -a redis_password
```

### 查看服务日志

```bash
# 查看所有服务日志
docker compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker compose -f docker/docker-compose.yml logs -f postgres
docker compose -f docker/docker-compose.yml logs -f redis
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker/docker-compose.yml restart

# 重启特定服务
docker compose -f docker/docker-compose.yml restart postgres
```

### 清理数据

```bash
# 方式 1: 仅停止容器（数据保留）
docker compose -f docker/docker-compose.yml stop

# 方式 2: 停止并删除容器（数据保留）
docker compose -f docker/docker-compose.yml down

# 方式 3: 停止、删除容器和数据卷（⚠️ 数据全部删除）
docker compose -f docker/docker-compose.yml down -v
```

## 🔒 安全注意事项

### 生产环境配置

⚠️ **本配置仅适用于本地开发环境**，生产环境请注意：

1. **修改默认密码**: 所有默认密码都必须修改为强密码
2. **启用 SSL**: PostgreSQL 的 `sslmode` 应改为 `require`
3. **限制端口暴露**: 生产环境不要直接暴露数据库端口
4. **使用 Docker Secrets**: 敏感信息应使用 Docker Secrets 管理
5. **网络隔离**: 使用独立的 Docker 网络，限制容器间通信

### 密码管理

```bash
# 生成强密码
openssl rand -base64 32

# 在 docker/.env 中设置
DB_PASSWORD=<生成的强密码>
REDIS_PASSWORD=<生成的强密码>
```

## 📊 监控和维护

### 查看资源占用

```bash
# 查看容器资源使用情况
docker stats go-genai-postgres go-genai-redis

# 查看数据卷大小
docker system df -v | grep -E 'postgres_data|redis_data'
```

### 数据备份

```bash
# 备份 PostgreSQL
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U genai go_genai_stack > backup_$(date +%Y%m%d).sql

# 备份 Redis
docker compose -f docker/docker-compose.yml exec redis \
  redis-cli -a redis_password --rdb /data/dump.rdb
```

### 数据恢复

```bash
# 恢复 PostgreSQL
cat backup_20250101.sql | docker compose -f docker/docker-compose.yml exec -T postgres \
  psql -U genai go_genai_stack

# 恢复 Redis
# Redis 的 dump.rdb 会自动加载
```

## 🐛 故障排查

### PostgreSQL 无法启动

```bash
# 检查日志
docker compose -f docker/docker-compose.yml logs postgres

# 常见问题：
# 1. 端口被占用 -> 修改 docker-compose.yml 中的端口映射
# 2. 权限问题 -> 删除 volume 重新创建
# 3. 数据损坏 -> docker compose down -v 后重新启动
```

### Redis 无法连接

```bash
# 检查 Redis 是否运行
docker compose -f docker/docker-compose.yml ps redis

# 测试连接
docker compose -f docker/docker-compose.yml exec redis redis-cli -a redis_password ping
# 期望输出: PONG
```

### 连接池耗尽

如果遇到"too many connections"错误：

```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看最大连接数
SHOW max_connections;

-- 终止空闲连接
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < now() - interval '5 minutes';
```

## 📖 相关文档

- [可观测性快速启动](../docs/Guides/observability-quickstart.md) - 监控和追踪配置
- [可观测性总览](../backend/infrastructure/monitoring/README.md) - 完整文档
- [数据库设置指南](../docs/database-setup.md) - 完整的数据库配置教程
- [主 README](../README.md) - 项目总览

## 🤝 贡献

如果发现配置问题或有改进建议，欢迎提交 Issue 或 Pull Request。

