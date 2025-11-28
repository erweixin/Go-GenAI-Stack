# Go-GenAI-Stack 生产环境部署指南

本目录包含 Go-GenAI-Stack 生产环境的完整 Docker Compose 配置和部署脚本。

## 📁 目录结构

```
docker/prod/
├── docker-compose.yml       # 生产环境 Docker Compose 配置（独立）
├── env.example              # 环境变量配置模板
├── prometheus.yml           # Prometheus 监控配置
├── grafana-datasources.yml  # Grafana 数据源配置
├── init-db.sql              # 数据库初始化脚本
├── start.sh                 # 启动脚本
├── stop.sh                  # 停止脚本
└── README.md                # 本文档
```

## 🚀 快速开始

### 1. 准备环境

**系统要求**:
- Docker Engine 20.10+
- Docker Compose V2
- 最小 4GB RAM，推荐 8GB+
- 最小 20GB 磁盘空间

**检查环境**:
```bash
docker --version
docker compose version
```

### 2. 配置环境变量

**🎯 极简配置 - 只需 5 分钟**：

```bash
cd docker/prod
cp env.example .env
vim .env  # 只需修改 4 个密码！
```

**💡 快速配置指南**：

1. 打开 `.env` 文件
2. 修改所有 `CHANGE_ME` 开头的值（共 4 个）
3. 保存并退出

**生成安全密钥**：
```bash
# JWT Secret (32 字符)
openssl rand -base64 32

# 密码 (24 字符)
openssl rand -base64 24
```

**验证配置** (推荐):
```bash
./validate-config.sh
```

验证脚本会检查：
- ✅ 4 个必需密码是否已设置
- ✅ 密码强度（建议 16+ 字符）
- ✅ SSL/TLS 是否启用
- ✅ 日志级别是否适合生产环境
- ✅ 环境标识是否为 production

**✅ 极简配置 - 只需修改 4 个密码**:

本配置采用**"约定优于配置"**原则，只需填写必需的密码即可启动。

```bash
# 🔐 必须修改的 4 个密码
POSTGRES_PASSWORD=your_strong_password_here
REDIS_PASSWORD=your_redis_password_here
APP_JWT_SECRET=your_jwt_secret_key_here
GRAFANA_PASSWORD=your_grafana_password_here
```

其他配置已有合理的默认值，无需修改。

**📊 核心开关配置** (可选):

```bash
APP_ENV=production                      # 环境标识
APP_DATABASE_SSL_MODE=require           # 数据库 SSL（生产必需）
APP_LOGGING_LEVEL=info                  # 日志级别
APP_MONITORING_TRACING_ENABLED=true     # 分布式追踪
APP_MONITORING_SAMPLE_RATE=0.1          # 追踪采样率
```

**🌐 服务端口配置** (可选):

```bash
VERSION=v1.0.0                          # 版本标识
APP_PORT=8080                           # 后端 API 端口
PROMETHEUS_PORT=9090                    # Prometheus 端口
GRAFANA_PORT=3000                       # Grafana 端口
GRAFANA_USER=admin                      # Grafana 用户名
JAEGER_UI_PORT=16686                    # Jaeger UI 端口
```

**⚙️ 高级配置** (可选):

如需自定义默认值，可在 `.env` 中添加以下配置：

```bash
# 数据库连接池
APP_DATABASE_MAX_OPEN_CONNS=50
APP_DATABASE_MAX_IDLE_CONNS=10

# Redis 连接池
APP_REDIS_POOL_SIZE=20
APP_REDIS_MIN_IDLE_CONNS=10

# 服务器超时
APP_SERVER_READ_TIMEOUT=60s
APP_SERVER_WRITE_TIMEOUT=60s

# 日志详细配置
APP_LOGGING_FORMAT=json
APP_LOGGING_MAX_SIZE=200

# LLM 配置
APP_LLM_PROVIDERS_OPENAI=sk-...
APP_LLM_DEFAULT_MODEL=gpt-4o
```

完整配置列表请参考 `docker-compose.yml` 的 `environment` 部分。

**生成安全密钥**:

```bash
# 生成 JWT Secret
openssl rand -base64 32

# 生成数据库密码
openssl rand -base64 24

# 生成 Redis 密码
openssl rand -base64 24
```

### 3. 启动服务

```bash
./start.sh
```

启动脚本会自动：
1. 检查 Docker 环境
2. **运行配置验证** (`validate-config.sh`)
3. 拉取和构建镜像
4. 启动所有服务
5. 等待健康检查通过
6. 显示服务状态和访问地址

### 4. 验证部署

**检查服务状态**:
```bash
docker compose ps
```

**访问服务**:
- 🌐 **Backend API**: http://localhost:8080
  - Health Check: http://localhost:8080/health
  - Metrics: http://localhost:8080/metrics
  
- 📊 **Grafana**: http://localhost:3000
  - 默认用户名: admin
  - 密码: 在 .env 中设置的 GRAFANA_PASSWORD
  
