import { Page, expect } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

/**
 * E2E 认证辅助函数
 */

/**
 * 以测试用户身份登录
 */
export async function loginAsTestUser(page: Page) {
  await page.goto('/login')
  
  // 填写登录表单
  await page.fill('input[type="email"]', testUsers.validUser.email)
  await page.fill('input[type="password"]', testUsers.validUser.password)
  
  // 点击登录按钮
  await page.click('button[type="submit"]:has-text("登录")')
  
  // 等待跳转到任务页面或首页
  await page.waitForURL(/\/(tasks|)$/)
}

/**
 * 注册新用户
 */
export async function registerNewUser(
  page: Page,
  userData = testUsers.newUser
) {
  await page.goto('/register')
  
  // 填写注册表单
  await page.fill('input[type="email"]', userData.email)
  await page.fill('input[id="username"]', userData.username || '')
  await page.fill('input[id="full_name"]', userData.full_name || '')
  await page.fill('input[type="password"]', userData.password)
  
  // 点击注册按钮
  await page.click('button[type="submit"]:has-text("注册")')
  
  // 等待跳转
  await page.waitForURL(/\/(tasks|)$/)
}

/**
 * 登出
 */
export async function logout(page: Page) {
  // 查找并点击登出按钮
  await page.click('button:has-text("登出")')
  
  // 等待跳转到登录页面
  await page.waitForURL('/login')
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // 检查是否有用户邮箱显示
    await page.waitForSelector('text=' + testUsers.validUser.email, { timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * 确保已登录（如果未登录则登录）
 */
export async function ensureLoggedIn(page: Page) {
  const loggedIn = await isLoggedIn(page)
  if (!loggedIn) {
    await loginAsTestUser(page)
  }
}

