# Go-GenAI-Stack 生产环境部署指南

本目录包含 Go-GenAI-Stack 生产环境的完整 Docker Compose 配置和部署脚本。

## 📁 目录结构

```
docker/prod/
├── docker-compose.yml       # 生产环境 Docker Compose 配置（独立）
├── env.example              # 环境变量配置模板
├── init-db.sql              # 数据库初始化脚本
├── start.sh                 # 启动脚本
├── stop.sh                  # 停止脚本
├── validate-config.sh       # 配置验证脚本
└── README.md                # 本文档

注意：监控服务（Jaeger、Prometheus、Grafana）已迁移到 docker/monitoring
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
APP_PORT=8080                           # Go 后端 API 端口
NODEJS_PORT=8081                        # Node.js 后端 API 端口
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
- 🌐 **Backend API (Go)**: http://localhost:8080
  - Health Check: http://localhost:8080/health
  - Metrics: http://localhost:8080/metrics
- 🌐 **Backend API (Node.js)**: http://localhost:8081
  - Health Check: http://localhost:8081/health
  - Metrics: http://localhost:8081/metrics

**监控服务**:

监控服务（Jaeger、Prometheus、Grafana、Sentry）已迁移到独立部署。

启动监控服务：
```bash
cd ../monitoring
./start.sh
```

详细信息请参考：[docker/monitoring/README.md](../monitoring/README.md)

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
│                  生产业务服务架构                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │  Backend │────▶│ Postgres │     │  Redis   │   │
│  │   :8080  │     │  (内部)  │     │  (内部)  │   │
│  └──────────┘     └──────────┘     └──────────┘   │
│                                                     │
│  ┌──────────────┐                                 │
│  │ Backend-Node │────▶│ Postgres │     │  Redis   │   │
│  │     :8081    │     │  (内部)  │     │  (内部)  │   │
│  └──────────────┘     └──────────┘     └──────────┘   │
│                                                     │
│  💡 监控服务已迁移到 docker/monitoring（独立部署）   │
│     - Sentry (前端错误追踪)                         │
│     - Jaeger (分布式追踪)                           │
│     - Prometheus (指标收集)                         │
│     - Grafana (可视化)                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🔧 服务配置详解

### 后端服务 (Backend - Go)

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

**日志持久化**:
- 卷挂载: `backend-prod-logs:/app/logs`
- 日志路径: `/app/logs/app.log`

### 后端服务 (Backend-Nodejs)

**端口**: 8081  
**副本数**: 1 (可扩展)  
**资源限制**:
- CPU: 0.5-2 cores
- Memory: 512MB-2GB

**环境变量**:
```yaml
NODE_ENV: production
LOGGING_ENABLED: "true"
LOGGING_LEVEL: info
LOGGING_FORMAT: json
LOGGING_OUTPUT: file
LOGGING_OUTPUT_PATH: /app/logs/app.log
LOGGING_MAX_SIZE: 100
LOGGING_MAX_BACKUPS: 7
LOGGING_MAX_AGE: 30
LOGGING_COMPRESS: "true"
```

**健康检查**:
- 路径: `/health`
- 间隔: 30s
- 超时: 10s
- 重试: 3 次

**日志持久化**:
- 卷挂载: `backend-nodejs-prod-logs:/app/logs`
- 日志路径: `/app/logs/app.log`
- 查看日志: `docker compose logs -f backend-nodejs` 或访问卷挂载目录

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

### 监控服务

监控服务已迁移到 `docker/monitoring` 独立部署，包括：

- **Sentry**: 前端错误追踪、性能监控、会话重放
- **Jaeger**: 后端分布式追踪
- **Prometheus**: 指标收集和监控
- **Grafana**: 可视化和告警

详细配置请参考：[docker/monitoring/README.md](../monitoring/README.md)

**启动监控服务**:
```bash
cd docker/monitoring
./start.sh
```

**存储**: badger (本地持久化)

## 📋 日常运维

### 查看日志

**查看所有服务日志**:
```bash
docker compose logs -f
```

**查看特定服务日志**:
```bash
docker compose logs -f backend          # Go 后端
docker compose logs -f backend-nodejs   # Node.js 后端
docker compose logs -f postgres
docker compose logs -f redis
```

**查看最近 100 行日志**:
```bash
docker compose logs --tail=100 backend
docker compose logs --tail=100 backend-nodejs
```

**查看持久化日志文件** (当使用文件输出时):
```bash
# 查看 Go 后端日志
docker volume inspect go-genai-stack-backend-prod-logs
# 或直接访问挂载目录（如果使用 bind mount）