- 📈 **Prometheus**: http://localhost:9090
  
- 🔍 **Jaeger UI**: http://localhost:16686

### 5. 停止服务

**保留数据停止**:
```bash
./stop.sh
```

**停止并清理所有数据**:
```bash
./stop.sh --clean
```

## 📊 服务架构

```
┌─────────────────────────────────────────────────────┐
│                  生产环境架构                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │  Backend │────▶│ Postgres │     │  Redis   │   │
│  │   :8080  │     │  (内部)  │     │  (内部)  │   │
│  └─────┬────┘     └──────────┘     └──────────┘   │
│        │                                            │
│        │ Metrics                                    │
│        ▼                                            │
│  ┌──────────────┐       ┌──────────────┐          │
│  │  Prometheus  │◀─────▶│   Grafana    │          │
│  │    :9090     │       │    :3000     │          │
│  └──────────────┘       └──────────────┘          │
│                                                     │
│  ┌──────────────┐                                  │
│  │   Jaeger     │  (分布式追踪)                     │
│  │   :16686     │                                  │
│  └──────────────┘                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔧 服务配置详解

### 后端服务 (Backend)

**端口**: 8080  
**副本数**: 1 (可扩展)  
**资源限制**:
- CPU: 0.5-2 cores
- Memory: 512MB-2GB

**环境变量**:
```yaml
APP_ENV: production
APP_LOGGING_FORMAT: json
APP_LOGGING_LEVEL: info
APP_MONITORING_TRACING_ENABLED: true
```

**健康检查**:
- 路径: `/health`
- 间隔: 30s
- 超时: 10s
- 重试: 3 次

### PostgreSQL 数据库

**镜像**: postgres:16-alpine  
**端口**: 内部使用 (不对外暴露)  
**数据持久化**: postgres-prod-data volume

**性能优化配置**:
- shared_buffers: 256MB
- max_connections: 100
- work_mem: 16MB
- effective_cache_size: 1GB
- max_wal_size: 4GB

**健康检查**:
- 命令: `pg_isready`
- 间隔: 10s

### Redis 缓存

**镜像**: redis:7-alpine  
**端口**: 内部使用 (不对外暴露)  
**数据持久化**: redis-prod-data volume

**配置**:
- 最大内存: 512MB
- 淘汰策略: allkeys-lru
- 持久化: AOF + RDB
- 密码保护: 必需

### Prometheus 监控

**镜像**: prom/prometheus:latest  
**端口**: 9090  
**数据持久化**: prometheus-prod-data volume  
**保留时间**: 30 天

**抓取目标**:
- Backend API (每 15s)
- Prometheus 自身

### Grafana 可视化

**镜像**: grafana/grafana:latest  
**端口**: 3000  
**数据持久化**: grafana-prod-data volume

**预配置数据源**:
- Prometheus (默认)
- Jaeger (追踪)

### Jaeger 追踪

**镜像**: jaegertracing/all-in-one:latest  
**端口**:
- 4317: OTLP gRPC
- 4318: OTLP HTTP
- 16686: UI

**存储**: badger (本地持久化)

## 📋 日常运维

### 查看日志

**查看所有服务日志**:
```bash
docker compose logs -f
```

**查看特定服务日志**:
```bash
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

**查看最近 100 行日志**:
```bash
docker compose logs --tail=100 backend
```

### 扩展服务

**扩展后端服务**:
```bash
docker compose up -d --scale backend=3
```

> ⚠️ 注意: 扩展服务需要配置负载均衡器

### 更新服务

**零停机更新后端**:
```bash
# 1. 拉取新镜像
docker compose pull backend

# 2. 更新服务（不影响其他服务）
docker compose up -d --no-deps backend
```

**更新所有服务**:
```bash
docker compose pull
docker compose up -d
```

### 重启服务

**重启单个服务**:
```bash
docker compose restart backend
```

**重启所有服务**:
```bash
docker compose restart
```

## 💾 数据备份与恢复

### 数据库备份

**手动备份**:
```bash
# 备份到文件
docker exec go-genai-stack-postgres-prod pg_dump \
  -U genai \
  -d go_genai_stack \
  -F custom \
  -f /tmp/backup.dump

# 复制到宿主机
docker cp go-genai-stack-postgres-prod:/tmp/backup.dump ./backup-$(date +%Y%m%d).dump
```

**自动备份脚本** (crontab):
```bash
#!/bin/bash
# 保存为 backup.sh
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.dump"

mkdir -p $BACKUP_DIR

docker exec go-genai-stack-postgres-prod pg_dump \
  -U genai \
  -d go_genai_stack \
  -F custom \
  -f /tmp/backup.dump

docker cp go-genai-stack-postgres-prod:/tmp/backup.dump $BACKUP_FILE

# 压缩
gzip $BACKUP_FILE

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.dump.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**添加到 crontab**:
```bash
# 每天凌晨 2 点执行备份
0 2 * * * /path/to/backup.sh >> /var/log/pg_backup.log 2>&1
```

### 数据库恢复

**从备份恢复**:
```bash
# 1. 停止后端服务
docker compose stop backend

