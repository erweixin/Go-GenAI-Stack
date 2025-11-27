import type { TaskItem } from '@go-genai-stack/types'
import { TaskItemComponent } from './TaskItem'

interface TaskListProps {
  tasks: TaskItem[]
  loading?: boolean
  onEdit?: (task: TaskItem) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
}

/**
 * 任务列表组件
 * 
 * 可复用的任务列表，展示任务数组
 * 
 * @param tasks 任务数组
 * @param loading 加载状态
 * @param onEdit 编辑回调
 * @param onDelete 删除回调
 * @param onComplete 完成回调
 */
export function TaskList({ 
  tasks, 
  loading, 
  onEdit, 
  onDelete, 
  onComplete 
}: TaskListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">暂无任务</p>
        <p className="text-sm mt-2">点击"新建任务"创建第一个任务</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItemComponent
          key={task.task_id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onComplete={onComplete}
        />
      ))}
    </div>
  )
}