# 查看 Node.js 后端日志
docker volume inspect go-genai-stack-backend-nodejs-prod-logs
# 或直接访问挂载目录（如果使用 bind mount）
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

## 🗄️ 数据库管理

### 首次部署

首次部署时，数据库会通过 `init-db.sql` 自动初始化。如果需要使用 Atlas 迁移系统：

```bash
# 1. 确保服务已启动
cd docker/prod
./start.sh

# 2. 进入数据库管理目录
cd ../../backend/database

# 3. 配置生产环境连接（临时）
export ATLAS_DB_URL="postgres://postgres:YOUR_PASSWORD@localhost:5432/go_genai_stack_prod?sslmode=disable"

# 4. 查看当前迁移状态
atlas migrate status \
  --dir "file://migrations" \
  --url "$ATLAS_DB_URL"

# 5. 如果需要，应用迁移
atlas migrate apply \
  --dir "file://migrations" \
  --url "$ATLAS_DB_URL"
```

### Schema 更新（日常迁移）

当需要更新数据库 Schema 时：

#### 1️⃣ 开发环境生成迁移

```bash
# 在开发环境
cd backend/database

# 1. 修改 schema.sql
vim schema.sql

# 2. 生成迁移文件
make diff NAME=add_user_feature

# 3. 测试迁移
make apply

# 4. 提交迁移文件
git add migrations/
git commit -m "feat: add user feature migration"
git push
```

#### 2️⃣ 生产环境应用迁移

**方法 A：使用容器内 Atlas（推荐）**

```bash
cd docker/prod

# 1. 进入后端容器
docker compose exec backend sh

# 2. 进入数据库目录
cd database

# 3. 查看迁移状态
atlas migrate status \
  --dir "file://migrations" \
  --url "postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/go_genai_stack_prod?sslmode=require"

# 4. 应用迁移
atlas migrate apply \
  --dir "file://migrations" \
  --url "postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/go_genai_stack_prod?sslmode=require"

# 5. 退出容器
exit
```

**方法 B：从主机直接连接**

```bash
cd backend/database

# 1. 配置数据库连接
export ATLAS_DB_URL="postgres://postgres:YOUR_PASSWORD@YOUR_HOST:5432/go_genai_stack_prod?sslmode=require"

# 2. 查看待应用的迁移
atlas migrate status \
  --dir "file://migrations" \
  --url "$ATLAS_DB_URL"

# 3. 应用迁移
atlas migrate apply \
  --dir "file://migrations" \
  --url "$ATLAS_DB_URL"
```

#### 3️⃣ 验证迁移结果

```bash
# 查看迁移历史
atlas migrate status \
  --dir "file://migrations" \
  --url "$ATLAS_DB_URL"

# 检查数据库结构
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "\d"

# 查看特定表结构
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "\d users"

# 测试后端服务
curl http://localhost:8080/health
```

### 查看迁移状态

```bash
# 进入后端容器
docker compose exec backend sh

# 查看当前迁移版本
atlas migrate status \
  --dir "file://database/migrations" \
  --url "postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/go_genai_stack_prod?sslmode=require"

# 输出示例：
# Migration Status: OK
#   -- Current Version: 20241127115128
#   -- Next Version:    Already at latest version
#   -- Executed Files:  3
```

### 迁移回滚

**⚠️ 警告**：生产环境回滚需谨慎！

Atlas 本身不支持自动回滚，但你可以手动执行：

```bash
# 1. 创建回滚迁移
cd backend/database

# 2. 手动编写回滚 SQL
vim migrations/YYYYMMDD_rollback_feature.sql

# 内容示例：
# -- 回滚 add_user_bio
# ALTER TABLE users DROP COLUMN bio;

# 3. 应用回滚迁移
make apply
```

**最佳实践**：
- ✅ 避免删除列，使用标记废弃
- ✅ 新增列使用 NULL 或默认值
- ✅ 在测试环境先验证
- ✅ 准备好回滚计划

### 零停机迁移

对于大型表的 Schema 变更：

