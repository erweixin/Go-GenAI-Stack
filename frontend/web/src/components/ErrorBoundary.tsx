/**
 * 错误边界组件
 * 
 * 捕获 React 组件树中的 JavaScript 错误
 * 并显示友好的错误页面
 */

import * as Sentry from '@sentry/react'
import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 错误边界组件
 * 
 * 用法：
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误详情
    console.error('Error caught by boundary:', error, errorInfo)
    
    // 更新状态
    this.setState({
      error,
      errorInfo,
    })
    
    // 上报到 Sentry
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', errorInfo.componentStack)
      Sentry.captureException(error)
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      // 如果提供了自定义 fallback，使用它
      if (fallback) {
        return fallback
      }

      // 否则显示默认错误页面
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <CardTitle>页面出错了</CardTitle>
                  <CardDescription>
                    抱歉，应用遇到了一个意外错误
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>错误信息</AlertTitle>
                <AlertDescription className="mt-2 font-mono text-sm">
                  {error?.message || '未知错误'}
                </AlertDescription>
              </Alert>

              {/* 开发环境显示详细堆栈 */}
              {import.meta.env.MODE === 'development' && errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    详细错误信息（开发模式）
                  </summary>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-60">
                    {error?.stack}
                    {'\n\n'}
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p>我们已经记录了这个错误，开发团队会尽快处理。</p>
                <p>您可以尝试以下操作：</p>
              </div>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                重试
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                刷新页面
              </Button>
              <Button onClick={this.handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return children
  }
}

// 使用 Sentry 的 ErrorBoundary 包装
export const ErrorBoundary = Sentry.withErrorBoundary(ErrorBoundaryClass, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>出错了</CardTitle>
              <CardDescription>应用遇到了错误</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={resetError} variant="outline">
            重试
          </Button>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
  showDialog: false, // 不显示 Sentry 默认对话框
})

export default ErrorBoundary

