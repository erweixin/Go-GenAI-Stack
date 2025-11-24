import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { taskService } from '@/services/task.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit,
  LogOut,
  Home
} from 'lucide-react'
import type { 
  TaskItem,
  TaskPriority,
  TaskStatus,
  CreateTaskRequest,
  UpdateTaskRequest 
} from '@go-genai-stack/types'

export default function TasksPage() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuthStore()
  
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: 'medium',
    tags: [],
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadTasks()
  }, [isAuthenticated, navigate])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await taskService.listTasks()
      setTasks(response.tasks || [])
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      alert('请输入任务标题')
      return
    }

    try {
      await taskService.createTask(formData)
      setIsCreateDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        tags: [],
      })
      loadTasks()
    } catch (error) {
      console.error('创建任务失败:', error)
      alert('创建任务失败')
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return

    try {
      const updateData: UpdateTaskRequest = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority as TaskPriority,
        tags: formData.tags,
      }
      await taskService.updateTask(editingTask.task_id, updateData)
      setIsEditDialogOpen(false)
      setEditingTask(null)
      loadTasks()
    } catch (error) {
      console.error('更新任务失败:', error)
      alert('更新任务失败')
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskService.completeTask(taskId)
      loadTasks()
    } catch (error) {
      console.error('完成任务失败:', error)
      alert('完成任务失败')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return

    try {
      await taskService.deleteTask(taskId)
      loadTasks()
    } catch (error) {
      console.error('删除任务失败:', error)
      alert('删除任务失败')
    }
  }

  const openEditDialog = (task: TaskItem) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: '',
      priority: task.priority,
      tags: task.tags,
    })
    setIsEditDialogOpen(true)
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'in_progress':
        return '进行中'
      default:
        return '待办'
    }
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    }
    const text = {
      high: '高',
      medium: '中',
      low: '低',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[priority]}`}>
        {text[priority]}
      </span>
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
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
      <div className="container mx-auto p-4 max-w-6xl">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8 pt-8">
          <h1 className="text-3xl font-bold">任务管理</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              首页
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </Button>
          </div>
        </div>

        {/* 创建任务按钮 */}
        <div className="mb-6">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建任务
          </Button>
        </div>

        {/* 任务列表 */}
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>还没有任务，点击上方按钮创建第一个任务吧！</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.task_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getPriorityBadge(task.priority)}
                          <span className="text-sm text-muted-foreground">
                            {getStatusText(task.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {task.status !== 'completed' && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCompleteTask(task.task_id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteTask(task.task_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(task.tags.length > 0 || task.due_date) && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          截止: {new Date(task.due_date).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 创建任务对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建任务</DialogTitle>
            <DialogDescription>
              填写任务信息并创建新任务
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入任务标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入任务描述（可选）"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTask}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑任务对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑任务</DialogTitle>
            <DialogDescription>
              修改任务信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">标题 *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入任务标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入任务描述（可选）"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateTask}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

