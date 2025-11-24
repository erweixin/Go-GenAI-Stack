# Docker 容器化部署指南

本指南介绍如何使用 Docker 部署 Go-GenAI-Stack。

---

## 📋 目录

- [快速开始](#快速开始)
- [架构说明](#架构说明)
- [手动部署](#手动部署)
- [环境变量配置](#环境变量配置)
- [生产环境部署](#生产环境部署)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 方式一：一键启动（推荐）

```bash
# 1. 启动基础服务（Backend + DB + Redis）
./docker/docker-up.sh

# 2. 启动完整服务（包含可观测性组件）
./docker/docker-up.sh --full

# 3. 重新构建镜像
./docker/docker-up.sh --rebuild
```

### 方式二：使用 Docker Compose

```bash
# 1. 进入 docker 目录
cd docker

# 2. 复制环境变量文件（如果不存在）
cp env.example .env

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f backend

# 5. 停止服务
docker-compose down
```

### 验证部署

```bash
# 健康检查
curl http://localhost:8080/health

# 查看 Metrics
curl http://localhost:8080/metrics

# 测试 API
curl http://localhost:8080/api/v1/tasks
```

---

## 🏗️ 架构说明

### 容器组成

本项目使用 Docker Compose 编排多个容器：

| 服务名 | 镜像 | 端口 | 说明 |
|--------|------|------|------|
| `backend` | go-genai-stack | 8080 | Go 后端服务 |
| `postgres` | postgres:16-alpine | 5432 | PostgreSQL 数据库 |
| `redis` | redis:7-alpine | 6379 | Redis 缓存 |
| `jaeger` | jaegertracing/all-in-one | 16686 | 分布式追踪（可选） |
| `prometheus` | prom/prometheus | 9090 | 指标收集（可选） |
| `grafana` | grafana/grafana | 3000 | 可视化（可选） |
| `pgadmin` | dpage/pgadmin4 | 5050 | 数据库管理（可选） |

### 网络拓扑

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│                      (genai-network)                         │
│                                                              │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐        │
│  │          │       │          │       │          │        │
│  │ Backend  │──────▶│ Postgres │       │  Redis   │        │
│  │  :8080   │       │  :5432   │       │  :6379   │        │
│  │          │       │          │       │          │        │
│  └────┬─────┘       └──────────┘       └──────────┘        │
│       │                                                      │
│       │             ┌──────────┐       ┌──────────┐        │
│       │             │          │       │          │        │
│       └────────────▶│  Jaeger  │       │Prometheus│        │
│                     │ :16686   │       │  :9090   │        │
│                     │          │       │          │        │
│                     └──────────┘       └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Dockerfile 设计

本项目使用 **多阶段构建**（Multi-stage Build）确保镜像体积小且安全：

```dockerfile
# Stage 1: Builder - 编译 Go 应用
FROM golang:1.23-alpine AS builder
# ... 编译代码 ...

# Stage 2: Runtime - 最小化运行时镜像
FROM alpine:3.19
# ... 只包含运行时依赖和二进制文件 ...
```

**优势**：
- ✅ 镜像体积小（~20MB vs ~800MB）
- ✅ 安全性高（不包含编译工具）
- ✅ 构建速度快（利用 Docker 缓存）

---

## 🛠️ 手动部署

### 1. 构建镜像

```bash
# 从项目根目录构建
docker build -t go-genai-stack:latest -f backend/Dockerfile .

# 或使用 Docker Compose 构建
cd docker
docker-compose build backend
```

### 2. 运行容器

```bash
# 仅运行后端（需要外部数据库）
docker run -d \
  -p 8080:8080 \
  --env-file docker/.env \
  --name go-genai-backend \
  go-genai-stack:latest

# 查看日志
docker logs -f go-genai-backend

# 进入容器
docker exec -it go-genai-backend sh

# 停止容器
docker stop go-genai-backend
docker rm go-genai-backend
```

### 3. 使用 Docker Compose（推荐）

```bash
cd docker

# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d backend postgres redis

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

---

## ⚙️ 环境变量配置

### 配置文件位置

- `docker/.env` - Docker Compose 使用的环境变量
- `docker/env.example` - 环境变量模板

### 关键配置

#### 服务器配置

```bash
APP_SERVER_HOST=0.0.0.0
APP_SERVER_PORT=8080
APP_SERVER_READ_TIMEOUT=10s
APP_SERVER_WRITE_TIMEOUT=10s
```

#### 数据库配置

```bash
# ⚠️ 容器内使用服务名作为 host
APP_DATABASE_HOST=postgres      # 容器内：postgres，宿主机：localhost
APP_DATABASE_PORT=5432
APP_DATABASE_USER=genai
APP_DATABASE_PASSWORD=genai_password
APP_DATABASE_DATABASE=go_genai_stack
APP_DATABASE_SSL_MODE=disable
```

#### Redis 配置

```bash
# ⚠️ 容器内使用服务名作为 host
APP_REDIS_HOST=redis            # 容器内：redis，宿主机：localhost
APP_REDIS_PORT=6379
APP_REDIS_PASSWORD=redis_password
```

#### 日志配置

```bash
APP_LOGGING_ENABLED=true
APP_LOGGING_LEVEL=info          # debug, info, warn, error
APP_LOGGING_FORMAT=json         # json（生产）, console（开发）
APP_LOGGING_OUTPUT=stdout       # stdout, stderr, file
```

#### 监控配置

```bash
APP_MONITORING_METRICS_ENABLED=true
APP_MONITORING_HEALTH_ENABLED=true
APP_MONITORING_TRACING_ENABLED=false
```

### 配置覆盖

Docker Compose 支持多种方式覆盖配置：

```bash
# 方式 1：修改 .env 文件
vim docker/.env

# 方式 2：命令行传递
docker-compose run -e APP_LOGGING_LEVEL=debug backend

# 方式 3：使用多个 compose 文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🚀 生产环境部署

### 1. 安全配置

#### 修改默认密码

```bash
# docker/.env
POSTGRES_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>
PGADMIN_PASSWORD=<强密码>
```

#### 启用 SSL/TLS

```bash
APP_DATABASE_SSL_MODE=require
```

#### 使用非 root 用户

Dockerfile 已配置为使用非 root 用户（`app:app`）：

```dockerfile
# 创建非 root 用户
RUN addgroup -g 1000 app && adduser -D -u 1000 -G app app

# 切换到非 root 用户
USER app
```

### 2. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. 持久化数据

确保数据卷持久化：

```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 4. 健康检查

所有服务都配置了健康检查：

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 5. 日志管理

#### 配置日志驱动

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 使用外部日志系统

```yaml
services:
  backend:
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://logstash:5000"
```

### 6. 生产环境 Compose 文件

创建 `docker/docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  backend:
    restart: always
    environment:
      APP_ENV: production
      APP_LOGGING_FORMAT: json
      APP_LOGGING_OUTPUT: file
      APP_MONITORING_TRACING_ENABLED: "true"
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

启动：

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🐛 常见问题

### Q1: 后端服务无法连接数据库

**问题**：`Failed to connect to database`

**解决方案**：

1. 检查数据库是否启动：
   ```bash
   docker-compose ps postgres
   ```

2. 检查数据库健康状态：
   ```bash
   docker-compose exec postgres pg_isready -U genai
   ```

3. 检查环境变量：
   ```bash
   docker-compose exec backend env | grep DATABASE
   ```

4. 确保使用容器名称作为 host：
   ```bash
   APP_DATABASE_HOST=postgres  # ✅ 正确
   APP_DATABASE_HOST=localhost # ❌ 错误（容器内无法解析）
   ```

### Q2: 端口冲突

**问题**：`Bind for 0.0.0.0:8080 failed: port is already allocated`

**解决方案**：

1. 修改端口映射：
   ```bash
   # docker/.env
   APP_SERVER_PORT=8081
   ```

2. 或停止占用端口的服务：
   ```bash
   lsof -ti:8080 | xargs kill -9
   ```

### Q3: 镜像构建失败

**问题**：`Failed to download dependencies`

**解决方案**：

1. 检查网络连接：
   ```bash
   docker build --network=host -t go-genai-stack:latest -f backend/Dockerfile .
   ```

2. 使用国内镜像源：
   ```dockerfile
   ENV GOPROXY=https://goproxy.cn,direct
   ```

3. 清理 Docker 缓存：
   ```bash
   docker builder prune -a
   ```

### Q4: 容器启动后立即退出

**问题**：容器状态为 `Exited (1)`

**解决方案**：

1. 查看日志：
   ```bash
   docker logs go-genai-backend
   ```

2. 检查配置错误：
   ```bash
   docker-compose config
   ```

3. 进入容器调试：
   ```bash
   docker run -it --entrypoint sh go-genai-stack:latest
   ```

### Q5: 健康检查失败

**问题**：容器状态显示 `unhealthy`

**解决方案**：

1. 检查健康检查端点：
   ```bash
   docker-compose exec backend wget -O- http://localhost:8080/health
   ```

2. 增加启动时间：
   ```yaml
   healthcheck:
     start_period: 60s  # 增加到 60 秒
   ```

3. 禁用健康检查调试：
   ```yaml
   healthcheck:
     disable: true
   ```

### Q6: 数据丢失

**问题**：停止容器后数据丢失

**解决方案**：

1. 确保使用命名卷：
   ```bash
   docker-compose down     # ✅ 保留数据
   docker-compose down -v  # ❌ 删除数据
   ```

2. 备份数据卷：
   ```bash
   docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
   ```

3. 恢复数据卷：
   ```bash
   docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
   ```

---

## 📚 相关文档

- [快速开始](../README.md#快速开始)
- [架构概览](../docs/Core/architecture-overview.md)
- [可观测性快速开始](./observability-quickstart.md)
- [数据库管理](./database.md)

---

## 🤝 需要帮助？

- 查看项目 [README](../README.md)
- 提交 [Issue](https://github.com/erweixin/go-genai-stack/issues)
- 阅读 [贡献指南](../CONTRIBUTING.md)

