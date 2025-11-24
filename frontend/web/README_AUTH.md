# 前端认证系统使用指南

## ✅ 已实现的功能

### 1. 完整的认证流程
- ✅ 用户登录
- ✅ 用户注册
- ✅ 自动 Token 刷新
- ✅ 受保护的路由
- ✅ 状态管理（Zustand）

### 2. UI 组件（基于 Tailwind CSS）
- ✅ Button 按钮
- ✅ Input 输入框
- ✅ Card 卡片
- ✅ Label 标签
- ✅ 响应式设计

### 3. 功能特性
- ✅ 表单验证
- ✅ 密码强度指示
- ✅ 错误提示
- ✅ 加载状态
- ✅ 自动跳转

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd frontend
pnpm install
```

### 2. 配置环境变量

创建 `frontend/web/.env` 文件：

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:8080
```

### 3. 启动开发服务器

```bash
cd frontend/web
pnpm dev
```

访问：http://localhost:5173

---

## 📁 项目结构

```
frontend/web/src/
├── components/
│   └── ui/                    # UI 组件库
│       ├── button.tsx         # 按钮组件
│       ├── input.tsx          # 输入框组件
│       ├── card.tsx           # 卡片组件
│       └── label.tsx          # 标签组件
│
├── lib/
│   ├── api-client.ts          # Axios 封装（自动 Token 刷新）
│   └── utils.ts               # 工具函数（cn）
│
├── services/
│   ├── auth.service.ts        # 认证服务
│   └── user.service.ts        # 用户服务
│
├── stores/
│   └── auth.store.ts          # 认证状态管理（Zustand）
│
├── pages/
│   ├── LoginPage.tsx          # 登录页面
│   ├── RegisterPage.tsx       # 注册页面
│   └── HomePage.tsx           # 首页（需要认证）
│
├── App.tsx                    # 路由配置
└── main.tsx                   # 入口文件
```

---

## 🎨 页面预览

### 登录页面
- 路径：`/login`
- 功能：
  - 邮箱 + 密码登录
  - 表单验证
  - 错误提示
  - 加载状态
  - 跳转到注册页

### 注册页面
- 路径：`/register`
- 功能：
  - 邮箱、密码、用户名、全名
  - 密码强度指示
  - 密码确认匹配检查
  - 表单验证
  - 跳转到登录页

### 首页
- 路径：`/`
- 功能：
  - 显示用户信息
  - 登出按钮
  - 受保护（需要登录）

---

## 🔐 认证流程

### 1. Token 存储

Token 存储在 `localStorage` 中：
- `access_token` - 访问令牌（1 小时有效）
- `refresh_token` - 刷新令牌（7 天有效）
- `user_id` - 用户 ID

### 2. 自动 Token 刷新

API 客户端（`api-client.ts`）实现了自动 Token 刷新：

```typescript
// 响应拦截器：处理 401 错误
if (error.response?.status === 401) {
  // 使用 refresh_token 获取新的 access_token
  const response = await axios.post('/api/auth/refresh', {
    refresh_token: refreshToken,
  })
  
  // 保存新 Token
  localStorage.setItem('access_token', access_token)
  localStorage.setItem('refresh_token', newRefreshToken)
  
  // 重试原请求
  return apiClient(originalRequest)
}
```

### 3. 受保护的路由

使用 `ProtectedRoute` 组件保护需要认证的页面：

```typescript
<Route
  path="/"
  element={
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  }
/>
```

---

## 🛠️ 使用示例

### 使用认证 Store

```typescript
import { useAuthStore } from '@/stores/auth.store'

function MyComponent() {
  const { 
    isAuthenticated, 
    user, 
    login, 
    logout, 
    isLoading, 
    error 
  } = useAuthStore()

  const handleLogin = async () => {
    try {
      await login({ email, password })
      // 登录成功
    } catch (error) {
      // 登录失败（错误已在 store 中）
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>欢迎，{user?.email}</p>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
    </div>
  )
}
```

### 调用 API

```typescript
import { api } from '@/lib/api-client'

// GET 请求
const user = await api.get('/api/users/me')

// POST 请求
const response = await api.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password123',
})

// PUT 请求
await api.put('/api/users/me', {
  username: 'new_username',
})
```

---

## 🎨 样式定制

### Tailwind CSS 主题

在 `tailwind.config.js` 中自定义主题：

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
    },
  },
}
```

在 `src/index.css` 中修改 CSS 变量：

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* 主色调 */
  --radius: 0.5rem;              /* 圆角大小 */
}
```

---

## 🔧 配置

### Vite 配置（vite.config.js）

```javascript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // 路径别名
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',      // 后端 API 代理
        changeOrigin: true,
      },
    },
  },
})
```

### TypeScript 配置（tsconfig.app.json）

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]  // 路径别名
    }
  }
}
```

---

## 📦 依赖包

### 核心依赖
- `react` - React 框架
- `react-router-dom` - 路由管理
- `axios` - HTTP 客户端
- `zustand` - 状态管理

### UI 依赖
- `tailwindcss` - CSS 框架
- `class-variance-authority` - 组件变体管理
- `clsx` + `tailwind-merge` - 类名合并
- `lucide-react` - 图标库

---

## 🐛 常见问题

### 1. CORS 错误

**问题**：前端无法访问后端 API

**解决方案**：
- 确保后端启用了 CORS 中间件
- 检查后端是否运行在 `http://localhost:8080`
- 使用 Vite 代理（已配置）

### 2. Token 刷新失败

**问题**：Token 过期后自动刷新失败

**解决方案**：
- 检查 `refresh_token` 是否存在
- 检查后端 `/api/auth/refresh` 接口是否正常
- 查看浏览器控制台错误信息

### 3. 路由跳转失败

**问题**：登录后没有跳转到首页

**解决方案**：
- 检查 `localStorage` 中是否保存了 Token
- 检查 `isAuthenticated` 状态是否为 `true`
- 查看 `useAuthStore` 的状态

---

## 🚀 生产部署

### 1. 构建

```bash
cd frontend/web
pnpm build
```

生成的文件在 `dist/` 目录。

### 2. 环境变量

生产环境的 `.env.production`：

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 3. 部署

可以部署到：
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

---

## 📝 待办事项

### 高优先级
- [ ] 添加"记住我"功能
- [ ] 实现密码重置页面
- [ ] 添加表单验证库（如 react-hook-form）

### 中优先级
- [ ] 添加暗黑模式切换
- [ ] 优化移动端体验
- [ ] 添加加载骨架屏

### 低优先级
- [ ] 添加 OAuth 登录（Google、GitHub）
- [ ] 国际化（i18n）
- [ ] 添加单元测试

---

## 📚 相关文档

- [后端 API 文档](../../backend/domains/auth/README.md)
- [认证系统总结](../../AUTH_IMPLEMENTATION_SUMMARY.md)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [React Router 文档](https://reactrouter.com/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)

---

## 🎉 完成！

你已经拥有一个完整的认证系统！现在可以：

1. 启动后端：`cd backend && go run cmd/server/main.go`
2. 启动前端：`cd frontend/web && pnpm dev`
3. 访问：http://localhost:5173/login
4. 注册/登录并开始使用

祝你开发愉快！🚀

