import { describe, it, expect } from 'vitest'
import { createTaskSchema, updateTaskSchema } from '../../schemas/task.schema'

describe('task.schema', () => {
  describe('createTaskSchema', () => {
    it('应该验证有效的任务数据', () => {
      const validData = {
        title: 'Test Task',
        description: 'Task description',
        priority: 'medium',
        tags: ['tag1', 'tag2'],
        due_date: '2025-12-31T23:59:59',
      }

      const result = createTaskSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Task')
        expect(result.data.priority).toBe('medium')
      }
    })

    it('应该拒绝空标题', () => {
      const invalidData = {
        title: '',
        description: 'Task description',
        priority: 'medium',
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('任务标题不能为空')
      }
    })

    it('应该拒绝超过 200 字符的标题', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        description: 'Task description',
        priority: 'medium',
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200')
      }
    })

    it('应该拒绝超过 5000 字符的描述', () => {
      const invalidData = {
        title: 'Test Task',
        description: 'a'.repeat(5001),
        priority: 'medium',
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000')
      }
    })

    it('应该拒绝无效的优先级', () => {
      const invalidData = {
        title: 'Test Task',
        description: 'Task description',
        priority: 'invalid',
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('应该接受有效的优先级值', () => {
      const priorities = ['low', 'medium', 'high'] as const

      priorities.forEach((priority) => {
        const data = {
          title: 'Test Task',
          priority,
        }
        const result = createTaskSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('应该拒绝无效的日期格式', () => {
      const invalidData = {
        title: 'Test Task',
        due_date: 'invalid-date',
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('截止日期格式不正确')
      }
    })

    it('应该接受有效的日期格式', () => {
      const validData = {
        title: 'Test Task',
        due_date: '2025-12-31T23:59:59',
      }

      const result = createTaskSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('应该拒绝超过 50 字符的标签', () => {
      const invalidData = {
        title: 'Test Task',
        tags: ['a'.repeat(51)],
      }

      const result = createTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('应该使用默认值', () => {
      const minimalData = {
        title: 'Test Task',
      }

      const result = createTaskSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('')
        expect(result.data.priority).toBe('medium')
        expect(result.data.tags).toEqual([])
      }
    })

    it('应该自动 trim 标题', () => {
      const data = {
        title: '  Test Task  ',
      }

      const result = createTaskSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Task')
      }
    })
  })

  describe('updateTaskSchema', () => {
    it('应该允许所有字段可选', () => {
      const emptyData = {}

      const result = updateTaskSchema.safeParse(emptyData)
      expect(result.success).toBe(true)
    })

    it('应该验证部分更新', () => {
      const partialData = {
        title: 'Updated Title',
      }

      const result = updateTaskSchema.safeParse(partialData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Updated Title')
      }
    })

    it('应该拒绝空标题（如果提供了标题）', () => {
      const invalidData = {
        title: '',
      }

      const result = updateTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('应该验证优先级（如果提供了）', () => {
      const invalidData = {
        priority: 'invalid',
      }

      const result = updateTaskSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('应该接受所有有效字段的组合', () => {
      const validData = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
        tags: ['new-tag'],
        due_date: '2025-12-31T23:59:59',
      }

      const result = updateTaskSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })
})

