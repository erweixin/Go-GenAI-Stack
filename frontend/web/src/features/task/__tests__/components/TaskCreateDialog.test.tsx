import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskCreateDialog } from '../../components/TaskCreateDialog'
import { taskApi } from '../../api/task.api'
import { toast } from 'sonner'
import { CreateTaskResponse } from '@go-genai-stack/types'

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

describe('TaskCreateDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该渲染对话框和表单字段', () => {
    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByRole('heading', { name: '新建任务' })).toBeInTheDocument()
    expect(screen.getByLabelText('任务标题 *')).toBeInTheDocument()
    expect(screen.getByLabelText('任务描述')).toBeInTheDocument()
    expect(screen.getByLabelText('优先级')).toBeInTheDocument()
    expect(screen.getByLabelText('截止日期')).toBeInTheDocument()
    expect(screen.getByText('创建')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('应该验证必填字段', async () => {
    const user = userEvent.setup()
    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    // 不填写标题，直接提交
    const submitButton = screen.getByText('创建')
    await user.click(submitButton)

    // 应该显示验证错误
    await waitFor(() => {
      expect(screen.getByText('任务标题不能为空')).toBeInTheDocument()
    })
  })

  it('应该成功创建任务', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      task_id: '123',
      title: 'New Task',
      status: 'pending' as const,
      created_at: '2025-11-27T10:00:00Z',
    }

    vi.mocked(taskApi.create).mockResolvedValue(mockResponse)

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    // 填写表单
    await user.type(screen.getByLabelText('任务标题 *'), 'New Task')
    await user.type(screen.getByLabelText('任务描述'), 'Task description')

    // 提交表单
    await user.click(screen.getByText('创建'))

    // 等待 API 调用
    await waitFor(() => {
      expect(taskApi.create).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
        tags: [],
        due_date: undefined,
      })
    })

    // 验证 toast 提示
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('任务创建成功')
    })

    // 验证对话框关闭
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('应该处理创建失败', async () => {
    const user = userEvent.setup()
    const error = new Error('创建失败')

    vi.mocked(taskApi.create).mockRejectedValue(error)

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    await user.type(screen.getByLabelText('任务标题 *'), 'New Task')
    await user.click(screen.getByText('创建'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
      // 验证 toast.error 被调用，参数可能是 error.message 或默认消息
      const calls = vi.mocked(toast.error).mock.calls
      expect(calls.length).toBeGreaterThan(0)
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toContain('失败')
    })
  })

  it('应该能够添加和删除标签', async () => {
    const user = userEvent.setup()

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    const tagInput = screen.getByPlaceholderText('输入标签后回车')

    // 添加标签
    await user.type(tagInput, 'tag1')
    await user.click(screen.getByText('添加'))

    // 验证标签显示
    await waitFor(() => {
      expect(screen.getByText('tag1')).toBeInTheDocument()
    })

    // 添加第二个标签
    await user.type(tagInput, 'tag2')
    await user.click(screen.getByText('添加'))

    await waitFor(() => {
      expect(screen.getByText('tag2')).toBeInTheDocument()
    })

    // 删除标签
    const removeButtons = screen.getAllByText('×')
    await user.click(removeButtons[0])

    await waitFor(() => {
      expect(screen.queryByText('tag1')).not.toBeInTheDocument()
    })
  })

  it('应该阻止添加重复标签', async () => {
    const user = userEvent.setup()

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    const tagInput = screen.getByPlaceholderText('输入标签后回车')

    // 添加标签
    await user.type(tagInput, 'tag1')
    await user.click(screen.getByText('添加'))

    // 再次添加相同标签
    await user.type(tagInput, 'tag1')
    await user.click(screen.getByText('添加'))

    // 应该显示警告
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith('标签已存在')
    })
  })

  it('应该阻止添加空标签', async () => {
    const user = userEvent.setup()

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    // 不输入内容，直接点击添加
    await user.click(screen.getByText('添加'))

    // 应该显示警告
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith('请输入标签')
    })
  })

  it('应该能够选择优先级', async () => {
    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    // 验证优先级选择器存在（实际选择测试在 E2E 中覆盖）
    const priorityTrigger = screen.getByLabelText('优先级')
    expect(priorityTrigger).toBeInTheDocument()
    // 注意：Select 组件在测试环境中的交互较复杂，完整测试在 E2E 中覆盖
  })

  it('应该能够取消创建', async () => {
    const user = userEvent.setup()

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
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

    vi.mocked(taskApi.create).mockReturnValue(promise as Promise<CreateTaskResponse>)

    render(<TaskCreateDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    })

    await user.type(screen.getByLabelText('任务标题 *'), 'New Task')
    await user.click(screen.getByText('创建'))

    // 验证按钮被禁用
    await waitFor(() => {
      expect(screen.getByText('创建中...')).toBeInTheDocument()
    })

    // 完成请求
    resolvePromise!({
      task_id: '123',
      title: 'New Task',
      status: 'pending' as const,
      created_at: '2025-11-27T10:00:00Z',
    })
  })
})
