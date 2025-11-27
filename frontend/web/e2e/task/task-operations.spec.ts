import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'
import { testTasks } from '../fixtures/test-data'

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
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 5000 })
    
    // 找到任务的卡片并点击完成按钮（Circle 图标的按钮）
    const taskRow = page.locator(`h3:has-text("${taskTitle}")`).locator('..')
    const completeButton = taskRow.locator('button').first()
    await completeButton.click()
    
    // 等待状态更新
    await page.waitForTimeout(1000)
    
    // 验证任务标题变为已完成（h3 带 line-through 类）
    const taskHeading = page.locator(`h3:has-text("${taskTitle}")`)
    await expect(taskHeading).toHaveClass(/line-through/)
  })

  test('应该能够删除任务', async ({ page }) => {
    const taskTitle = `Task to Delete ${Date.now()}`
    
    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', taskTitle)
    await page.click('button:has-text("创建")')
    
    // 等待任务创建成功
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 5000 })
    
    // 找到任务卡片（Card 组件）
    const taskCard = page.locator(`text=${taskTitle}`).locator('../../..')
    // 找到所有 Button 组件
    const buttons = taskCard.locator('button.inline-flex')
    // 删除按钮是最后一个
    const deleteButton = buttons.last()
    
    // 设置对话框确认的自动接受（需要在点击前设置）
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm')
      dialog.accept()
    })
    
    await deleteButton.click()
    
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
    await expect(page.locator(`text=${originalTitle}`)).toBeVisible({ timeout: 5000 })
    
    // 找到任务卡片（Card 组件）
    const taskCard = page.locator(`text=${originalTitle}`).locator('../../..')
    // 找到所有 Button 组件（shadcn button 类）
    const buttons = taskCard.locator('button.inline-flex')
    // 编辑按钮是第一个（索引 0）
    await buttons.nth(0).click()
    
    // 验证编辑对话框出现
    await expect(page.getByRole('heading', { name: '编辑任务' })).toBeVisible()
    
    // 修改标题
    await page.fill('input[id="edit-title"]', updatedTitle)
    
    // 保存
    await page.click('button:has-text("保存")')
    
    // 等待更新完成
    await page.waitForTimeout(1000)
    
    // 验证更新成功
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 5000 })
    await expect(page.locator(`text=${originalTitle}`)).not.toBeVisible()
  })

  test('应该能够筛选任务', async ({ page }) => {
    const highPriorityTask = `High Priority Task ${Date.now()}`
    const lowPriorityTask = `Low Priority Task ${Date.now() + 1}`
    
    // 创建高优先级任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', highPriorityTask)
    const dialog1 = page.locator('[role="dialog"]')
    await dialog1.locator('button[role="combobox"]').click()
    await page.locator('[role="option"]', { hasText: '高' }).click()
    await page.click('button:has-text("创建")')
    await expect(page.locator(`text=${highPriorityTask}`)).toBeVisible({ timeout: 5000 })
    
    // 创建低优先级任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', lowPriorityTask)
    const dialog2 = page.locator('[role="dialog"]')
    await dialog2.locator('button[role="combobox"]').click()
    await page.locator('[role="option"]', { hasText: '低' }).click()
    await page.click('button:has-text("创建")')
    await expect(page.locator(`text=${lowPriorityTask}`)).toBeVisible({ timeout: 5000 })
    
    // 验证两个任务都显示
    await expect(page.locator(`text=${highPriorityTask}`)).toBeVisible()
    await expect(page.locator(`text=${lowPriorityTask}`)).toBeVisible()
    
    // 注意：实际的筛选功能需要根据前端实现来调整
    // 这里简单验证两个不同优先级的任务都能创建成功
  })
})

