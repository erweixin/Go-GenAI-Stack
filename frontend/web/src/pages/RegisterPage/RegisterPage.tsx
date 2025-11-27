import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRegister } from '@/features/auth/hooks/useRegister'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { RegisterRequest } from '@go-genai-stack/types'

/**
 * 注册页面
 * 
 * 职责：
 * - 注册表单展示和提交
 * - 页面布局
 * - 路由导航
 * 
 * 不包含：
 * - 认证逻辑（在 features/auth/hooks/useRegister 中）
 * 
 * 对应后端领域：auth
 */
export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading, error } = useRegister()
  
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    username: '',
    full_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await register(formData)
      navigate('/tasks')
    } catch (err) {
      // Error is handled by the hook
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>
            创建一个新账号来使用 Go GenAI Stack
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
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">全名</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                minLength={8}
              />
              <p className="text-xs text-gray-500">密码至少8个字符</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-sm text-center text-gray-600">
              已有账号？{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

