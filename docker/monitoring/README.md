# Go-GenAI-Stack 监控服务

统一可观测性栈，包括：

- **Sentry**: 前端错误追踪、性能监控、会话重放
- **Jaeger**: 后端分布式追踪
- **Prometheus**: 指标收集和监控
- **Grafana**: 可视化和告警

## 🚀 快速开始

### 1. 配置环境变量

```bash
cd docker/monitoring

# 复制环境变量模板
cp env.template .env

# 生成密钥
SENTRY_SECRET_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# 编辑 .env 文件，填入生成的密钥
vim .env
```

### 2. 启动服务

**方式 1：使用启动脚本（推荐）**

```bash
# 启动所有监控服务
./start.sh

# 停止所有监控服务
./stop.sh

# 停止并清理数据
./stop.sh --clean
```

**方式 2：使用 Docker Compose**

```bash
# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 等待服务启动（约 1-2 分钟）
docker compose ps
```

**注意**：监控服务需要连接到业务服务网络，请确保 `docker/prod` 已经启动。

### 3. 初始化 Sentry

```bash
# 运行数据库迁移
docker compose exec sentry-web sentry upgrade --noinput

# 创建管理员账号
docker compose exec sentry-web sentry createuser \
  --email admin@example.com \
  --password admin123 \
  --superuser

# 或者交互式创建
docker compose exec sentry-web sentry createuser
```

### 4. 访问服务

打开浏览器访问：

- **Sentry**: http://localhost:9000
  - 用户名：admin@example.com
  - 密码：admin123（或你设置的密码）

- **Jaeger UI**: http://localhost:16686
  - 查看分布式追踪数据

- **Prometheus**: http://localhost:9090
  - 查看指标数据和查询

- **Grafana**: http://localhost:3000
  - 用户名：admin（或在 .env 中配置）
  - 密码：（在 .env 中配置）

## 📦 服务组件

### 前端监控（Sentry）

| 服务 | 端口 | 说明 |
|------|------|------|
| sentry-web | 9000 | Web 界面和 API |
| sentry-worker | - | 后台任务处理 |
| sentry-cron | - | 定时任务 |
| sentry-postgres | - | PostgreSQL 数据库 |
| sentry-redis | - | Redis 缓存 |

### 后端监控

| 服务 | 端口 | 说明 |
|------|------|------|
| jaeger | 16686 | Jaeger UI（分布式追踪） |
| - | 4317 | OTLP gRPC 端口 |
| - | 4318 | OTLP HTTP 端口 |
| prometheus | 9090 | Prometheus（指标收集） |
| grafana | 3000 | Grafana（可视化） |

## 🔧 配置前端

### 1. 创建项目

1. 登录 Sentry：http://localhost:9000
2. 点击 "Create Project"
3. 选择 "React"
4. 填写项目名称：`go-genai-stack-web`
5. 获取 DSN（类似：`http://xxx@localhost:9000/1`）

### 2. 配置前端环境变量

```bash
cd frontend/web

# 添加到 .env
echo "VITE_SENTRY_DSN=http://xxx@localhost:9000/1" >> .env.local
echo "VITE_SENTRY_AUTH_TOKEN=your-auth-token" >> .env.local
```

### 3. 获取 Auth Token（用于上传 Source Map）

1. 访问：http://localhost:9000/settings/account/api/auth-tokens/
2. 点击 "Create New Token"
3. 勾选 `project:releases` 和 `project:write` 权限
4. 复制 Token 到 `VITE_SENTRY_AUTH_TOKEN`

## 📊 使用场景

### 错误监控
- ✅ 自动捕获 JavaScript 错误
- ✅ React 组件崩溃追踪
- ✅ 未处理的 Promise 错误
- ✅ API 请求错误

### 性能监控
- ✅ 页面加载性能（FCP, LCP, FID, CLS）
- ✅ API 请求性能
- ✅ 路由切换性能
- ✅ 慢查询检测

### 用户追踪
- ✅ 用户操作路径（Breadcrumbs）
- ✅ 会话重放（Session Replay）
- ✅ 用户信息关联
- ✅ 环境标签

## 🔧 常用命令

### 服务管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f sentry-web

# 查看状态
docker compose ps

# 清理所有数据（危险！）
docker compose down -v
```

### Sentry 管理

```bash
# 创建用户
docker compose exec sentry-web sentry createuser

# 重置密码
docker compose exec sentry-web sentry changepassword admin@example.com

# 清理旧数据（保留 30 天）
docker compose exec sentry-web sentry cleanup --days=30

# 查看配置
docker compose exec sentry-web sentry config list

# 进入 Shell
docker compose exec sentry-web sentry shell
```

### 备份与恢复

```bash
# 备份数据库
docker compose exec sentry-postgres pg_dump -U sentry sentry > backup.sql

# 恢复数据库
docker compose exec -T sentry-postgres psql -U sentry sentry < backup.sql

# 备份文件
docker compose exec sentry-web tar czf - /var/lib/sentry/files > files-backup.tar.gz

# 恢复文件
docker compose exec -T sentry-web tar xzf - -C / < files-backup.tar.gz
```

## 📈 性能优化

### 资源配置

根据实际使用情况调整 `docker-compose.yml` 中的资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # CPU 限制
      memory: 4G     # 内存限制
    reservations:
      cpus: '1'      # 最小 CPU
      memory: 2G     # 最小内存
```

