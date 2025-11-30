# Router 配置

本项目使用 **React Router v7** 的数据路由模式（`createBrowserRouter`）。

## 📁 文件结构

```
src/router/
├── index.tsx          # 路由配置主文件
└── README.md          # 本文件
```

## 🎯 核心特性

### 1. **数据路由模式**

使用 `createBrowserRouter` 替代传统的 `<Routes>` 组件：

```tsx
// ❌ 旧方式（传统模式）
<BrowserRouter>
  <Routes>
    <Route path="/tasks" element={<TasksPage />} />
  </Routes>
</BrowserRouter>

// ✅ 新方式（数据路由模式）
const router = createBrowserRouter([
  {
    path: '/tasks',
    element: <TasksPage />,
    errorElement: <ErrorPage />,
  },
])

<RouterProvider router={router} />
```

### 2. **懒加载（Lazy Loading）**

所有页面组件都通过 `React.lazy()` 实现按需加载：

```tsx
const TasksPage = lazy(() => import('@/pages/TasksPage'))
```

**优势**：
- ✅ 减少首屏加载时间
- ✅ 按需加载，提升性能
- ✅ 自动代码分割

### 3. **加载状态（Suspense）**

使用 `Suspense` 提供加载时的视觉反馈：

```tsx
<Suspense fallback={<PageLoader />}>
  <TasksPage />
</Suspense>
```

### 4. **错误处理（Error Boundary）**

每个路由都有独立的错误处理：

```tsx
{
  path: '/tasks',
  element: <TasksPage />,
  errorElement: <ErrorPage />, // 捕获路由级错误
}
```

### 5. **权限保护（Protected Routes）**

通过 `ProtectedRoute` 组件保护需要登录的页面：

```tsx
{
  path: '/tasks',
  element: wrapPage(TasksPage, { protected: true }),
}
```

## 📝 如何添加新路由

### 1. 创建页面组件

```tsx
// src/pages/NewPage/NewPage.tsx
export default function NewPage() {
  return <div>New Page</div>
}
```

### 2. 在 router/index.tsx 中添加路由

```tsx
// 懒加载组件
const NewPage = lazy(() => import('@/pages/NewPage'))

// 添加路由配置
export const router = createBrowserRouter([
  // ... 其他路由
  {
    path: '/new',
    element: wrapPage(NewPage, { protected: true }), // 如果需要登录保护
    errorElement: <ErrorPage />,
  },
])
```

### 3. 如果需要数据预加载（可选）

```tsx
{
  path: '/tasks',
  element: wrapPage(TasksPage, { protected: true }),
  errorElement: <ErrorPage />,
  // 数据预加载
  loader: async () => {
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: taskKeys.lists(),
      queryFn: () => taskApi.list(),
    })
    return null
  },
}
```

## 🔧 路由辅助函数

### `wrapPage(Component, options)`

包装页面组件，添加 Suspense 和权限保护：

```tsx
function wrapPage(
  Component: React.LazyExoticComponent<React.ComponentType>,
  options?: {
    protected?: boolean  // 是否需要登录
  }
)
```

**使用示例**：

```tsx
// 公开页面
element: wrapPage(LoginPage)

// 需要登录的页面
element: wrapPage(TasksPage, { protected: true })
```

## 📊 路由配置示例

```tsx
export const router = createBrowserRouter([
  // 公开路由
  {
    path: '/login',
    element: wrapPage(LoginPage),
    errorElement: <ErrorPage />,
  },
  
  // 受保护的路由
  {
    path: '/tasks',
    element: wrapPage(TasksPage, { protected: true }),
    errorElement: <ErrorPage />,
  },
  
  // 404 处理
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
```

## 🎨 相关组件

- **`PageLoader`** (`src/components/PageLoader.tsx`)  
  页面加载指示器，用于 Suspense fallback

- **`ErrorPage`** (`src/components/ErrorPage.tsx`)  
  路由错误页面，用于 errorElement

- **`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`)  
  权限保护组件，用于需要登录的页面

## 🔗 参考文档

- [React Router v7 官方文档](https://reactrouter.com/en/main)
- [数据路由模式](https://reactrouter.com/en/main/routers/create-browser-router)
- [懒加载](https://react.dev/reference/react/lazy)
- [Suspense](https://react.dev/reference/react/Suspense)

