# Sentry 监控服务

Sentry 是一个开源的错误追踪和性能监控平台，用于前端错误捕获、性能分析和会话重放。

## 🚀 快速开始

### 1. 配置环境变量

```bash
cd docker/monitoring

# 复制环境变量模板
cp env.template .env

# 生成密钥
SENTRY_SECRET_KEY=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# 编辑 .env 文件，填入生成的密钥
vim .env
```

### 2. 启动服务

```bash
# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 等待服务启动（约 1-2 分钟）
docker compose ps
```

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

### 4. 访问 Sentry

打开浏览器访问：http://localhost:9000

- 用户名：admin@example.com
- 密码：admin123（或你设置的密码）

## 📦 服务组件

| 服务 | 端口 | 说明 |
|------|------|------|
| sentry-web | 9000 | Web 界面和 API |
| sentry-worker | - | 后台任务处理 |
| sentry-cron | - | 定时任务 |
| sentry-postgres | - | PostgreSQL 数据库 |
| sentry-redis | - | Redis 缓存 |

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

访问 Sentry Dashboard 可以看到：
- 错误数量和趋势
- 影响用户数
- 错误分类（浏览器、页面、版本）
- 性能指标（P50/P95/P99）
- 会话重放