### 数据清理

定期清理旧数据以节省存储空间：

```bash
# 清理 30 天前的数据
docker compose exec sentry-web sentry cleanup --days=30

# 设置自动清理（添加到 crontab）
0 2 * * * cd /path/to/docker/monitoring && docker compose exec sentry-web sentry cleanup --days=30
```

## 🔒 安全建议

### 生产环境

1. **修改默认端口**：不要使用默认的 9000 端口
2. **使用 HTTPS**：通过 Nginx 反向代理启用 SSL
3. **强密码**：使用复杂的密码和密钥
4. **限制访问**：使用防火墙限制访问来源
5. **定期备份**：设置自动备份数据库和文件

### Nginx 反向代理示例

```nginx
server {
    listen 443 ssl http2;
    server_name sentry.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持（用于实时通知）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 🐛 故障排查

### 服务无法启动

```bash
# 检查日志
docker compose logs sentry-web

# 常见问题：
# 1. 密钥未设置 - 检查 .env 文件
# 2. 端口被占用 - 修改 SENTRY_PORT
# 3. 资源不足 - 调整资源限制或增加服务器资源
```

### 无法访问 Web 界面

```bash
# 检查服务状态
docker compose ps

# 确保 sentry-web 是 healthy 状态
# 如果不是，查看日志：
docker compose logs sentry-web

# 检查端口
netstat -tuln | grep 9000
```

### 初始化失败

```bash
# 重新初始化
docker compose down
docker volume rm sentry-postgres-data
docker compose up -d
docker compose exec sentry-web sentry upgrade --noinput
```

## 📚 相关文档

- [Sentry 官方文档](https://docs.sentry.io/)
- [前端集成文档](../../frontend/web/src/lib/monitoring/README.md)
- [Source Map 配置](../../frontend/web/vite.config.js)

## 🆘 获取帮助

如果遇到问题：
1. 查看日志：`docker compose logs -f`
2. 检查配置：`docker compose config`
3. 查看官方文档：https://docs.sentry.io/
4. 提交 Issue

## 📊 监控指标

### Sentry（前端）

访问 Sentry Dashboard 可以看到：
- 错误数量和趋势
- 影响用户数
- 错误分类（浏览器、页面、版本）
- 性能指标（P50/P95/P99）
- 会话重放

### Jaeger（后端追踪）

访问 Jaeger UI (http://localhost:16686) 可以：
- 查看请求追踪链路
- 分析服务依赖关系
- 定位慢查询和性能瓶颈
- 查看跨服务调用

### Prometheus（指标收集）

访问 Prometheus (http://localhost:9090) 可以：
- 查询系统指标（CPU、内存、网络）
- 查看应用指标（QPS、延迟、错误率）
- 执行 PromQL 查询
- 查看 Target 健康状态

### Grafana（可视化）

访问 Grafana (http://localhost:3000) 可以：
- 创建自定义 Dashboard
- 设置告警规则
- 关联 Prometheus 和 Jaeger 数据
- 可视化业务指标

## 🔗 网络架构

监控服务通过共享网络连接到业务服务：

```
go-genai-stack-network (共享网络)
├── 业务服务 (docker/prod)
│   ├── backend:8080         # 后端 API
│   ├── postgres:5432        # 数据库
│   └── redis:6379           # 缓存
│
└── 监控服务 (docker/monitoring)
    ├── jaeger:4318          # 接收后端追踪数据
    ├── prometheus:9090      # 抓取后端指标
    └── grafana:3000         # 可视化展示
```

**关键点**：
- Prometheus 通过 `backend:8080/metrics` 抓取后端指标
- 后端通过 `jaeger:4318` 发送追踪数据
- Grafana 通过 `prometheus:9090` 和 `jaeger:16686` 获取数据

## 🎯 使用场景

### 场景 1：调试生产问题

1. **前端错误**：Sentry 捕获错误 → 查看错误堆栈和用户操作
2. **后端问题**：Jaeger 查看请求链路 → 定位慢接口
3. **系统指标**：Prometheus/Grafana 查看 CPU/内存 → 发现资源瓶颈

### 场景 2：性能优化

1. Grafana 查看 API 响应时间趋势
2. Jaeger 分析慢请求的详细链路
3. Prometheus 查询数据库连接数、缓存命中率

### 场景 3：告警监控

1. Grafana 设置告警规则（错误率 > 1%）
2. 告警触发时查看 Sentry 错误详情
3. 通过 Jaeger 追踪问题根因

## 🛠️ 高级配置

### 自定义 Grafana Dashboard

```bash
# 将 Dashboard JSON 文件放到此目录
docker/monitoring/grafana-dashboards/

# 重启 Grafana
docker compose restart grafana
```

### 自定义 Prometheus 抓取配置

编辑 `prometheus.yml` 添加新的抓取目标：

```yaml
scrape_configs:
  - job_name: 'my-service'
    static_configs:
      - targets: ['my-service:8080']
        labels:
          service: 'my-service'
```

### 配置告警

1. 创建 `prometheus/alerts/rules.yml`
2. 在 `prometheus.yml` 中引用
3. 配置 Alertmanager（可选）