#### 1️⃣ 添加列（安全）

```sql
-- ✅ 使用默认值，无需锁表
ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';
```

#### 2️⃣ 删除列（分步进行）

```sql
-- 步骤 1: 停止使用该列（代码部署）
-- 步骤 2: 等待几天确认无问题
-- 步骤 3: 删除列（迁移）
ALTER TABLE users DROP COLUMN old_column;
```

#### 3️⃣ 修改列（使用中间列）

```sql
-- 步骤 1: 添加新列
ALTER TABLE users ADD COLUMN email_new VARCHAR(255);

-- 步骤 2: 数据迁移（代码部署，双写）
-- 步骤 3: 删除旧列，重命名新列
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users RENAME COLUMN email_new TO email;
```

### 数据库维护

```bash
# 查看数据库大小
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "
  SELECT 
    pg_size_pretty(pg_database_size('go_genai_stack_prod')) as size;
"

# 查看表大小
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# 分析和优化
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "
  VACUUM ANALYZE;
"

# 重建索引
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "
  REINDEX DATABASE go_genai_stack_prod;
"
```

### 迁移最佳实践

#### ✅ 部署前

1. **在测试环境验证**
   ```bash
   # 在开发/测试环境先测试迁移
   cd docker/e2e
   ./stop.sh --clean && ./start.sh
   cd ../../backend/database
   make apply
   ```

2. **备份数据库**
   ```bash
   # 执行迁移前先备份（见下方备份章节）
   cd docker/prod
   docker compose exec postgres pg_dump -U postgres go_genai_stack_prod > backup_before_migration.sql
   ```

3. **检查迁移内容**
   ```bash
   # 查看将要执行的 SQL
   cat backend/database/migrations/*_your_change.sql
   ```

#### ✅ 部署时

1. **使用事务**（Atlas 默认）
   - 迁移失败自动回滚
   - 保证数据一致性

2. **监控执行时间**
   ```bash
   # 对于大表变更，估算时间
   EXPLAIN ANALYZE ALTER TABLE ...
   ```

3. **维护窗口**
   - 大型变更在低峰期执行
   - 准备回滚方案

#### ✅ 部署后

1. **验证迁移**
   ```bash
   # 检查迁移状态
   atlas migrate status ...
   
   # 测试应用功能
   curl http://localhost:8080/health
   ```

2. **监控性能**
   - 查看 Grafana 监控
   - 检查数据库负载
   - 查看应用日志

3. **准备回滚**
   - 保留备份至少 7 天
   - 记录迁移版本
   - 文档化回滚步骤

### 常见问题

#### 问题 1：迁移失败

```bash
# 查看错误信息
docker compose logs backend

# 检查数据库连接
docker compose exec postgres psql -U postgres -d go_genai_stack_prod

# 查看迁移历史表
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "
  SELECT * FROM atlas_schema_revisions ORDER BY executed_at DESC LIMIT 5;
"
```

#### 问题 2：版本冲突

**错误**：`sql/migrate: checksum mismatch`

**原因**：迁移文件被修改

**解决**：
```bash
# 重新生成校验和（仅开发环境）
cd backend/database
make hash

# 生产环境：回退到正确版本
git checkout HEAD -- migrations/
```

#### 问题 3：迁移执行时间过长

**解决**：
```bash
# 1. 检查是否有锁表
docker compose exec postgres psql -U postgres -d go_genai_stack_prod -c "
  SELECT * FROM pg_stat_activity WHERE state = 'active';
"

# 2. 使用 CONCURRENTLY（不锁表）
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

# 3. 分批执行数据迁移
UPDATE users SET new_column = old_column WHERE id < 1000;
-- 分多次执行，避免长时间锁表
```

### 相关文档

- [数据库管理完整文档](../../backend/database/README.md)
- [Atlas CLI 参考](https://atlasgo.io/cli-reference)
- [PostgreSQL 维护](https://www.postgresql.org/docs/current/maintenance.html)

---

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

监控服务已迁移到 `docker/monitoring` 独立部署。

详细使用说明请参考：[docker/monitoring/README.md](../monitoring/README.md)

**快速启动监控**:
```bash
cd docker/monitoring
./start.sh
```

访问监控服务：
- Sentry: http://localhost:9000
- Jaeger UI: http://localhost:16686
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

### 告警规则配置

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

