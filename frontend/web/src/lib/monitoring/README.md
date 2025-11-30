# 前端监控系统

基于 Sentry 的完整错误追踪和性能监控系统。

## 🎯 功能特性

### ✅ 错误监控
- 自动捕获 JavaScript 错误
- React 组件错误边界
- 未处理的 Promise 错误
- API 请求错误
- 用户操作上下文（Breadcrumbs）

### ✅ 性能监控
- Web Vitals（FCP, LCP, FID, CLS）
- API 请求性能
- 路由切换性能
- 资源加载性能
- 自定义性能追踪

### ✅ 会话重放（可选）
- 重现用户操作流程
- 自动遮罩敏感信息
- 只记录发生错误的会话

### ✅ 用户追踪
- 用户信息关联
- 环境标签（dev/staging/prod）
- 自定义标签和上下文

## 🚀 快速开始

### 1. 启动 Sentry 服务

```bash
cd docker/monitoring

# 配置环境变量
cp env.template .env
vim .env  # 设置密钥

# 启动服务
docker compose up -d

# 初始化
docker compose exec sentry-web sentry upgrade --noinput
docker compose exec sentry-web sentry createuser
```

### 2. 创建项目并获取 DSN

1. 访问：http://localhost:9000
2. 创建新项目：React
3. 获取 DSN（格式：`http://xxx@localhost:9000/1`）

### 3. 配置前端环境变量

```bash
cd frontend/web

# 创建 .env.local 文件
cat > .env.local << EOF
# Sentry DSN（必需）
VITE_SENTRY_DSN=http://xxx@localhost:9000/1

# Sentry Auth Token（用于上传 Source Map）
VITE_SENTRY_AUTH_TOKEN=your-auth-token-here

# Sentry 组织和项目（可选）
VITE_SENTRY_ORG=go-genai-stack
VITE_SENTRY_PROJECT=web

# 应用版本（可选）
VITE_APP_VERSION=1.0.0
EOF
```

### 4. 获取 Auth Token

1. 访问：http://localhost:9000/settings/account/api/auth-tokens/
2. 点击 "Create New Token"
3. 选择权限：
   - ✅ `project:releases`
   - ✅ `project:write`
4. 复制 Token 到 `VITE_SENTRY_AUTH_TOKEN`

## 📦 已集成功能

### 自动错误捕获

无需任何代码，以下错误会自动上报：

```typescript
// ✅ 全局 JavaScript 错误
throw new Error('Something went wrong')

// ✅ 未处理的 Promise 错误
Promise.reject(new Error('Async error'))

// ✅ React 组件错误
function MyComponent() {
  throw new Error('Component error')
}
```

### 手动错误上报

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/monitoring/sentry'

try {
  // 可能出错的代码
  riskyOperation()
} catch (error) {
  // 手动上报错误，并附加上下文
  captureException(error, {
    userId: '123',
    action: 'submit_form',
    formData: { ... }
  })
}

// 记录信息
captureMessage('User completed checkout', 'info')

// 添加面包屑（用户操作记录）
addBreadcrumb({
  message: 'User clicked button',
  category: 'ui',
  level: 'info',
  data: { buttonId: 'submit' }
})
```

### 用户上下文（已自动集成）

用户登录和登出时会自动同步到 Sentry：

```typescript
// ✅ 已在 auth.store.ts 中集成
// 登录时自动调用
setSentryUser({
  id: user.user_id,
  email: user.email,
})

// 登出时自动调用
clearSentryUser()
```

### 性能监控

```typescript
import { Sentry } from '@/lib/monitoring/sentry'

// 自定义性能追踪
const transaction = Sentry.startTransaction({
  name: 'process-data',
  op: 'task',
})

// 子操作
const span = transaction.startChild({
  op: 'http',
  description: 'Fetch user data',
})

// 执行操作
await fetchUserData()

// 完成
span.finish()
transaction.finish()
```

## 🔧 配置说明

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `VITE_SENTRY_DSN` | ✅ | Sentry DSN |
| `VITE_SENTRY_AUTH_TOKEN` | ⚠️ | Auth Token（生产构建时需要） |
| `VITE_SENTRY_ORG` | ❌ | 组织名称（默认：go-genai-stack） |
| `VITE_SENTRY_PROJECT` | ❌ | 项目名称（默认：web） |
| `VITE_APP_VERSION` | ❌ | 应用版本号（默认：1.0.0） |

### 采样率配置

在 `src/lib/monitoring/sentry.ts` 中调整：

```typescript
{
  // 性能追踪采样率
  tracesSampleRate: environment === 'development' ? 1.0 : 0.1,
  
  // 会话重放采样率（正常会话）
  replaysSessionSampleRate: environment === 'development' ? 0.1 : 0.01,
  
  // 会话重放采样率（错误会话）
  replaysOnErrorSampleRate: 1.0,
}
```

### 敏感信息过滤

已自动过滤以下信息：

- ✅ 密码字段（password, oldPassword, newPassword 等）
- ✅ Token 字段（token, accessToken, refreshToken）
- ✅ URL 中的敏感参数
- ✅ 会话重放中的所有文本和输入

## 📊 Source Map 上传

### 生产构建

```bash
# 设置环境变量
export VITE_SENTRY_AUTH_TOKEN=your-token
export NODE_ENV=production

