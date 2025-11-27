import { Page, expect } from '@playwright/test'

/**
 * E2E 任务操作辅助函数
 */

/**
 * 创建任务
 */
export async function createTask(
  page: Page,
  taskData: {
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    tags?: string[]
  }
) {
  // 点击"新建任务"按钮
  await page.click('button:has-text("新建任务")')
  
  // 等待对话框出现
  await page.waitForSelector('input[id="title"]')
  
  // 填写表单
  await page.fill('input[id="title"]', taskData.title)
  
  if (taskData.description) {
    await page.fill('textarea[id="description"]', taskData.description)
  }
  
  if (taskData.priority) {
    // 选择优先级
    await page.click('button[role="combobox"]')
    const priorityMap = {
      low: '低',
      medium: '中',
      high: '高'
    }
    await page.click(`text=${priorityMap[taskData.priority]}`)
  }
  
  // 添加标签
  if (taskData.tags) {
    for (const tag of taskData.tags) {
      await page.fill('input[placeholder*="标签"]', tag)
      await page.click('button:has-text("添加")')
    }
  }
  
  // 提交表单
  await page.click('button:has-text("创建")')
  
  // 等待对话框关闭
  await page.waitForSelector('input[id="title"]', { state: 'hidden' })
  
  // 验证任务出现在列表中
  await expect(page.locator(`text=${taskData.title}`)).toBeVisible()
}

/**
 * 查找任务
 */
export async function findTask(page: Page, title: string) {
  return page.locator(`text=${title}`).first()
}

/**
 * 完成任务
 */
export async function completeTask(page: Page, title: string) {
  const taskLocator = await findTask(page, title)
  
  // 找到任务对应的完成按钮（Circle 图标）
  const taskCard = taskLocator.locator('..')
  await taskCard.locator('button[class*="focus:outline-none"]').first().click()
  
  // 验证任务状态变为完成（有删除线）
  await expect(page.locator(`text=${title}`).locator('..')).toHaveClass(/line-through/)
}

/**
 * 删除任务
 */
export async function deleteTask(page: Page, title: string) {
  const taskLocator = await findTask(page, title)
  
  // 找到删除按钮
  const taskCard = taskLocator.locator('..')
  await taskCard.locator('button:has(svg.lucide-trash-2)').click()
  
  // 等待任务从列表消失
  await expect(page.locator(`text=${title}`)).not.toBeVisible()
}

/**
 * 获取任务数量
 */
export async function getTaskCount(page: Page): Promise<number> {
  const countText = await page.locator('text=/共 \\d+ 个任务/').textContent()
  const match = countText?.match(/共 (\d+) 个任务/)
  return match ? parseInt(match[1], 10) : 0
}

