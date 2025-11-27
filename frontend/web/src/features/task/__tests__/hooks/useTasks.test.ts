import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTasks } from '../../hooks/useTasks'
import { taskApi } from '../../api/task.api'
import { useTaskStore } from '../../stores/task.store'

// Mock API
vi.mock('../../api/task.api')

describe('useTasks', () => {
  beforeEach(() => {
    // 清除所有 mock
    vi.clearAllMocks()
    // 重置 store
    useTaskStore.getState().reset()
  })

  it('应该成功加载任务列表', async () => {
    // Arrange
    const mockTasks = [
      {
        task_id: '1',
        title: 'Test Task 1',
        status: 'pending' as const,
        priority: 'high' as const,
        tags: ['urgent'],
        created_at: '2025-11-27T10:00:00Z'
      },
      {
        task_id: '2',
        title: 'Test Task 2',
        status: 'completed' as const,
        priority: 'low' as const,
        tags: [],
        created_at: '2025-11-27T09:00:00Z'
      }
    ]

    vi.mocked(taskApi.list).mockResolvedValue({
      tasks: mockTasks,
      total_count: 2,
      page: 1,
      limit: 10,
      has_more: false
    })

    // Act
    const { result } = renderHook(() => useTasks())

    // Assert
    // 初始状态应该是 loading
    expect(result.current.loading).toBe(true)

    // 等待加载完成
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tasks).toEqual(mockTasks)
    expect(result.current.error).toBeNull()
    expect(taskApi.list).toHaveBeenCalledTimes(1)
  })

  it('加载失败时应该设置错误信息', async () => {
    // Arrange
    const errorMessage = 'Network error'
    vi.mocked(taskApi.list).mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useTasks())

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.tasks).toEqual([])
  })

  it('应该能够手动刷新任务列表', async () => {
    // Arrange
    const mockTasks = [
      {
        task_id: '1',
        title: 'Test Task',
        status: 'pending' as const,
        priority: 'medium' as const,
        tags: [],
        created_at: '2025-11-27T10:00:00Z'
      }
    ]

    vi.mocked(taskApi.list).mockResolvedValue({
      tasks: mockTasks,
      total_count: 1,
      page: 1,
      limit: 10,
      has_more: false
    })

    // Act
    const { result } = renderHook(() => useTasks())

    // 等待初始加载完成
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // 清除 mock 调用记录
    vi.clearAllMocks()

    // 手动刷新
    await result.current.refresh()

    // Assert
    await waitFor(() => {
      expect(taskApi.list).toHaveBeenCalledTimes(1)
    })
  })

  it('应该响应筛选条件变化', async () => {
    // Arrange
    vi.mocked(taskApi.list).mockResolvedValue({
      tasks: [],
      total_count: 0,
      page: 1,
      limit: 10,
      has_more: false
    })

    // Act
    const { result } = renderHook(() => useTasks())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // 修改筛选条件
    useTaskStore.getState().setFilters({ status: 'completed' })

    // Assert
    // 应该触发新的 API 调用
    await waitFor(() => {
      expect(taskApi.list).toHaveBeenCalledTimes(2)
    })
  })
})

