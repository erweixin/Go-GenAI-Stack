import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import type { LoginRequest } from '@go-genai-stack/types'

/**
 * 登录页面
 * 
 * 职责：
 * - 登录表单展示和提交
 * - 页面布局
 * - 路由导航
 * 
 * 不包含：
 * - 认证逻辑（在 features/auth/hooks/useLogin 中）
 * 
 * 对应后端领域：auth
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error } = useLogin()
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login(formData)
      navigate('/tasks')
    } catch (err) {
      // Error is handled by the hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>
            使用您的账号登录到 Go GenAI Stack
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="text-sm text-center text-muted-foreground space-y-2">
              <div>
                还没有账号？{' '}
                <Link to="/register" className="text-primary hover:underline">
                  注册
                </Link>
              </div>
              <div>
                查看{' '}
                <Link to="/showcase" className="text-primary hover:underline">
                  UI 组件展示
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

