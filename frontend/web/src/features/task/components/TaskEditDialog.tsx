import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useTaskUpdateMutation } from '../hooks'
import { updateTaskSchema, type UpdateTaskFormData } from '../schemas/task.schema'
import type { TaskItem, UpdateTaskRequest } from '@go-genai-stack/types'

interface TaskEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskItem | null
}

/**
 * 编辑任务对话框（使用 React Hook Form + Zod + React Query）
 *
 * 用例：UpdateTask
 */
export function TaskEditDialog({ open, onOpenChange, task }: TaskEditDialogProps) {
  const updateMutation = useTaskUpdateMutation()

  const form = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      due_date: undefined,
    },
  })

  const [tagInput, setTagInput] = useState('')

  // 当 task 变化时更新表单
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        tags: task.tags || [],
        due_date: task.due_date || undefined,
      })
      // 重置标签输入（使用 setTimeout 避免在 effect 中同步调用 setState）
      setTimeout(() => {
        setTagInput('')
      }, 0)
    }
  }, [task, form])

  const onSubmit = (data: UpdateTaskFormData) => {
    if (!task) return

    const request: UpdateTaskRequest = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      tags: data.tags,
      due_date: data.due_date,
    }

    updateMutation.mutate(
      { taskId: task.task_id, data: request },
      {
        onSuccess: () => {
          toast.success('任务更新成功')
          onOpenChange(false)
        },
        onError: (error: Error) => {
          toast.error(error?.message || '更新任务失败，请重试')
        },
      }
    )
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) {
      toast.warning('请输入标签')
      return
    }

    const currentTags = form.getValues('tags') || []
    if (currentTags.includes(trimmedTag)) {
      toast.warning('标签已存在')
      return
    }

    if (trimmedTag.length > 50) {
      toast.warning('标签长度不能超过 50 个字符')
      return
    }

    form.setValue('tags', [...currentTags, trimmedTag])
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || []
    form.setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove)
    )
  }

  const tags = useWatch({ control: form.control, name: 'tags' }) || []

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑任务</DialogTitle>
          <DialogDescription>修改任务的标题、描述、优先级等信息</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* 标题 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务标题 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="输入任务标题"
                      {...field}
                      data-test-id="task-edit-title-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>任务描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入任务描述"
                      rows={3}
                      {...field}
                      data-test-id="task-edit-description-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 优先级 */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>优先级</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-test-id="task-edit-priority-select">
                        <SelectValue placeholder="选择优先级" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 截止日期 */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>截止日期</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 标签 */}
            <div className="space-y-2">
              <FormLabel>标签</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="输入标签后回车"
                  data-test-id="task-edit-tag-input"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  data-test-id="task-edit-tag-add-button"
                >
                  添加
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setTagInput('')
                  onOpenChange(false)
                }}
                data-test-id="task-edit-cancel-button"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-test-id="task-edit-submit-button"
              >
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
