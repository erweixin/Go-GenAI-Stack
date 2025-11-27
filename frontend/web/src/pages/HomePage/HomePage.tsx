import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, LogOut, User } from 'lucide-react'

/**
 * 首页（Dashboard）
 * 
 * 职责：
 * - 功能导航
 * - 用户欢迎信息
 * 
 * 跨领域页面（不对应单一后端领域）
 */
export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Go GenAI Stack</CardTitle>
            <CardDescription>
              基于 Go + AI 的现代化全栈应用框架
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => navigate('/login')}>登录</Button>
            <Button variant="outline" onClick={() => navigate('/register')}>注册</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Go GenAI Stack</h1>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">
                {user?.email || '用户'}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" /> 个人资料
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> 登出
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">欢迎回来！</h2>
          <p className="text-gray-600">选择一个功能开始使用</p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 任务管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/tasks')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>任务管理</CardTitle>
                  <CardDescription>管理你的待办事项</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                创建、编辑和跟踪任务，设置优先级和截止日期。
              </p>
            </CardContent>
          </Card>

          {/* 更多功能待添加 */}
        </div>
      </div>
    </div>
  )
}

