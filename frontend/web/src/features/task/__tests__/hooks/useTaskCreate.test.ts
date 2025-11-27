import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskCreate } from '../../hooks/useTaskCreate'
import { taskApi } from '../../api/task.api'
import { useTaskStore } from '../../stores/task.store'
import type { CreateTaskRequest } from '@go-genai-stack/types'

// Mock API
vi.mock('../../api/task.api')

describe('useTaskCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTaskStore.getState().reset()
  })

  it('应该成功创建任务', async () => {
    // Arrange
    const mockRequest: CreateTaskRequest = {
      title: 'New Task',
      description: 'Task Description',
      priority: 'high',
      tags: ['urgent', 'important']
    }

    const mockResponse = {
      task_id: 'task-123',
      title: 'New Task',
      status: 'pending' as const,
      created_at: '2025-11-27T10:00:00Z'
    }

    vi.mocked(taskApi.create).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useTaskCreate())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()

    const success = await result.current.createTask(mockRequest)

    // Assert
    expect(success).toBe(true)
    expect(taskApi.create).toHaveBeenCalledWith(mockRequest)
    expect(taskApi.create).toHaveBeenCalledTimes(1)

    // 验证任务已添加到 store
    const store = useTaskStore.getState()
    expect(store.tasks).toHaveLength(1)
    expect(store.tasks[0].task_id).toBe('task-123')
    expect(store.tasks[0].title).toBe('New Task')
  })

  it('创建失败时应该设置错误并返回 false', async () => {
    // Arrange
    const mockRequest: CreateTaskRequest = {
      title: 'New Task',
      priority: 'medium'
    }

    const errorMessage = 'Failed to create task'
    vi.mocked(taskApi.create).mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useTaskCreate())

    const success = await result.current.createTask(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(success).toBe(false)
    
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
    })

    // 验证 store 中没有添加任务
    const store = useTaskStore.getState()
    expect(store.tasks).toHaveLength(0)
  })

  it('应该正确处理默认值', async () => {
    // Arrange
    const mockRequest: CreateTaskRequest = {
      title: 'Minimal Task',
      // 不提供 priority，应该使用默认值 'medium'
    }

    const mockResponse = {
      task_id: 'task-456',
      title: 'Minimal Task',
      status: 'pending' as const,
      created_at: '2025-11-27T10:00:00Z'
    }

    vi.mocked(taskApi.create).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useTaskCreate())
    await result.current.createTask(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const store = useTaskStore.getState()
    expect(store.tasks[0].priority).toBe('medium') // 默认值
  })

  it('创建过程中 loading 状态应该正确', async () => {
    // Arrange
    const mockRequest: CreateTaskRequest = {
      title: 'New Task',
      priority: 'low'
    }

    // 模拟延迟响应
    vi.mocked(taskApi.create).mockImplementation(() => 
      new Promise((resolve) => 
        setTimeout(() => resolve({
          task_id: 'task-789',
          title: 'New Task',
          status: 'pending' as const,
          created_at: '2025-11-27T10:00:00Z'
        }), 100)
      )
    )

    // Act
    const { result } = renderHook(() => useTaskCreate())

    expect(result.current.loading).toBe(false)

    const promise = result.current.createTask(mockRequest)

    // 创建过程中应该是 loading
    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    await promise

    // 完成后 loading 应该是 false
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})

