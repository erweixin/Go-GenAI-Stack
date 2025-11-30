# 监控系统快速指南

Go-GenAI-Stack 使用 Sentry 进行完整的错误追踪和性能监控。

## 🚀 5 分钟快速开始

### Step 1: 启动 Sentry 服务

```bash
cd docker/monitoring

# 复制环境变量模板
cp env.template .env

# 生成密钥
echo "SENTRY_SECRET_KEY=$(openssl rand -base64 32)" >> .env
echo "SENTRY_POSTGRES_PASSWORD=$(openssl rand -base64 16)" >> .env

# 启动服务
docker compose up -d

# 等待服务启动（约 2 分钟）
docker compose logs -f sentry-web
```

### Step 2: 初始化 Sentry

```bash
# 运行数据库迁移
docker compose exec sentry-web sentry upgrade --noinput

# 创建管理员账号
docker compose exec sentry-web sentry createuser \
  --email admin@example.com \
  --password admin123 \
  --superuser
```

### Step 3: 创建项目并获取 DSN

1. 访问：http://localhost:9000
2. 登录：admin@example.com / admin123
3. 点击 "Create Project"
4. 选择 "React"
5. 项目名称：`go-genai-stack-web`
6. 获取 DSN（类似：`http://xxx@localhost:9000/1`）

### Step 4: 配置前端

```bash
cd frontend/web

# 创建环境变量文件
cat > .env.local << EOF
VITE_SENTRY_DSN=http://xxx@localhost:9000/1
EOF

# 启动开发服务器
pnpm dev
```

### Step 5: 获取 Auth Token（用于生产构建）

1. 访问：http://localhost:9000/settings/account/api/auth-tokens/
2. 点击 "Create New Token"
3. 勾选权限：`project:releases` 和 `project:write`
4. 复制 Token 并添加到 `.env.local`：

```bash
echo "VITE_SENTRY_AUTH_TOKEN=your-token-here" >> .env.local
```

## ✅ 验证集成

### 1. 触发测试错误

在浏览器控制台执行：

```javascript
throw new Error('Test Sentry Integration')
```

### 2. 查看 Sentry Dashboard

1. 访问：http://localhost:9000
2. 进入项目 → Issues
3. 应该看到刚才的测试错误

### 3. 检查用户上下文

登录应用后触发错误，在 Sentry 中应该能看到用户信息（email）。

## 📦 功能说明

### ✅ 自动集成

以下功能已自动集成，无需额外配置：

- 全局 JavaScript 错误捕获
- React 组件错误边界
- 未处理的 Promise 错误
- API 请求错误
- 性能监控（Web Vitals）
- 用户上下文（登录后自动关联）

### ✅ 手动使用

```typescript
import { captureException, captureMessage } from '@/lib/monitoring/sentry'

// 手动上报错误
try {
  riskyOperation()
} catch (error) {
  captureException(error, {
    extra: { context: 'user-action' }
  })
}

// 记录信息
captureMessage('Important event happened', 'info')
```

## 🏗️ 架构说明

```
Docker Monitoring (独立部署)
├── sentry-web          # Web 界面（端口 9000）
├── sentry-worker       # 后台任务
├── sentry-cron         # 定时任务
├── sentry-postgres     # PostgreSQL 数据库
└── sentry-redis        # Redis 缓存

Frontend/Web
├── ErrorBoundary       # 错误边界组件
├── sentry.ts           # Sentry 配置
├── auth.store.ts       # 用户上下文集成
└── main.tsx            # 初始化入口
```

## 📊 生产部署

### 构建配置

```bash
# 设置环境变量
export NODE_ENV=production
export VITE_SENTRY_DSN=http://xxx@your-sentry-domain.com/1
export VITE_SENTRY_AUTH_TOKEN=your-token
export VITE_APP_VERSION=1.0.0

# 构建（自动上传 Source Map）
cd frontend/web
pnpm build
```

### 验证 Source Map

1. 访问 Sentry → Releases
2. 找到对应版本
3. 查看 Artifacts，应该有 `.js.map` 文件

## 🔧 常用命令

### Sentry 服务管理

```bash
cd docker/monitoring

# 启动
docker compose up -d

# 停止
docker compose stop

# 重启
docker compose restart

# 查看日志
docker compose logs -f sentry-web

# 清理数据（危险！）
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
```

## 📚 详细文档

- **Docker 部署**：[docker/monitoring/README.md](docker/monitoring/README.md)
- **前端集成**：[frontend/web/src/lib/monitoring/README.md](frontend/web/src/lib/monitoring/README.md)
- **ErrorBoundary**：[frontend/web/src/components/ErrorBoundary.tsx](frontend/web/src/components/ErrorBoundary.tsx)

## 🐛 故障排查

### 服务无法启动

```bash
# 检查日志
docker compose logs sentry-web

# 常见原因：
# 1. 密钥未设置 - 检查 .env 文件
# 2. 端口被占用 - 修改 SENTRY_PORT
# 3. 资源不足 - 检查 docker stats
```

### 前端看不到错误

```bash
# 1. 检查 DSN 配置
echo $VITE_SENTRY_DSN

# 2. 检查浏览器控制台
# 应该看到 Sentry 初始化日志

# 3. 确认错误未被过滤
# 查看 src/lib/monitoring/sentry.ts 中的 beforeSend
```

### Source Map 上传失败

```bash
# 1. 检查 Auth Token
echo $VITE_SENTRY_AUTH_TOKEN

# 2. 检查权限
# Token 需要 project:releases 和 project:write 权限

# 3. 查看构建日志
pnpm build 2>&1 | grep -i sentry
```

## 🎯 最佳实践

### 1. 环境隔离

```bash
# 开发环境
VITE_SENTRY_DSN=http://xxx@localhost:9000/1

# 生产环境
VITE_SENTRY_DSN=http://xxx@sentry.yourdomain.com/1
```

### 2. 采样率配置

```typescript
// 开发环境：100% 追踪
// 生产环境：10% 追踪（节省成本）
tracesSampleRate: environment === 'development' ? 1.0 : 0.1
```

### 3. 定期清理

```bash
# 每周清理 30 天前的数据
0 2 * * 0 cd /path/to/docker/monitoring && docker compose exec sentry-web sentry cleanup --days=30
```

### 4. 设置告警

在 Sentry Dashboard 中配置：
- 错误率 > 5%
- 错误数量 > 100/小时
- 新出现的错误
- P95 响应时间 > 3秒

## 🆘 获取帮助

- [Sentry 官方文档](https://docs.sentry.io/)
- [项目 Issues](https://github.com/your-repo/issues)
- 查看详细文档目录

## 📊 性能影响

Sentry 对应用的影响：
- Bundle Size: ~50KB (gzipped)
- 内存占用: ~5-10MB
- 性能开销: < 1%
- 网络流量: 取决于错误数量和采样率

**总结：可忽略不计** ✅

---

**现在就开始使用吧！监控系统已经完全集成到应用中。** 🚀

