import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTaskUpdateMutation,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from '../../hooks/useTasks.mutation'
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

describe('Task Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useTaskUpdateMutation', () => {
    it('应该成功更新任务', async () => {
      // Arrange
      const taskId = '123'
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
      }

      const mockResponse = {
        task_id: taskId,
        title: 'Updated Task',
        status: 'pending' as const,
        updated_at: '2025-11-27T10:05:00Z',
      }

      vi.mocked(taskApi.update).mockResolvedValue(mockResponse)

      // Act
      const { result } = renderHook(() => useTaskUpdateMutation(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ taskId, data: updateData })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(taskApi.update).toHaveBeenCalledWith(taskId, updateData)
    })
  })

  describe('useTaskCompleteMutation', () => {
    it('应该成功完成任务', async () => {
      // Arrange
      const taskId = '123'
      const mockResponse = {
        task_id: taskId,
        status: 'completed' as const,
        completed_at: '2025-11-27T10:00:00Z',
      }

      vi.mocked(taskApi.complete).mockResolvedValue(mockResponse)

      // Act
      const { result } = renderHook(() => useTaskCompleteMutation(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(taskId)

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(taskApi.complete).toHaveBeenCalledWith(taskId)
    })
  })

  describe('useTaskDeleteMutation', () => {
    it('应该成功删除任务', async () => {
      // Arrange
      const taskId = '123'
      const mockResponse = {
        task_id: taskId,
        message: 'Task deleted successfully',
        success: true,
        deleted_at: '2025-11-27T10:10:00Z',
      }

      vi.mocked(taskApi.delete).mockResolvedValue(mockResponse)

      // Act
      const { result } = renderHook(() => useTaskDeleteMutation(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(taskId)

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(taskApi.delete).toHaveBeenCalledWith(taskId)
    })
  })
})
