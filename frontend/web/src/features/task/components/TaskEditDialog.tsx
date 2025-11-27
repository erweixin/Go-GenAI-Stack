import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { useTaskUpdate } from '../hooks/useTaskUpdate'
import type { TaskItem, UpdateTaskRequest, TaskPriority } from '@go-genai-stack/types'

interface TaskEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskItem | null
}

/**
 * 编辑任务对话框
 * 
 * 用例：UpdateTask
 */
export function TaskEditDialog({ open, onOpenChange, task }: TaskEditDialogProps) {
  const { updateTask, loading } = useTaskUpdate()
  
  const [formData, setFormData] = useState<UpdateTaskRequest>({
    title: '',
    description: '',
    priority: 'medium',
    tags: [],
  })

  const [tagInput, setTagInput] = useState('')

  // 当 task 变化时更新表单
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        tags: task.tags || [],
        due_date: task.due_date,
      })
    }
  }, [task])

  const handleSubmit = async () => {
    if (!task || !formData.title?.trim()) {
      alert('请输入任务标题')
      return
    }

    const success = await updateTask(task.task_id, formData)
    if (success) {
      onOpenChange(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    })
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑任务</DialogTitle>
          <DialogDescription>
            修改任务的标题、描述、优先级等信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">任务标题 *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="输入任务标题"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">任务描述</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入任务描述"
              rows={3}
            />
          </div>

          {/* 优先级 */}
          <div className="space-y-2">
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

          {/* 截止日期 */}
          <div className="space-y-2">
            <Label htmlFor="edit-due_date">截止日期</Label>
            <Input
              id="edit-due_date"
              type="datetime-local"
              value={formData.due_date || ''}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入标签后回车"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

