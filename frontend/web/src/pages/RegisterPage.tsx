import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
  })

  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError('')

    // 验证密码
    if (formData.password.length < 8) {
      setValidationError('密码至少需要 8 个字符')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('两次输入的密码不一致')
      return
    }
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username || undefined,
        full_name: formData.full_name || undefined,
      })
      navigate('/')
    } catch (error) {
      // 错误已经在 store 中处理
      console.error('Register failed:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // 密码强度指示器
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '' }
    if (password.length < 8) return { strength: 1, text: '弱' }
    if (password.length < 12) return { strength: 2, text: '中' }
    return { strength: 3, text: '强' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            创建账号
          </CardTitle>
          <CardDescription className="text-center">
            注册 Go-GenAI-Stack 账号
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {(error || validationError) && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error || validationError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码 *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="至少 8 个字符"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {formData.password && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.strength === 1
                          ? 'w-1/3 bg-red-500'
                          : passwordStrength.strength === 2
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span className="text-muted-foreground">
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码 *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {formData.confirmPassword && (
                <div className="flex items-center gap-1 text-xs">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">密码匹配</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">密码不匹配</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">用户名（可选）</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="3-30 个字符"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                minLength={3}
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">全名（可选）</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="您的全名"
                value={formData.full_name}
                onChange={handleChange}
                disabled={isLoading}
                maxLength={100}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              已有账号？{' '}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

