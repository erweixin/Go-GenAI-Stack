import { useState } from 'react'
import { TaskList } from '../components/TaskList'
import { TaskCreateDialog } from '../components/TaskCreateDialog'
import { TaskEditDialog } from '../components/TaskEditDialog'
import { TaskFilters } from '../components/TaskFilters'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import {
  useTasksQuery,
  useTaskCreateMutation,
  useTaskUpdateMutation,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from '../hooks'
import type { TaskItem, CreateTaskRequest, UpdateTaskRequest } from '@go-genai-stack/types'

/**
 * 任务页面（使用 React Query）
 * 
 * 演示如何使用 TanStack Query hooks 进行数据管理
 * 
 * 特性：
 * - 自动缓存和刷新
 * - 乐观更新
 * - 后台自动重新获取
 * - Loading 和 Error 状态自动处理
 */
export function TasksPageWithQuery() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [filters, setFilters] = useState({
    status: undefined,
    priority: undefined,
  })

  // ✅ 使用 React Query 获取任务列表
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTasksQuery(filters)

  // ✅ 使用 Mutations
  const createMutation = useTaskCreateMutation()
  const updateMutation = useTaskUpdateMutation()
  const completeMutation = useTaskCompleteMutation()
  const deleteMutation = useTaskDeleteMutation()

  // 创建任务
  const handleCreate = async (data: CreateTaskRequest) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false)
      },
    })
  }

  // 更新任务
  const handleUpdate = async (taskId: string, data: UpdateTaskRequest) => {
    updateMutation.mutate(
      { taskId, data },
      {
        onSuccess: () => {
          setEditingTask(null)
        },
      }
    )
  }

  // 完成任务
  const handleComplete = (taskId: string) => {
    completeMutation.mutate(taskId)
  }

  // 删除任务
  const handleDelete = (taskId: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      deleteMutation.mutate(taskId)
    }
  }

  // 编辑任务
  const handleEdit = (task: TaskItem) => {
    setEditingTask(task)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">任务管理</h1>
          <p className="text-muted-foreground mt-1">
            使用 TanStack Query 进行数据管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新建任务
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onChange={setFilters}
      />

      {/* Error State */}
      {isError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          <p className="font-semibold">加载失败</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : '未知错误'}
          </p>
        </div>
      )}

      {/* Task List */}
      <TaskList
        tasks={tasks}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />

      {/* Dialogs */}
      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
      />

      {editingTask && (
        <TaskEditDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          onSubmit={(data) => handleUpdate(editingTask.task_id, data)}
          loading={updateMutation.isPending}
        />
      )}

      {/* Loading Indicators */}
      {(createMutation.isPending ||
        updateMutation.isPending ||
        completeMutation.isPending ||
        deleteMutation.isPending) && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
          正在处理...
        </div>
      )}
    </div>
  )
}

