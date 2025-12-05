import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'

test.describe('任务完整流程', () => {
  test('完整的任务生命周期', async ({ page }) => {
    const originalTitle = `Complete Lifecycle Task ${Date.now()}`
    const updatedTitle = `Updated Lifecycle Task ${Date.now()}`

    // 1. 登录
    await loginAsTestUser(page)
    await page.goto('/tasks')

    // 2. 创建任务
    await page.locator('[data-test-id="task-create-button"]').click()
    await page.locator('[data-test-id="task-create-title-input"]').fill(originalTitle)
    await page
      .locator('[data-test-id="task-create-description-input"]')
      .fill('This task will go through full lifecycle')
    await page.locator('[data-test-id="task-create-submit-button"]').click()

    // 验证任务创建成功
    const originalTaskHeading = page.locator(`h3:has-text("${originalTitle}")`)
    await expect(originalTaskHeading).toBeVisible({ timeout: 5000 })

    // 获取任务 ID（从 data-test-id 属性）
    const originalTaskId = await originalTaskHeading.getAttribute('data-test-id')
    const taskId = originalTaskId?.replace('task-title-', '') || ''

    // 3. 编辑任务
    // 使用 data-test-id 直接定位编辑按钮
    await page.locator(`[data-test-id="task-edit-${taskId}"]`).click()

    await expect(page.getByRole('heading', { name: '编辑任务' })).toBeVisible()
    await page.locator('[data-test-id="task-edit-title-input"]').fill(updatedTitle)
    await page.locator('[data-test-id="task-edit-description-input"]').fill('Updated description')
    await page.locator('[data-test-id="task-edit-submit-button"]').click()

    // 等待更新完成
    await page.waitForTimeout(1000)

    // 验证更新成功
    const updatedTaskHeading = page.locator(`h3:has-text("${updatedTitle}")`)
    await expect(updatedTaskHeading).toBeVisible({ timeout: 5000 })

    // 获取更新后的任务 ID
    const updatedTaskId = await updatedTaskHeading.getAttribute('data-test-id')
    const updatedTaskIdValue = updatedTaskId?.replace('task-title-', '') || ''

    // 4. 完成任务
    // 使用 data-test-id 直接定位完成按钮
    await page.locator(`[data-test-id="task-complete-${updatedTaskIdValue}"]`).click()

    // 等待状态更新
    await page.waitForTimeout(1000)

    // 验证任务标记为完成（h3 带 line-through）
    await expect(updatedTaskHeading).toHaveClass(/line-through/)

    // 5. 删除任务
    // 使用 data-test-id 直接定位删除按钮
    await page.locator(`[data-test-id="task-delete-${updatedTaskIdValue}"]`).click()

    // 等待确认对话框出现
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('确认删除')).toBeVisible()

    // 点击确认删除按钮
    await page.locator('[data-test-id="confirm-dialog-confirm-button"]').click()

    // 等待删除完成
    await page.waitForTimeout(2000)

    // 验证任务已删除
    await expect(page.locator(`h3:has-text("${updatedTitle}")`)).not.toBeVisible({ timeout: 5000 })
  })

  test('应该能够从首页导航到任务页面', async ({ page }) => {
    // 登录后跳转到首页
    await loginAsTestUser(page)
    await page.goto('/')

    // 验证在首页
    await expect(page.locator('h2:has-text("欢迎回来")')).toBeVisible()

    // 点击任务管理卡片
    await page.click('text=任务管理')

    // 验证跳转到任务页面
    await expect(page).toHaveURL('/tasks')
    await expect(page.locator('h1:has-text("任务管理")')).toBeVisible()
  })

  test('未登录用户访问任务页面应该跳转到登录页', async ({ page }) => {
    // 直接访问任务页面（未登录）
    await page.goto('/tasks')

    // 验证跳转到登录页面
    await expect(page).toHaveURL('/login')
  })
})
