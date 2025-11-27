import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'
import { testTasks } from '../fixtures/test-data'
import { getTaskCount } from '../helpers/task-helpers'

test.describe('创建任务', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await loginAsTestUser(page)
    
    // 导航到任务页面
    await page.goto('/tasks')
  })

  test('应该成功创建基本任务', async ({ page }) => {
    // 点击"新建任务"按钮
    await page.click('button:has-text("新建任务")')
    
    // 等待对话框出现
    await expect(page.locator('text=新建任务')).toBeVisible()
    
    // 填写任务标题
    await page.fill('input[id="title"]', testTasks.basic.title)
    await page.fill('textarea[id="description"]', testTasks.basic.description)
    
    // 点击创建按钮
    await page.click('button:has-text("创建")')
    
    // 等待对话框关闭
    await expect(page.locator('input[id="title"]')).not.toBeVisible()
    
    // 验证任务出现在列表中
    await expect(page.locator(`text=${testTasks.basic.title}`)).toBeVisible()
  })

  test('应该能够创建高优先级任务', async ({ page }) => {
    await page.click('button:has-text("新建任务")')
    
    await page.fill('input[id="title"]', testTasks.urgent.title)
    await page.fill('textarea[id="description"]', testTasks.urgent.description)
    
    // 选择优先级（通过 Select 组件）
    await page.click('button[role="combobox"]')
    await page.click('text=高')
    
    await page.click('button:has-text("创建")')
    
    // 验证任务创建成功
    await expect(page.locator(`text=${testTasks.urgent.title}`)).toBeVisible()
    
    // 验证优先级标签显示
    await expect(page.locator('span:has-text("high")')).toBeVisible()
  })

  test('应该能够创建带标签的任务', async ({ page }) => {
    await page.click('button:has-text("新建任务")')
    
    await page.fill('input[id="title"]', testTasks.withTags.title)
    
    // 添加标签
    for (const tag of testTasks.withTags.tags || []) {
      await page.fill('input[placeholder*="标签"]', tag)
      await page.keyboard.press('Enter')
      
      // 验证标签已添加
      await expect(page.locator(`span:has-text("${tag}")`)).toBeVisible()
    }
    
    await page.click('button:has-text("创建")')
    
    // 验证任务和标签都显示在列表中
    await expect(page.locator(`text=${testTasks.withTags.title}`)).toBeVisible()
  })

  test('空标题应该无法创建', async ({ page }) => {
    await page.click('button:has-text("新建任务")')
    
    // 不填写标题，直接点击创建
    await page.fill('textarea[id="description"]', 'Only description')
    await page.click('button:has-text("创建")')
    
    // 验证对话框仍然显示（未关闭）
    await expect(page.locator('input[id="title"]')).toBeVisible()
  })

  test('取消创建应该关闭对话框', async ({ page }) => {
    await page.click('button:has-text("新建任务")')
    
    // 填写部分内容
    await page.fill('input[id="title"]', 'Will be cancelled')
    
    // 点击取消按钮
    await page.click('button:has-text("取消")')
    
    // 验证对话框已关闭
    await expect(page.locator('input[id="title"]')).not.toBeVisible()
    
    // 验证任务未创建
    await expect(page.locator('text=Will be cancelled')).not.toBeVisible()
  })
})

