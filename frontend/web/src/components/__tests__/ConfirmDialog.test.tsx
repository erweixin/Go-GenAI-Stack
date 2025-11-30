import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  it('应该正确渲染对话框', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
        description="此操作无法撤销"
      />
    )

    expect(screen.getByText('确认删除')).toBeInTheDocument()
    expect(screen.getByText('此操作无法撤销')).toBeInTheDocument()
    expect(screen.getByText('确认')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('应该在不显示时不渲染对话框', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
      />
    )

    expect(screen.queryByText('确认删除')).not.toBeInTheDocument()
  })

  it('点击确认按钮应该调用 onConfirm 和 onOpenChange', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
      />
    )

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('点击取消按钮应该调用 onOpenChange', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
      />
    )

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(onConfirm).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('应该支持自定义按钮文本', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
        confirmText="删除"
        cancelText="返回"
      />
    )

    expect(screen.getByText('删除')).toBeInTheDocument()
    expect(screen.getByText('返回')).toBeInTheDocument()
  })

  it('加载状态应该禁用按钮并显示加载文本', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
        loading={true}
      />
    )

    expect(screen.getByText('处理中...')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeDisabled()
  })

  it('destructive variant 应该应用正确的样式', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
        variant="destructive"
      />
    )

    const confirmButton = screen.getByText('确认')
    expect(confirmButton).toHaveClass('bg-destructive')
  })

  it('没有描述时不应该渲染描述元素', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    const { container } = render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        title="确认删除"
      />
    )

    // AlertDialogDescription 应该不存在
    const description = container.querySelector('[role="alertdialog"] p')
    expect(description).toBeNull()
  })
})

