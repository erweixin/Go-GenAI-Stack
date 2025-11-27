import { test, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

test.describe('注册流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('应该成功注册新用户', async ({ page }) => {
    // 生成唯一的测试用户
    const newUser = {
      ...testUsers.newUser,
      email: `e2e-${Date.now()}@example.com`
    }
    
    // 填写注册表单
    await page.fill('input[type="email"]', newUser.email)
    await page.fill('input[id="username"]', newUser.username)
    await page.fill('input[id="full_name"]', newUser.full_name)
    await page.fill('input[type="password"]', newUser.password)
    
    // 点击注册按钮
    await page.click('button[type="submit"]:has-text("注册")')
    
    // 验证跳转到首页或任务页面
    await expect(page).toHaveURL(/\/(tasks|)$/, { timeout: 10000 })
    
    // 验证注册成功（页面显示用户邮箱）
    await expect(page.locator(`text=${newUser.email}`)).toBeVisible()
  })

  test('已存在的邮箱应该显示错误', async ({ page }) => {
    // 使用已存在的邮箱
    await page.fill('input[type="email"]', testUsers.validUser.email)
    await page.fill('input[id="username"]', 'testuser')
    await page.fill('input[type="password"]', 'password123')
    
    // 点击注册按钮
    await page.click('button[type="submit"]:has-text("注册")')
    
    // 验证错误提示
    await expect(page.locator('text=/已存在|already exists|注册失败/')).toBeVisible()
    
    // 验证仍在注册页面
    await expect(page).toHaveURL('/register')
  })

  test('密码太短应该触发验证', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'short')
    
    // 点击注册按钮
    await page.click('button[type="submit"]:has-text("注册")')
    
    // HTML5 验证会阻止提交
    await expect(page).toHaveURL('/register')
  })

  test('应该显示登录链接', async ({ page }) => {
    // 验证登录链接存在
    await expect(page.locator('a:has-text("登录")')).toBeVisible()
    
    // 点击登录链接
    await page.click('a:has-text("登录")')
    
    // 验证跳转到登录页面
    await expect(page).toHaveURL('/login')
  })
})

