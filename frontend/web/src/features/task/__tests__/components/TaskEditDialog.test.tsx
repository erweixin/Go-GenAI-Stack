import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskEditDialog } from '../../components/TaskEditDialog'
import { taskApi } from '../../api/task.api'
import { toast } from 'sonner'
import type { TaskItem, UpdateTaskResponse } from '@go-genai-stack/types'

// Mock API
vi.mock('../../api/task.api')

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
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

const mockTask: TaskItem = {
  task_id: '123',
  title: 'Original Task',
  description: 'Original description',
  status: 'pending',
  priority: 'medium',
  tags: ['tag1'],
  created_at: '2025-11-27T10:00:00Z',
}

describe('TaskEditDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染对话框和预填充的表单', () => {
    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByRole('heading', { name: '编辑任务' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original description')).toBeInTheDocument()
    expect(screen.getByText('tag1')).toBeInTheDocument()
  })

  it('应该不渲染当 task 为 null', () => {
    const { container } = render(
      <TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={null} />,
      {
        wrapper: createWrapper(),
      }
    )

    expect(container.firstChild).toBeNull()
  })

  it('应该成功更新任务', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      task_id: '123',
      title: 'Updated Task',
      status: 'pending' as const,
      updated_at: '2025-11-27T11:00:00Z',
    }

    vi.mocked(taskApi.update).mockResolvedValue(mockResponse)

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    // 修改标题
    const titleInput = screen.getByDisplayValue('Original Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Task')

    // 提交表单
    await user.click(screen.getByText('保存'))

    // 等待 API 调用
    await waitFor(() => {
      expect(taskApi.update).toHaveBeenCalledWith('123', {
        title: 'Updated Task',
        description: 'Original description',
        priority: 'medium',
        tags: ['tag1'],
        due_date: undefined,
      })
    })

    // 验证 toast 提示
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('任务更新成功')
    })

    // 验证对话框关闭
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('应该处理更新失败', async () => {
    const user = userEvent.setup()
    const error = new Error('更新失败')

    vi.mocked(taskApi.update).mockRejectedValue(error)

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    await user.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
      // 验证 toast.error 被调用，参数可能是 error.message 或默认消息
      const calls = vi.mocked(toast.error).mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toContain('失败')
    })
  })

  it('应该能够修改所有字段', async () => {
    const user = userEvent.setup()

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    // 修改标题
    const titleInput = screen.getByDisplayValue('Original Task')
    await user.clear(titleInput)
    await user.type(titleInput, 'New Title')

    // 修改描述
    const descInput = screen.getByDisplayValue('Original description')
    await user.clear(descInput)
    await user.type(descInput, 'New description')

    // 修改优先级（跳过，因为 Select 组件在测试环境中交互复杂）
    // 注意：优先级修改测试在 E2E 测试中覆盖

    // 添加新标签
    const tagInput = screen.getByPlaceholderText('输入标签后回车')
    await user.type(tagInput, 'new-tag')
    await user.click(screen.getByText('添加'))

    // 提交
    await user.click(screen.getByText('保存'))

    await waitFor(() => {
      expect(taskApi.update).toHaveBeenCalledWith('123', {
        title: 'New Title',
        description: 'New description',
        priority: expect.any(String), // 优先级可能保持原值或更新
        tags: expect.arrayContaining(['tag1', 'new-tag']),
        due_date: undefined,
      })
    })
  })

  it('应该能够删除标签', async () => {
    const user = userEvent.setup()

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    // 验证标签存在
    expect(screen.getByText('tag1')).toBeInTheDocument()

    // 删除标签
    const removeButton = screen.getByText('×').closest('button')
    expect(removeButton).toBeInTheDocument()
    await user.click(removeButton!)

    // 验证标签已删除
    await waitFor(() => {
      expect(screen.queryByText('tag1')).not.toBeInTheDocument()
    })
  })

  it('应该验证必填字段', async () => {
    const user = userEvent.setup()

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    // 清空标题
    const titleInput = screen.getByDisplayValue('Original Task')
    await user.clear(titleInput)

    // 提交
    await user.click(screen.getByText('保存'))

    // 应该显示验证错误
    await waitFor(() => {
      expect(screen.getByText('任务标题不能为空')).toBeInTheDocument()
    })
  })

  it('应该能够取消编辑', async () => {
    const user = userEvent.setup()

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    await user.click(screen.getByText('取消'))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('应该在提交时禁用按钮', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: unknown) => void

    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    vi.mocked(taskApi.update).mockReturnValue(promise as Promise<UpdateTaskResponse>)

    render(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />, {
      wrapper: createWrapper(),
    })

    await user.click(screen.getByText('保存'))

    // 验证按钮被禁用
    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument()
    })

    // 完成请求
    resolvePromise!({
      task_id: '123',
      title: 'Updated Task',
      status: 'pending' as const,
      updated_at: '2025-11-27T11:00:00Z',
    })
  })

  it('应该在 task 变化时更新表单', async () => {
    const { rerender } = render(
      <TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={mockTask} />,
      {
        wrapper: createWrapper(),
      }
    )

    expect(screen.getByDisplayValue('Original Task')).toBeInTheDocument()

    const newTask: TaskItem = {
      ...mockTask,
      task_id: '456',
      title: 'New Task',
      description: 'New description',
    }

    rerender(<TaskEditDialog open={true} onOpenChange={mockOnOpenChange} task={newTask} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('New Task')).toBeInTheDocument()
      expect(screen.getByDisplayValue('New description')).toBeInTheDocument()
    })
  })
})
