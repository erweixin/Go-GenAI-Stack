import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../../stores/task.store'
import type { TaskItem } from '@go-genai-stack/types'

/**
 * Task Store 测试（UI 状态管理）
 *
 * 注意：服务器数据管理已迁移到 React Query
 * 此测试仅覆盖 UI 状态（selectedTask, filters）
 */
describe('TaskStore (UI State)', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    useTaskStore.getState().reset()
  })

  describe('setSelectedTask', () => {
    it('应该能够设置选中的任务', () => {
      const mockTask: TaskItem = {
        task_id: '1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        tags: [],
        created_at: '2025-11-27T10:00:00Z',
      }

      useTaskStore.getState().setSelectedTask(mockTask)

      const store = useTaskStore.getState()
      expect(store.selectedTask).toEqual(mockTask)
    })

    it('应该能够清除选中的任务', () => {
      const mockTask: TaskItem = {
        task_id: '1',
        title: 'Task 1',
        status: 'pending',
        priority: 'high',
        tags: [],
        created_at: '2025-11-27T10:00:00Z',
      }

      useTaskStore.getState().setSelectedTask(mockTask)
      expect(useTaskStore.getState().selectedTask).toEqual(mockTask)

      useTaskStore.getState().setSelectedTask(null)
      expect(useTaskStore.getState().selectedTask).toBeNull()
    })
  })

  describe('setFilters', () => {
    it('应该能够设置筛选条件', () => {
      useTaskStore.getState().setFilters({
        status: 'completed',
        priority: 'high',
      })

      const store = useTaskStore.getState()
      expect(store.filters.status).toBe('completed')
      expect(store.filters.priority).toBe('high')
    })

    it('应该能够设置关键词筛选', () => {
      useTaskStore.getState().setFilters({
        keyword: 'search term',
      })

      const store = useTaskStore.getState()
      expect(store.filters.keyword).toBe('search term')
    })

    it('应该能够清空筛选条件', () => {
      useTaskStore.getState().setFilters({
        status: 'completed',
        priority: 'high',
      })

      useTaskStore.getState().setFilters({})

      const store = useTaskStore.getState()
      expect(store.filters).toEqual({})
    })
  })

  describe('reset', () => {
    it('应该能够重置所有 UI 状态', () => {
      const store = useTaskStore.getState()

      const mockTask: TaskItem = {
        task_id: '1',
        title: 'Task',
        status: 'pending',
        priority: 'high',
        tags: [],
        created_at: '2025-11-27T10:00:00Z',
      }

      // 修改状态
      store.setSelectedTask(mockTask)
      store.setFilters({ status: 'completed' })

      // 重置
      store.reset()

      // 验证所有状态已重置
      expect(store.selectedTask).toBeNull()
      expect(store.filters).toEqual({})
    })
  })
})
