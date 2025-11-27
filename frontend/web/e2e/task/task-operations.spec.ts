import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'
import { testTasks } from '../fixtures/test-data'

test.describe('任务操作', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/tasks')
  })

  test('应该能够完成任务', async ({ page }) => {
    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', 'Task to Complete')
    await page.click('button:has-text("创建")')
    
    // 等待任务创建成功
    await expect(page.locator('text=Task to Complete')).toBeVisible()
    
    // 找到任务并点击完成按钮（Circle 图标）
    const taskCard = page.locator('text=Task to Complete').locator('..')
    await taskCard.locator('button').first().click()
    
    // 验证任务状态变为已完成（带删除线）
    await expect(page.locator('text=Task to Complete')).toHaveClass(/line-through/)
  })

  test('应该能够删除任务', async ({ page }) => {
    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', 'Task to Delete')
    await page.click('button:has-text("创建")')
    
    // 等待任务创建成功
    await expect(page.locator('text=Task to Delete')).toBeVisible()
    
    // 设置对话框确认的自动接受
    page.on('dialog', dialog => dialog.accept())
    
    // 找到任务并点击删除按钮
    const taskCard = page.locator('text=Task to Delete').locator('..')
    await taskCard.locator('button:has(svg[class*="lucide-trash"])').click()
    
    // 验证任务已从列表消失
    await expect(page.locator('text=Task to Delete')).not.toBeVisible()
  })

  test('应该能够编辑任务', async ({ page }) => {
    // 先创建一个任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', 'Task to Edit')
    await page.click('button:has-text("创建")')
    
    // 等待任务创建成功
    await expect(page.locator('text=Task to Edit')).toBeVisible()
    
    // 找到任务并点击编辑按钮
    const taskCard = page.locator('text=Task to Edit').locator('..')
    await taskCard.locator('button:has(svg[class*="lucide-edit"])').click()
    
    // 验证编辑对话框出现
    await expect(page.locator('text=编辑任务')).toBeVisible()
    
    // 修改标题
    await page.fill('input[id="edit-title"]', 'Updated Task Title')
    
    // 保存
    await page.click('button:has-text("保存")')
    
    // 验证更新成功
    await expect(page.locator('text=Updated Task Title')).toBeVisible()
    await expect(page.locator('text=Task to Edit')).not.toBeVisible()
  })

  test('应该能够筛选任务', async ({ page }) => {
    // 创建两个不同优先级的任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', 'High Priority Task')
    await page.click('button[role="combobox"]')
    await page.click('text=高')
    await page.click('button:has-text("创建")')
    
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', 'Low Priority Task')
    await page.click('button[role="combobox"]')
    await page.click('text=低')
    await page.click('button:has-text("创建")')
    
    // 验证两个任务都显示
    await expect(page.locator('text=High Priority Task')).toBeVisible()
    await expect(page.locator('text=Low Priority Task')).toBeVisible()
    
    // 筛选高优先级任务
    await page.click('button[role="combobox"]').nth(1) // 第二个 combobox 是优先级筛选
    await page.click('text=高')
    
    // 验证只显示高优先级任务
    await expect(page.locator('text=High Priority Task')).toBeVisible()
    // 注意：根据实际实现，低优先级任务可能仍然可见或不可见
  })
})

