import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/stores/auth.store'

/**
 * 受保护的路由组件
 * 
 * 用于需要登录才能访问的页面
 * 未登录用户会被重定向到登录页
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // 重定向到登录页，并保存当前位置
    // 登录成功后可以返回到这个位置
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

