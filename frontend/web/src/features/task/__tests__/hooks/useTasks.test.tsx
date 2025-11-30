import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTasksQuery } from '../../hooks/useTasks.query'
import { taskApi } from '../../api/task.api'
import type { ListTasksRequest } from '@go-genai-stack/types'

// Mock API
vi.mock('../../api/task.api')

// 创建测试用的 QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 测试时不重试
        gcTime: Infinity, // 测试时不清理缓存
      },
    },
  })
}

// 创建包装器
function createWrapper() {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useTasks (React Query 版本)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    const { result } = renderHook(() => useTasksQuery(), {
      wrapper: createWrapper()
    })

    // Assert
    // 初始状态应该是 loading
    expect(result.current.isLoading).toBe(true)

    // 等待加载完成
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockTasks)
    expect(result.current.error).toBeNull()
    expect(taskApi.list).toHaveBeenCalledTimes(1)
  })

  it('加载失败时应该设置错误信息', async () => {
    // Arrange
    const errorMessage = 'Network error'
    vi.mocked(taskApi.list).mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useTasksQuery(), {
      wrapper: createWrapper()
    })

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe(errorMessage)
    expect(result.current.data).toBeUndefined()
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
    const { result } = renderHook(() => useTasksQuery(), {
      wrapper: createWrapper()
    })

    // 等待初始加载完成
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // 清除 mock 调用记录
    vi.clearAllMocks()

    // 手动刷新
    result.current.refetch()

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

    let filters: ListTasksRequest | undefined = undefined

    // Act - 先不带筛选条件
    const { result, rerender } = renderHook(
      () => useTasksQuery(filters),
      {
        wrapper: createWrapper(),
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(taskApi.list).toHaveBeenCalledTimes(1)
    expect(taskApi.list).toHaveBeenCalledWith(undefined)

    // 修改筛选条件
    filters = { status: 'completed' as const }
    rerender()

    // Assert - 应该触发新的 API 调用
    await waitFor(() => {
      expect(taskApi.list).toHaveBeenCalledTimes(2)
    })
    
    expect(taskApi.list).toHaveBeenLastCalledWith({ status: 'completed' })
  })
})

