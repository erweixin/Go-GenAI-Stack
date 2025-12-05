import { z } from 'zod'

/**
 * 任务表单验证 Schema
 *
 * 用于创建和更新任务的表单验证
 */

// 任务优先级枚举
const taskPrioritySchema = z.enum(['low', 'medium', 'high'], {
  message: '优先级必须是：低、中、高',
})

// 创建任务 Schema
export const createTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').max(200, '任务标题不能超过 200 个字符').trim(),
  description: z.string().max(5000, '任务描述不能超过 5000 个字符').default(''),
  priority: taskPrioritySchema.default('medium'),
  due_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: '截止日期格式不正确' }
    ),
  tags: z.array(z.string().min(1).max(50)).default([]),
})

// 更新任务 Schema（所有字段可选）
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, '任务标题不能为空')
    .max(200, '任务标题不能超过 200 个字符')
    .trim()
    .optional(),
  description: z.string().max(5000, '任务描述不能超过 5000 个字符').optional(),
  priority: taskPrioritySchema.optional(),
  due_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: '截止日期格式不正确' }
    ),
  tags: z.array(z.string().min(1).max(50)).optional(),
})

// 导出类型
export type CreateTaskFormData = z.infer<typeof createTaskSchema>
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>
