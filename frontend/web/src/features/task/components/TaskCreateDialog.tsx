import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { useTaskCreateMutation } from '../hooks'
import { createTaskSchema, type CreateTaskFormData } from '../schemas/task.schema'
import type { CreateTaskRequest } from '@go-genai-stack/types'

interface TaskCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 创建任务对话框（使用 React Hook Form + Zod + React Query）
 *
 * 用例：CreateTask
 */
export function TaskCreateDialog({ open, onOpenChange }: TaskCreateDialogProps) {
  const createMutation = useTaskCreateMutation()

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      due_date: undefined,
    },
  })

  const [tagInput, setTagInput] = useState('')

  const onSubmit = (data: CreateTaskFormData) => {
    const request: CreateTaskRequest = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      tags: data.tags || [],
      due_date: data.due_date || undefined,
    }

    createMutation.mutate(request, {
      onSuccess: () => {
        toast.success('任务创建成功')
        form.reset()
        setTagInput('')
        onOpenChange(false)
      },
      onError: (error: any) => {
        toast.error(error?.message || '创建任务失败，请重试')
      },
    })
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
    form.setValue('tags', currentTags.filter((tag) => tag !== tagToRemove))
  }

  const tags = form.watch('tags') || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新建任务</DialogTitle>
          <DialogDescription>创建一个新的任务，设置标题、描述、优先级等信息</DialogDescription>
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
                    <Input placeholder="输入任务标题" {...field} data-test-id="task-create-title-input" />
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
                    <Textarea placeholder="输入任务描述" rows={3} {...field} data-test-id="task-create-description-input" />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-test-id="task-create-priority-select">
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
                  data-test-id="task-create-tag-input"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" data-test-id="task-create-tag-add-button">
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
                data-test-id="task-create-cancel-button"
              >
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-test-id="task-create-submit-button">
                {createMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
