import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskDelete } from '../../hooks/useTaskDelete'
import { taskApi } from '../../api/task.api'
import { useTaskStore } from '../../stores/task.store'

// Mock API
vi.mock('../../api/task.api')

describe('useTaskDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTaskStore.getState().reset()
  })

  it('应该成功删除任务', async () => {
    // Arrange
    const mockTask = {
      task_id: 'task-1',
      title: 'Test Task',
      status: 'pending' as const,
      priority: 'high' as const,
      tags: [],
      created_at: '2025-11-27T10:00:00Z'
    }

    // 添加任务到 store
    useTaskStore.getState().addTask(mockTask)
    expect(useTaskStore.getState().tasks).toHaveLength(1)

    const mockResponse = {
      success: true,
      deleted_at: '2025-11-27T11:00:00Z'
    }

    vi.mocked(taskApi.delete).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useTaskDelete())

    const success = await result.current.deleteTask('task-1')

    // Assert
    expect(success).toBe(true)
    expect(taskApi.delete).toHaveBeenCalledWith('task-1')

    // 验证任务已从 store 中删除
    await waitFor(() => {
      const store = useTaskStore.getState()
      expect(store.tasks).toHaveLength(0)
    })
  })

  it('删除任务失败时应该返回 false', async () => {
    // Arrange
    vi.mocked(taskApi.delete).mockRejectedValue(new Error('Failed to delete'))

    // Act
    const { result } = renderHook(() => useTaskDelete())

    const success = await result.current.deleteTask('task-1')

    // Assert
    expect(success).toBe(false)
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})

