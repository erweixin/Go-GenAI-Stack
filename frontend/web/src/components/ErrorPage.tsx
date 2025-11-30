import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

/**
 * 路由错误页面
 * 
 * 用于捕获和显示路由级别的错误
 * 支持 React Router 的 errorElement
 */
export function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  // 确定错误信息
  let errorMessage = '发生了未知错误'
  let errorStatus: number | undefined

  if (isRouteErrorResponse(error)) {
    // React Router 错误响应
    errorMessage = error.statusText || error.data?.message || errorMessage
    errorStatus = error.status
  } else if (error instanceof Error) {
    // 标准 Error 对象
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  const handleGoHome = () => {
    navigate('/', { replace: true })
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>
                {errorStatus ? `错误 ${errorStatus}` : '出错了'}
              </CardTitle>
              <CardDescription>页面加载失败</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          
          {import.meta.env.MODE === 'development' && error instanceof Error && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground">
                {error.stack}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新页面
          </Button>
          <Button onClick={handleGoHome} className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

