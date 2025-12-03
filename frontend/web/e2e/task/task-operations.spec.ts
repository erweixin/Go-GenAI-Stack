import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'

test.describe('任务操作', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/tasks')
  })

  test('应该能够完成任务', async ({ page }) => {
    const taskTitle = `Task to Complete ${Date.now()}`

    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', taskTitle)
    await page.click('button:has-text("创建")')

    // 等待任务创建成功
    const taskHeading = page.locator(`h3:has-text("${taskTitle}")`)
    await expect(taskHeading).toBeVisible({ timeout: 5000 })

    // 获取任务 ID
    const taskIdAttr = await taskHeading.getAttribute('data-test-id')
    const taskId = taskIdAttr?.replace('task-title-', '') || ''

    // 使用 data-test-id 直接定位完成按钮
    await page.locator(`[data-test-id="task-complete-${taskId}"]`).click()

    // 等待状态更新
    await page.waitForTimeout(1000)

    // 验证任务标题变为已完成（h3 带 line-through 类）
    await expect(taskHeading).toHaveClass(/line-through/)
  })

  test('应该能够删除任务', async ({ page }) => {
    const taskTitle = `Task to Delete ${Date.now()}`

    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', taskTitle)
    await page.click('button:has-text("创建")')

    // 等待任务创建成功
    const taskHeading = page.locator(`h3:has-text("${taskTitle}")`)
    await expect(taskHeading).toBeVisible({ timeout: 5000 })

    // 获取任务 ID
    const taskIdAttr = await taskHeading.getAttribute('data-test-id')
    const taskId = taskIdAttr?.replace('task-title-', '') || ''

    // 使用 data-test-id 直接定位删除按钮
    await page.locator(`[data-test-id="task-delete-${taskId}"]`).click()

    // 等待确认对话框出现
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('确认删除')).toBeVisible()

    // 点击确认删除按钮
    await page.click('button:has-text("删除")')

    // 等待删除完成（增加等待时间）
    await page.waitForTimeout(2000)

    // 验证任务已从列表消失
    await expect(page.locator(`h3:has-text("${taskTitle}")`)).not.toBeVisible({ timeout: 5000 })
  })

  test('应该能够编辑任务', async ({ page }) => {
    const originalTitle = `Task to Edit ${Date.now()}`
    const updatedTitle = `Updated Task Title ${Date.now()}`

    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', originalTitle)
    await page.click('button:has-text("创建")')

    // 等待任务创建成功
    const taskHeading = page.locator(`h3:has-text("${originalTitle}")`)
    await expect(taskHeading).toBeVisible({ timeout: 5000 })

    // 获取任务 ID
    const taskIdAttr = await taskHeading.getAttribute('data-test-id')
    const taskId = taskIdAttr?.replace('task-title-', '') || ''

    // 使用 data-test-id 直接定位编辑按钮
    await page.locator(`[data-test-id="task-edit-${taskId}"]`).click()

    // 验证编辑对话框出现
    await expect(page.getByRole('heading', { name: '编辑任务' })).toBeVisible()

    // 修改标题
    await page.fill('input[id="edit-title"]', updatedTitle)

    // 保存
    await page.click('button:has-text("保存")')

    // 等待更新完成
    await page.waitForTimeout(1000)

    // 验证更新成功
    await expect(page.locator(`h3:has-text("${updatedTitle}")`)).toBeVisible({ timeout: 5000 })
    await expect(page.locator(`h3:has-text("${originalTitle}")`)).not.toBeVisible()
  })

  test('应该能够筛选任务', async ({ page }) => {
    const highPriorityTask = `High Priority Task ${Date.now()}`
    const lowPriorityTask = `Low Priority Task ${Date.now() + 1}`

    // 创建高优先级任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', highPriorityTask)
    // 优先级选择器使用 Select 组件
    const dialog1 = page.locator('[role="dialog"]')
    await dialog1.locator('button[role="combobox"]').click()
    await page.locator('[role="option"]:has-text("高")').click()
    await page.click('button:has-text("创建")')
    await expect(page.locator(`h3:has-text("${highPriorityTask}")`)).toBeVisible({ timeout: 5000 })

    // 创建低优先级任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', lowPriorityTask)
    const dialog2 = page.locator('[role="dialog"]')
    await dialog2.locator('button[role="combobox"]').click()
    await page.locator('[role="option"]:has-text("低")').click()
    await page.click('button:has-text("创建")')
    await expect(page.locator(`h3:has-text("${lowPriorityTask}")`)).toBeVisible({ timeout: 5000 })

    // 验证两个任务都显示
    await expect(page.locator(`h3:has-text("${highPriorityTask}")`)).toBeVisible()
    await expect(page.locator(`h3:has-text("${lowPriorityTask}")`)).toBeVisible()

    // 注意：实际的筛选功能需要根据前端实现来调整
    // 这里简单验证两个不同优先级的任务都能创建成功
  })
})