# 构建（自动上传 Source Map）
pnpm build
```

构建完成后：
- ✅ Source Map 自动上传到 Sentry
- ✅ Release 自动创建
- ✅ Source Map 文件自动删除（不会部署到生产）

### 验证 Source Map

1. 访问 Sentry Dashboard
2. 进入项目 → Releases
3. 找到对应版本，查看 "Artifacts"
4. 应该看到上传的 `.js.map` 文件

## 🐛 错误边界

已自动集成 ErrorBoundary 组件：

```typescript
// ✅ 已在 main.tsx 中包裹
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

当组件崩溃时：
- 显示友好的错误页面
- 自动上报到 Sentry
- 用户可以选择重试或返回首页

### 自定义错误页面

```typescript
import ErrorBoundary from '@/components/ErrorBoundary'

<ErrorBoundary
  fallback={<MyCustomErrorPage />}
>
  <MyComponent />
</ErrorBoundary>
```

## 📈 最佳实践

### 1. 合理使用采样率

```typescript
// 生产环境建议：
tracesSampleRate: 0.1              // 性能追踪 10%
replaysSessionSampleRate: 0.01     // 会话重放 1%
replaysOnErrorSampleRate: 1.0      // 错误会话 100%
```

### 2. 添加业务上下文

```typescript
import { setContext, setTag } from '@/lib/monitoring/sentry'

// 设置业务标签
setTag('feature', 'checkout')
setTag('plan', 'premium')

// 设置业务上下文
setContext('order', {
  orderId: '12345',
  amount: 99.99,
  currency: 'USD',
})
```

### 3. 过滤无关错误

在 `sentry.ts` 的 `beforeSend` 中添加：

```typescript
beforeSend(event) {
  // 过滤特定错误
  if (event.message?.includes('某个已知的无害错误')) {
    return null
  }
  return event
}
```

### 4. 性能监控关键路径

```typescript
// 监控关键业务流程
const transaction = Sentry.startTransaction({
  name: 'checkout-flow',
  op: 'business',
})

// Step 1
const step1 = transaction.startChild({ op: 'validate' })
await validateCart()
step1.finish()

// Step 2
const step2 = transaction.startChild({ op: 'payment' })
await processPayment()
step2.finish()

transaction.finish()
```

## 🔍 查看监控数据

### Sentry Dashboard

访问：http://localhost:9000

- **Issues** - 错误列表和详情
- **Performance** - 性能指标和追踪
- **Replays** - 会话重放
- **Releases** - 版本管理和 Source Map

### 关键指标

- **Error Rate** - 错误率（errors/sessions）
- **Affected Users** - 影响用户数
- **Event Volume** - 事件数量
- **P50/P95/P99** - 性能百分位数

## 🚨 告警配置

### 1. 在 Sentry 中创建告警规则

1. 进入项目 → Settings → Alerts
2. 点击 "Create Alert Rule"
3. 选择条件：
   - 错误数量超过阈值
   - 错误率超过阈值
   - 新出现的错误
4. 配置通知渠道：Email, Slack, 钉钉, Webhook

### 2. 推荐的告警规则

```
- 错误数量 > 100/小时
- 错误率 > 5%
- P95 响应时间 > 3秒
- 影响用户数 > 50
```

## 📚 相关文档

- [Sentry 官方文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Docker 部署文档](../../../../docker/monitoring/README.md)
- [ErrorBoundary 组件](../../../components/ErrorBoundary.tsx)
- [Vite 配置](../../../vite.config.js)

## 🆘 常见问题

### Q: 本地开发时看不到 Sentry 数据？
A: 检查 `.env.local` 中的 `VITE_SENTRY_DSN` 是否配置正确。

### Q: Source Map 上传失败？
A: 确保 `VITE_SENTRY_AUTH_TOKEN` 已设置且有正确的权限。

### Q: 错误信息没有源代码位置？
A: 检查 Source Map 是否成功上传，Release 版本是否匹配。

### Q: 如何关闭会话重放？
A: 在 `sentry.ts` 中移除 `replayIntegration()`。

### Q: 如何在开发环境禁用 Sentry？
A: 不配置 `VITE_SENTRY_DSN` 即可。

## 📊 性能影响

Sentry SDK 对应用性能的影响：

- Bundle Size: ~50KB (gzipped)
- 初始化时间: < 10ms
- 错误捕获开销: < 1ms
- 性能追踪开销: ~0.1-0.5ms/transaction
- 会话重放开销: ~100KB memory + network

总体影响：**可忽略不计** ✅

