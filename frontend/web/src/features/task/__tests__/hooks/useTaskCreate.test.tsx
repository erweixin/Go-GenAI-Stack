import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTaskCreateMutation } from '../../hooks/useTasks.mutation'
import { taskApi } from '../../api/task.api'

// Mock API
vi.mock('../../api/task.api')

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// 创建测试用的 QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  })
}

// 创建包装器
function createWrapper() {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTaskCreateMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该成功创建任务', async () => {
    // Arrange
    const mockRequest = {
      title: 'New Task',
      description: 'Task description',
      priority: 'high' as const,
      tags: ['urgent'],
    }

    const mockResponse = {
      task_id: '123',
      title: 'New Task',
      status: 'pending' as const,
      created_at: '2025-11-27T10:00:00Z',
    }

    vi.mocked(taskApi.create).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useTaskCreateMutation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockRequest)

    // Assert - 等待 mutation 完成
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(taskApi.create).toHaveBeenCalledWith(mockRequest)
    expect(result.current.data).toEqual(mockResponse)
  })

  it('创建失败时应该设置错误状态', async () => {
    // Arrange
    const mockRequest = {
      title: 'New Task',
      description: 'Task description',
      priority: 'medium' as const,
    }

    const errorMessage = 'Failed to create task'
    vi.mocked(taskApi.create).mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useTaskCreateMutation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe(errorMessage)
  })
})
