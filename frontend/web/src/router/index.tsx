import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/PageLoader'
import { ErrorPage } from '@/components/ErrorPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

/**
 * 路由配置
 * 
 * 使用 React Router v7 的数据路由模式（createBrowserRouter）
 * 
 * 特性：
 * - 懒加载：按需加载页面组件
 * - 错误处理：每个路由都有 errorElement
 * - 加载状态：Suspense fallback
 * - 类型安全：完整的 TypeScript 支持
 */

// ==================== 懒加载页面组件 ====================

// 公开页面
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ShowcasePage = lazy(() => import('@/pages/ShowcasePage'))

// 受保护的页面
const HomePage = lazy(() => import('@/pages/HomePage'))
const TasksPage = lazy(() => import('@/pages/TasksPage'))
const ProductListPage = lazy(() => import('@/features/product/pages/ProductListPage'))

// ==================== 路由辅助函数 ====================

/**
 * 包装页面组件，添加 Suspense 和可选的权限保护 
 */
function wrapPage(
  Component: React.LazyExoticComponent<React.ComponentType>,
  options?: {
    protected?: boolean
  }
) {
  const element = (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )

  if (options?.protected) {
    return <ProtectedRoute>{element}</ProtectedRoute>
  }

  return element
}

// ==================== 路由配置 ====================

export const router = createBrowserRouter([
  // ==================== 公开路由 ====================
  {
    path: '/login',
    element: wrapPage(LoginPage),
    errorElement: <ErrorPage />,
  },
  {
    path: '/register',
    element: wrapPage(RegisterPage),
    errorElement: <ErrorPage />,
  },
  {
    path: '/showcase',
    element: wrapPage(ShowcasePage),
    errorElement: <ErrorPage />,
  },

  // ==================== 受保护的路由 ====================
  {
    path: '/',
    element: wrapPage(HomePage, { protected: true }),
    errorElement: <ErrorPage />,
  },
  {
    path: '/tasks',
    element: wrapPage(TasksPage, { protected: true }),
    errorElement: <ErrorPage />,
    // 🔥 可选：数据预加载
    // loader: async () => {
    //   // 在路由切换前预加载任务列表
    //   const queryClient = new QueryClient()
    //   await queryClient.prefetchQuery({
    //     queryKey: taskKeys.lists(),
    //     queryFn: () => taskApi.list(),
    //   })
    //   return null
    // },
  },
  {
    path: '/products',
    element: wrapPage(ProductListPage, { protected: true }),
    errorElement: <ErrorPage />,
  },

  // ==================== 404 处理 ====================
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

/**
 * 路由导出说明
 * 
 * 使用方式（在 App.tsx 中）：
 * 
 * ```tsx
 * import { RouterProvider } from 'react-router-dom'
 * import { router } from './router'
 * 
 * function App() {
 *   return <RouterProvider router={router} />
 * }
 * ```
 */

