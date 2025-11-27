import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../../stores/task.store'
import type { TaskItem } from '@go-genai-stack/types'

describe('TaskStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useTaskStore.getState().reset()
  })

  describe('setTasks', () => {
    it('应该能够设置任务列表', () => {
      const mockTasks: TaskItem[] = [
        {
          task_id: '1',
          title: 'Task 1',
          status: 'pending',
          priority: 'high',
          tags: [],
          created_at: '2025-11-27T10:00:00Z'
        },
        {
          task_id: '2',
          title: 'Task 2',
          status: 'completed',
          priority: 'low',
          tags: ['done'],
          created_at: '2025-11-27T09:00:00Z'
        }
      ]

      useTaskStore.getState().setTasks(mockTasks)

      const store = useTaskStore.getState()
      expect(store.tasks).toEqual(mockTasks)
      expect(store.tasks).toHaveLength(2)
    })
  })

  describe('addTask', () => {
    it('应该能够添加新任务', () => {
      const newTask: TaskItem = {
        task_id: '1',
        title: 'New Task',
        status: 'pending',
        priority: 'medium',
        tags: ['new'],
        created_at: '2025-11-27T10:00:00Z'
      }

      useTaskStore.getState().addTask(newTask)

      const store = useTaskStore.getState()
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0]).toEqual(newTask)
    })

    it('应该将新任务添加到列表开头', () => {
      const task1: TaskItem = {
        task_id: '1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        tags: [],
        created_at: '2025-11-27T10:00:00Z'
      }

      const task2: TaskItem = {
        task_id: '2',
        title: 'Task 2',
        status: 'pending',
        priority: 'low',
        tags: [],
        created_at: '2025-11-27T11:00:00Z'
      }

      useTaskStore.getState().addTask(task1)
      useTaskStore.getState().addTask(task2)

      const store = useTaskStore.getState()
      expect(store.tasks[0].task_id).toBe('2') // 最新的在前面
      expect(store.tasks[1].task_id).toBe('1')
    })
  })

  describe('updateTask', () => {
    it('应该能够更新任务', () => {
      const initialTask: TaskItem = {
        task_id: '1',
        title: 'Old Title',
        status: 'pending',
        priority: 'low',
        tags: [],
        created_at: '2025-11-27T10:00:00Z'
      }

      useTaskStore.getState().setTasks([initialTask])

      useTaskStore.getState().updateTask('1', {
        title: 'New Title',
        priority: 'high'
      })

      const store = useTaskStore.getState()
      expect(store.tasks[0].title).toBe('New Title')
      expect(store.tasks[0].priority).toBe('high')
      expect(store.tasks[0].status).toBe('pending') // 未修改的字段保持不变
    })

    it('更新不存在的任务不应该报错', () => {
      expect(() => {
        useTaskStore.getState().updateTask('non-existent', { title: 'New' })
      }).not.toThrow()
    })
  })

  describe('deleteTask', () => {
    it('应该能够删除任务', () => {
      const tasks: TaskItem[] = [
        {
          task_id: '1',
          title: 'Task 1',
          status: 'pending',
          priority: 'high',
          tags: [],
          created_at: '2025-11-27T10:00:00Z'
        },
        {
          task_id: '2',
          title: 'Task 2',
          status: 'pending',
          priority: 'low',
          tags: [],
          created_at: '2025-11-27T09:00:00Z'
        }
      ]

      useTaskStore.getState().setTasks(tasks)
      expect(useTaskStore.getState().tasks).toHaveLength(2)

      useTaskStore.getState().deleteTask('1')

      const store = useTaskStore.getState()
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].task_id).toBe('2')
    })

    it('删除不存在的任务不应该报错', () => {
      expect(() => {
        useTaskStore.getState().deleteTask('non-existent')
      }).not.toThrow()
    })
  })

  describe('setFilters', () => {
    it('应该能够设置筛选条件', () => {
      useTaskStore.getState().setFilters({
        status: 'completed',
        priority: 'high'
      })

      const store = useTaskStore.getState()
      expect(store.filters.status).toBe('completed')
      expect(store.filters.priority).toBe('high')
    })

    it('应该能够清空筛选条件', () => {
      useTaskStore.getState().setFilters({
        status: 'completed',
        priority: 'high'
      })

      useTaskStore.getState().setFilters({})

      const store = useTaskStore.getState()
      expect(store.filters).toEqual({})
    })
  })

  describe('setLoading', () => {
    it('应该能够设置 loading 状态', () => {
      useTaskStore.getState().setLoading(true)
      expect(useTaskStore.getState().loading).toBe(true)

      useTaskStore.getState().setLoading(false)
      expect(useTaskStore.getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('应该能够设置错误信息', () => {
      const errorMessage = 'Something went wrong'
      useTaskStore.getState().setError(errorMessage)

      expect(useTaskStore.getState().error).toBe(errorMessage)
    })

    it('应该能够清空错误信息', () => {
      useTaskStore.getState().setError('Error')
      useTaskStore.getState().setError(null)

      expect(useTaskStore.getState().error).toBeNull()
    })
  })

  describe('reset', () => {
    it('应该能够重置所有状态', () => {
      const store = useTaskStore.getState()

      // 修改所有状态
      store.setTasks([{
        task_id: '1',
        title: 'Task',
        status: 'pending',
        priority: 'high',
        tags: [],
        created_at: '2025-11-27T10:00:00Z'
      }])
      store.setFilters({ status: 'completed' })
      store.setLoading(true)
      store.setError('Error')

      // 重置
      store.reset()

      // 验证所有状态已重置
      expect(store.tasks).toEqual([])
      expect(store.filters).toEqual({})
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})

