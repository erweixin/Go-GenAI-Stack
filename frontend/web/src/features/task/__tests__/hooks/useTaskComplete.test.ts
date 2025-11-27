import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskComplete } from '../../hooks/useTaskComplete'
import { taskApi } from '../../api/task.api'
import { useTaskStore } from '../../stores/task.store'

// Mock API
vi.mock('../../api/task.api')

describe('useTaskComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTaskStore.getState().reset()
  })

  it('应该成功完成任务', async () => {
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

    const mockResponse = {
      task_id: 'task-1',
      status: 'completed' as const,
      completed_at: '2025-11-27T11:00:00Z'
    }

    vi.mocked(taskApi.complete).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useTaskComplete())

    const success = await result.current.completeTask('task-1')

    // Assert
    expect(success).toBe(true)
    expect(taskApi.complete).toHaveBeenCalledWith('task-1')

    // 验证 store 中任务状态已更新
    await waitFor(() => {
      const store = useTaskStore.getState()
      const updatedTask = store.tasks.find(t => t.task_id === 'task-1')
      expect(updatedTask?.status).toBe('completed')
    })
  })

  it('完成任务失败时应该返回 false', async () => {
    // Arrange
    vi.mocked(taskApi.complete).mockRejectedValue(new Error('Failed to complete'))

    // Act
    const { result } = renderHook(() => useTaskComplete())

    const success = await result.current.completeTask('task-1')

    // Assert
    expect(success).toBe(false)
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})

