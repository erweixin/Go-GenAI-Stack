import { Loader2 } from 'lucide-react'

/**
 * 页面加载指示器
 *
 * 用于路由切换和懒加载时的加载状态
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}
