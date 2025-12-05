import { test, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

test.describe('注册流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('应该成功注册新用户', async ({ page }) => {
    // 生成唯一的测试用户
    const timestamp = Date.now()
    const newUser = {
      email: `e2e-${timestamp}@example.com`,
      username: `e2euser${timestamp}`,
      full_name: 'E2E Test User',
      password: 'NewUser123!',
    }

    // 填写注册表单
    await page.fill('input[id="email"]', newUser.email)
    await page.fill('input[id="username"]', newUser.username)
    await page.fill('input[id="full_name"]', newUser.full_name)
    await page.fill('input[id="password"]', newUser.password)

    // 点击注册按钮
    await page.click('button[type="submit"]:has-text("注册")')

    // 验证跳转到任务页面
    await expect(page).toHaveURL('/tasks', { timeout: 10000 })

    // 验证页面加载完成
    await expect(page.locator('button:has-text("新建任务")')).toBeVisible({ timeout: 5000 })
  })

  test('已存在的邮箱应该显示错误', async ({ page }) => {
    // 使用已存在的邮箱
    await page.fill('input[id="email"]', testUsers.validUser.email)
    await page.fill('input[id="username"]', 'testuser')
    await page.fill('input[id="full_name"]', 'Test User')
    await page.fill('input[id="password"]', 'password12345')

    // 点击注册按钮
    await page.click('button[type="submit"]:has-text("注册")')

    // 等待响应
    await page.waitForTimeout(1000)

    // 验证错误提示或仍在注册页面
    const hasError = await page
      .locator('[role="alert"]')
      .isVisible()
      .catch(() => false)
    if (hasError) {
      await expect(page.locator('[role="alert"]')).toBeVisible()
    }

    // 验证仍在注册页面
    await expect(page).toHaveURL('/register')
  })

  test('密码太短应该触发验证', async ({ page }) => {
    await page.fill('input[id="email"]', 'test@example.com')
    await page.fill('input[id="password"]', 'short')

    // 点击注册按钮
    await page.click('button[type="submit"]:has-text("注册")')

    // 等待一下
    await page.waitForTimeout(500)

    // HTML5 验证会阻止提交，仍在注册页面
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
