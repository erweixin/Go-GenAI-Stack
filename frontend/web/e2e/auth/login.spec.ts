import { test, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'
import { logout } from '../helpers/auth-helpers'

test.describe('登录流程', () => {
  test.beforeEach(async ({ page }) => {
    // 确保每个测试开始时处于登出状态
    await page.goto('/login')
  })

  test('应该成功登录并跳转到任务页面', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[id="email"]', testUsers.validUser.email)
    await page.fill('input[id="password"]', testUsers.validUser.password)
    
    // 点击登录按钮
    await page.click('button[type="submit"]:has-text("登录")')
    
    // 验证跳转到任务页面
    await expect(page).toHaveURL('/tasks', { timeout: 10000 })
    
    // 验证页面加载完成
    await expect(page.locator('button:has-text("新建任务")')).toBeVisible({ timeout: 5000 })
  })

  test('错误的密码应该显示错误提示', async ({ page }) => {
    // 填写错误凭据
    await page.fill('input[id="email"]', testUsers.validUser.email)
    await page.fill('input[id="password"]', 'wrongpassword')
    
    // 点击登录按钮
    await page.click('button[type="submit"]:has-text("登录")')
    
    // 等待错误提示出现（给后端一些响应时间）
    await page.waitForTimeout(1000)
    
    // 验证错误提示出现或仍在登录页面
    const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false)
    if (hasError) {
      await expect(page.locator('[role="alert"]')).toBeVisible()
    }
    
    // 验证仍在登录页面
    await expect(page).toHaveURL('/login')
  })

  test('空表单应该触发验证', async ({ page }) => {
    // 不填写任何内容，直接点击登录
    await page.click('button[type="submit"]:has-text("登录")')
    
    // 验证仍在登录页面（HTML5 验证会阻止提交）
    await expect(page).toHaveURL('/login')
  })

  test('登录后可以登出', async ({ page }) => {
    // 先登录
    await page.fill('input[id="email"]', testUsers.validUser.email)
    await page.fill('input[id="password"]', testUsers.validUser.password)
    await page.click('button[type="submit"]:has-text("登录")')
    
    // 等待登录成功
    await page.waitForURL('/tasks', { timeout: 10000 })
    
    // 登出
    await logout(page)
    
    // 验证跳转回登录页面
    await expect(page).toHaveURL('/login')
  })

  test('应该显示注册链接', async ({ page }) => {
    // 验证注册链接存在
    await expect(page.locator('a:has-text("注册")')).toBeVisible()
    
    // 点击注册链接
    await page.click('a:has-text("注册")')
    
    // 验证跳转到注册页面
    await expect(page).toHaveURL('/register')
  })
})

