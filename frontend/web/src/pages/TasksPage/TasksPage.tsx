import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useTaskStore } from '@/features/task/stores/task.store'
import {
  useTasksQuery,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from '@/features/task/hooks'
import { TaskList } from '@/features/task/components/TaskList'
import { TaskFilters } from '@/features/task/components/TaskFilters'
import { TaskCreateDialog } from '@/features/task/components/TaskCreateDialog'
import { TaskEditDialog } from '@/features/task/components/TaskEditDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Plus, LogOut, Home } from 'lucide-react'
import type { TaskItem } from '@go-genai-stack/types'

/**
 * 任务管理页面（使用 React Query）
 * 
 * 职责：
 * - 组合 features/task 的组件
 * - 页面布局和导航
 * - 事件处理协调
 * 
 * 不包含：
 * - 业务逻辑（在 features/task/hooks 中）
 * - UI 细节（在 features/task/components 中）
 * 
 * 对应后端领域：task
 */
export default function TasksPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { filters } = useTaskStore()
  
  // ✅ 使用 React Query hooks（带筛选条件）
  const { data: tasks = [], isLoading } = useTasksQuery(filters)
  const completeMutation = useTaskCompleteMutation()
  const deleteMutation = useTaskDeleteMutation()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (taskId: string) => {
    setDeleteConfirmId(taskId)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId)
    }
  }

  const handleComplete = (taskId: string) => {
    completeMutation.mutate(taskId)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="bg-card shadow border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">任务管理</h1>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" /> 首页
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> 登出
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-6">
        {/* 操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-muted-foreground">
            共 {tasks.length} 个任务
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建任务
          </Button>
        </div>

        {/* 筛选器 */}
        <TaskFilters />

        {/* 任务列表 */}
        <TaskList
          tasks={tasks}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={handleComplete}
        />
      </div>

      {/* 对话框 */}
      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      
      <TaskEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={editingTask}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="确认删除"
        description="确定要删除这个任务吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

