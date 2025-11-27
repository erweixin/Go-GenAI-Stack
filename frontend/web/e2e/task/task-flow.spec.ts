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
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', originalTitle)
    await page.fill('textarea[id="description"]', 'This task will go through full lifecycle')
    await page.click('button:has-text("创建")')
    
    // 验证任务创建成功
    await expect(page.locator(`text=${originalTitle}`)).toBeVisible({ timeout: 5000 })
    
    // 3. 编辑任务
    let taskCard = page.locator(`text=${originalTitle}`).locator('../../..')
    let buttons = taskCard.locator('button.inline-flex')
    await buttons.nth(0).click()  // 编辑按钮
    
    await expect(page.getByRole('heading', { name: '编辑任务' })).toBeVisible()
    await page.fill('input[id="edit-title"]', updatedTitle)
    await page.fill('textarea[id="edit-description"]', 'Updated description')
    await page.click('button:has-text("保存")')
    
    // 等待更新完成
    await page.waitForTimeout(1000)
    
    // 验证更新成功
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 5000 })
    
    // 4. 完成任务
    taskCard = page.locator(`text=${updatedTitle}`).locator('..')
    const completeButton = taskCard.locator('button').first()
    await completeButton.click()
    
    // 等待状态更新
    await page.waitForTimeout(1000)
    
    // 验证任务标记为完成（h3 带 line-through）
    const taskHeading = page.locator(`h3:has-text("${updatedTitle}")`)
    await expect(taskHeading).toHaveClass(/line-through/)
    
    // 5. 删除任务
    taskCard = page.locator(`text=${updatedTitle}`).locator('../../..')
    buttons = taskCard.locator('button.inline-flex')
    const deleteButton = buttons.last()
    
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm')
      dialog.accept()
    })
    
    await deleteButton.click()
    
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

