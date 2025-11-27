import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'

test.describe('任务完整流程', () => {
  test('完整的任务生命周期', async ({ page }) => {
    // 1. 登录
    await loginAsTestUser(page)
    await page.goto('/tasks')
    
    // 2. 创建任务
    await page.click('button:has-text("新建任务")')
    await page.fill('input[id="title"]', 'Complete Lifecycle Task')
    await page.fill('textarea[id="description"]', 'This task will go through full lifecycle')
    await page.click('button:has-text("创建")')
    
    // 验证任务创建成功
    await expect(page.locator('text=Complete Lifecycle Task')).toBeVisible()
    
    // 3. 编辑任务
    const taskCard = page.locator('text=Complete Lifecycle Task').locator('..')
    await taskCard.locator('button:has(svg[class*="lucide-edit"])').click()
    
    await page.fill('input[id="edit-title"]', 'Updated Lifecycle Task')
    await page.fill('textarea[id="edit-description"]', 'Updated description')
    await page.click('button:has-text("保存")')
    
    // 验证更新成功
    await expect(page.locator('text=Updated Lifecycle Task')).toBeVisible()
    
    // 4. 完成任务
    const updatedTaskCard = page.locator('text=Updated Lifecycle Task').locator('..')
    await updatedTaskCard.locator('button').first().click()
    
    // 验证任务标记为完成
    await expect(page.locator('text=Updated Lifecycle Task')).toHaveClass(/line-through/)
    
    // 5. 删除任务
    page.on('dialog', dialog => dialog.accept())
    await updatedTaskCard.locator('button:has(svg[class*="lucide-trash"])').click()
    
    // 验证任务已删除
    await expect(page.locator('text=Updated Lifecycle Task')).not.toBeVisible()
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

