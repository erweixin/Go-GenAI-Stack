import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, fetchUser } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!user) {
      fetchUser()
    }
  }, [isAuthenticated, user, navigate, fetchUser])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8 pt-8">
          <h1 className="text-3xl font-bold">Go-GenAI-Stack</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            登出
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              用户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">邮箱</p>
                <p className="font-medium">{user.email}</p>
              </div>
              
              {user.username && (
                <div>
                  <p className="text-sm text-muted-foreground">用户名</p>
                  <p className="font-medium">{user.username}</p>
                </div>
              )}
              
              {user.full_name && (
                <div>
                  <p className="text-sm text-muted-foreground">全名</p>
                  <p className="font-medium">{user.full_name}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">状态</p>
                <p className="font-medium">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status === 'active' ? '激活' : user.status === 'inactive' ? '未激活' : '禁用'}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">邮箱验证</p>
                <p className="font-medium">
                  {user.email_verified ? (
                    <span className="text-green-600">已验证</span>
                  ) : (
                    <span className="text-yellow-600">未验证</span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">注册时间</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                欢迎使用 Go-GenAI-Stack！这是一个基于 DDD 架构的现代 Web 应用框架。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

