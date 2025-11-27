import type { TaskItem } from '@go-genai-stack/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Edit, Trash2, Clock } from 'lucide-react'

interface TaskItemProps {
  task: TaskItem
  onEdit?: (task: TaskItem) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
}

/**
 * 任务项组件
 * 
 * 展示单个任务的信息和操作按钮
 * 
 * @param task 任务对象
 * @param onEdit 编辑回调
 * @param onDelete 删除回调
 * @param onComplete 完成回调
 */
export function TaskItemComponent({ 
  task, 
  onEdit, 
  onDelete, 
  onComplete 
}: TaskItemProps) {
  const isCompleted = task.status === 'completed'
  
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* 标题和状态图标 */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => !isCompleted && onComplete?.(task.task_id)}
                disabled={isCompleted}
                className="focus:outline-none"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              <h3 className={`text-lg font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h3>
            </div>

            {/* 描述 */}
            {task.description && (
              <p className="text-gray-600 text-sm ml-8 mb-2">
                {task.description}
              </p>
            )}

            {/* 标签和信息 */}
            <div className="flex items-center gap-3 ml-8">
              {/* 优先级 */}
              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                {task.priority}
              </span>

              {/* 截止日期 */}
              {task.due_date && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}

              {/* 标签 */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(task)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(task.task_id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