# 2. 复制备份文件到容器
docker cp backup-20240101.dump go-genai-stack-postgres-prod:/tmp/

# 3. 恢复数据库
docker exec go-genai-stack-postgres-prod pg_restore \
  -U genai \
  -d go_genai_stack \
  -c \
  -F custom \
  /tmp/backup-20240101.dump

# 4. 启动后端服务
docker compose start backend
```

### Redis 数据备份

Redis 使用 AOF 和 RDB 自动持久化，数据保存在 `redis-prod-data` volume。

**手动触发快照**:
```bash
docker exec go-genai-stack-redis-prod redis-cli -a $REDIS_PASSWORD BGSAVE
```

## 🔒 安全最佳实践

### ✅ 部署前检查清单

- [ ] **所有默认密码已修改**
  - POSTGRES_PASSWORD
  - REDIS_PASSWORD
  - JWT_SECRET
  - GRAFANA_PASSWORD

- [ ] **启用 SSL/TLS**
  ```bash
  # .env 中设置
  DATABASE_SSL_MODE=require
  ```

- [ ] **数据库不对外暴露**
  - docker-compose.yml 中 postgres 和 redis 无 ports 配置

- [ ] **配置防火墙**
  - 只开放必要端口 (8080, 3000, 9090, 16686)
  - 限制访问来源 IP

- [ ] **启用日志审计**
  - 所有服务已配置日志轮转
  - 日志保留在持久化 volume

- [ ] **定期更新镜像**
  ```bash
  docker compose pull
  docker compose up -d
  ```

- [ ] **配置备份策略**
  - 数据库每天备份
  - 保留至少 7 天
  - 测试恢复流程

### 🔐 密钥管理

**使用 Docker Secrets (推荐)**:

1. 创建 secrets:
```bash
echo "your_postgres_password" | docker secret create postgres_password -
echo "your_redis_password" | docker secret create redis_password -
echo "your_jwt_secret" | docker secret create jwt_secret -
```

2. 在 docker-compose.yml 中使用:
```yaml
services:
  postgres:
    secrets:
      - postgres_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password

secrets:
  postgres_password:
    external: true
```

### 🛡️ 网络安全

**配置反向代理 (Nginx)**:

```nginx
# /etc/nginx/sites-available/genai-stack
upstream backend {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name api.example.com;
    
    # 强制 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 限流
    limit_req zone=api burst=20 nodelay;
}
```

## 📈 监控与告警

### Grafana 仪表板

**访问 Grafana**:
1. 打开 http://localhost:3000
2. 登录 (admin / 设置的密码)
3. 添加仪表板

**推荐仪表板**:
- Go Processes (ID: 6671)
- PostgreSQL Database (ID: 9628)
- Redis Dashboard (ID: 11835)

### Prometheus 告警规则

创建 `alerts.yml`:
```yaml
groups:
  - name: backend_alerts
    interval: 30s
    rules:
      # Backend 服务宕机
      - alert: BackendDown
        expr: up{job="backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend service is down"
          
      # 高错误率
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          
      # 高响应时间
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected (p95 > 1s)"
```

## 🐛 故障排查

### 常见问题

#### 1. 服务无法启动

**检查日志**:
```bash
docker compose logs backend
```

**常见原因**:
- 端口冲突
- 环境变量未设置
- 数据库连接失败

#### 2. 数据库连接失败

**检查连接**:
```bash
docker exec go-genai-stack-postgres-prod pg_isready -U genai
```

**检查日志**:
```bash
docker compose logs postgres
```

#### 3. 内存不足

**检查资源使用**:
```bash
docker stats
```

**调整资源限制**:
编辑 docker-compose.yml 中的 `deploy.resources` 配置。

#### 4. 磁盘空间不足

**检查磁盘使用**:
```bash
docker system df
```

**清理未使用资源**:
```bash
docker system prune -a --volumes
```

### 诊断命令

```bash
# 检查服务健康状态
docker compose ps

# 查看容器详细信息
docker inspect go-genai-stack-backend-prod

# 进入容器
docker exec -it go-genai-stack-backend-prod sh

# 检查网络连接
docker exec go-genai-stack-backend-prod wget -qO- http://postgres:5432

# 查看资源使用
docker stats --no-stream
```

## 📚 相关资源

- [主项目 README](../../README.md)
- [后端文档](../../backend/README.md)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)

## 🆘 获取帮助

如遇到问题，请：
1. 查看本文档的故障排查部分
2. 检查服务日志
3. 提交 Issue 到 GitHub

---

**最后更新**: 2025-11-28  
**维护者**: DevOps Team

