# E2E 测试使用指南

本文档介绍如何在 `frontend/web` 项目中编写和运行端到端（E2E）测试。

---

## 📋 目录

- [快速开始](#快速开始)
- [测试环境](#测试环境)
- [测试框架](#测试框架)
- [测试组织](#测试组织)
- [编写测试](#编写测试)
- [运行测试](#运行测试)
- [调试技巧](#调试技巧)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 快速开始

### 前置条件

1. **Docker**: 确保 Docker 已安装并运行
2. **Node.js**: 确保 Node.js 20+ 已安装
3. **pnpm**: 确保 pnpm 9+ 已安装

### 一键运行（推荐）⭐

```bash
cd frontend/web

# 启动环境 → 运行测试 → 清理环境
pnpm e2e:all
```

### 分步运行

```bash
# 1. 启动 E2E 环境（Docker）
pnpm e2e:setup

# 2. 运行测试
pnpm e2e              # 命令行模式
pnpm e2e:ui           # UI 模式（推荐）⭐
pnpm e2e:headed       # 有头模式（显示浏览器）
pnpm e2e:debug        # 调试模式

# 3. 停止环境
pnpm e2e:teardown     # 保留数据
pnpm e2e:clean        # 完全清理
```

---

## 测试环境

### 架构设计

我们使用 **混合模式**：Postgres + Backend 运行在 Docker，Frontend 运行在 Host。

```
┌─────────────────────────────────────┐
│ Host 机器                            │
│                                      │
│  Frontend (pnpm dev)                 │  ← 快速启动
│  Playwright 测试运行器                │  ← 易于调试
│                                      │
│  ┌─────────────────────────────────┐│
│  │ Docker                           ││
│  │  - postgres-e2e (:5433)          ││ ← 环境隔离
│  │  - backend-e2e  (:8081)          ││ ← 预置数据
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 服务端口

| 服务 | 开发环境 | E2E 环境 |
|------|---------|---------|
| Postgres | :5432 | :5433 ✅ |
| Backend | :8080 | :8081 ✅ |
| Frontend | :5173 | :5173 (Host) |

**✅ 可以同时运行开发环境和 E2E 环境！**

### 测试凭据

- **Email**: `e2e-test@example.com`
- **Password**: `Test123456!`
- **User ID**: `00000000-0000-0000-0000-000000000001`

---

## 测试框架

我们使用 **Playwright**：

| 特性 | 说明 |
|------|------|
| **跨浏览器** | Chromium, Firefox, Safari |
| **自动等待** | 自动等待元素可见、可交互 |
| **截图/视频** | 失败时自动保存 |
| **UI 模式** | 可视化调试工具 |
| **TypeScript** | 原生支持 |

---

## 测试组织

### 目录结构

```
e2e/
├── auth/                       # 认证流程测试
│   ├── login.spec.ts           # 登录测试（5个测试）
│   └── register.spec.ts        # 注册测试（4个测试）
├── task/                       # 任务管理测试
│   ├── create-task.spec.ts     # 创建任务（5个测试）
│   ├── task-operations.spec.ts # 任务操作（4个测试）
│   └── task-flow.spec.ts       # 完整流程（3个测试）
├── fixtures/                   # 测试数据
│   └── test-data.ts            # testUsers, testTasks
├── helpers/                    # 辅助函数
│   ├── auth-helpers.ts         # 登录、注册、登出
│   └── task-helpers.ts         # 任务 CRUD 操作
└── README.md                   # E2E 测试文档
```

**总计**: 21+ 个测试用例

---

## 编写测试

### 1. 基础测试结构

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('登录流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前的准备工作
    await page.goto('/login')
  })

  test('应该成功登录', async ({ page }) => {
    // 填写表单
    await page.fill('input[type="email"]', 'e2e-test@example.com')
    await page.fill('input[type="password"]', 'Test123456!')

    // 点击登录
    await page.click('button:has-text("登录")')

    // 验证跳转
    await expect(page).toHaveURL(/\/(tasks|)$/)

    // 验证用户信息显示
    await expect(page.locator('text=e2e-test@example.com')).toBeVisible()
  })
})
```

### 2. 使用辅助函数

```typescript
// e2e/helpers/auth-helpers.ts
import { Page } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

export async function loginAsTestUser(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', testUsers.validUser.email)
  await page.fill('input[type="password"]', testUsers.validUser.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(tasks|)$/)
}
```

```typescript
// 在测试中使用
import { loginAsTestUser } from '../helpers/auth-helpers'

test.describe('任务管理', () => {
  test.beforeEach(async ({ page }) => {
    // 使用辅助函数登录
    await loginAsTestUser(page)
  })

  test('应该创建任务', async ({ page }) => {
    // 测试逻辑...
  })
})
```

### 3. 使用测试数据

```typescript
// e2e/fixtures/test-data.ts
export const testTasks = {
  basic: {
    title: 'E2E Test Task',
    description: 'Test description',
    priority: 'medium' as const
  },
  urgent: {
    title: 'Urgent Task',
    priority: 'high' as const
  }
}
```

```typescript
// 在测试中使用
import { testTasks } from '../fixtures/test-data'

test('创建任务', async ({ page }) => {
  await page.fill('input[id="title"]', testTasks.basic.title)
  await page.fill('textarea[id="description"]', testTasks.basic.description)
  // ...
})
```

### 4. 完整测试示例

```typescript
// e2e/task/create-task.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsTestUser } from '../helpers/auth-helpers'
import { testTasks } from '../fixtures/test-data'

test.describe('创建任务', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
    await page.goto('/tasks')
  })

  test('应该成功创建任务', async ({ page }) => {
    // 点击新建按钮
    await page.click('button:has-text("新建任务")')

    // 等待对话框
    await expect(page.locator('text=新建任务')).toBeVisible()

    // 填写表单
    await page.fill('input[id="title"]', testTasks.basic.title)
    await page.fill('textarea[id="description"]', testTasks.basic.description)

    // 提交
    await page.click('button:has-text("创建")')

    // 验证任务出现在列表
    await expect(page.locator(`text=${testTasks.basic.title}`)).toBeVisible()
  })

  test('空标题应该无法创建', async ({ page }) => {
    await page.click('button:has-text("新建任务")')
    await page.fill('textarea[id="description"]', 'Only description')
    await page.click('button:has-text("创建")')

    // 验证对话框仍然显示（未关闭）
    await expect(page.locator('input[id="title"]')).toBeVisible()
  })
})
```

---

## 运行测试

### 开发时

```bash
# UI 模式（强烈推荐）⭐
pnpm e2e:ui
```

**UI 模式优势**：
- 🎯 可视化查看每个步骤
- 📸 查看测试截图
- 🌐 查看网络请求
- 🐞 逐步调试
- ⏯️ 时间旅行

### 命令行模式

```bash
# 运行所有测试
pnpm e2e

# 运行特定文件
pnpm e2e login.spec.ts

# 运行特定浏览器
pnpm e2e:chromium

# 有头模式（显示浏览器）
pnpm e2e:headed
```

### 调试模式

```bash
# 调试模式（暂停在每个操作）
pnpm e2e:debug

# 调试特定测试
pnpm e2e:debug login.spec.ts
```

### CI 模式

```bash
# CI 模式（无头，生成报告）
pnpm e2e:ci
```

---

## 调试技巧

### 1. 使用 UI 模式

```bash
pnpm e2e:ui
```

最强大的调试工具！可以：
- 查看每个步骤的 DOM 状态
- 查看截图
- 查看网络请求
- 逐步执行

### 2. 使用 page.pause()

```typescript
test('调试测试', async ({ page }) => {
  await page.goto('/tasks')

  await page.pause()  // 暂停在这里，打开 Playwright Inspector

  await page.click('button')
})
```

### 3. 截图

```typescript
// 手动截图
await page.screenshot({ path: 'screenshot.png' })

// 元素截图
await page.locator('.task-item').screenshot({ path: 'task.png' })
```

### 4. 查看测试报告

```bash
# 生成并打开 HTML 报告
pnpm exec playwright show-report
```

### 5. 查看失败的测试

失败的测试会自动保存：
- 📸 截图：`test-results/`
- 🎥 视频：`test-results/`
- 📄 报告：`playwright-report/`

---

## 最佳实践

### 1. 使用明确的选择器

```typescript
// ✅ Good
await page.click('button[data-testid="create-task"]')
await page.click('button[type="submit"]:has-text("登录")')

// ❌ Bad
await page.click('button')  // 太模糊
await page.click('.btn-primary')  // 依赖样式类
```

### 2. 使用 Playwright 的自动等待

```typescript
// ✅ Good: Playwright 自动等待
await page.click('button')
await expect(page.locator('text=Success')).toBeVisible()

// ❌ Bad: 硬编码延迟
await page.click('button')
await page.waitForTimeout(3000)  // 不可靠
```

### 3. 使用 beforeEach 准备状态

```typescript
test.describe('任务管理', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前都登录
    await loginAsTestUser(page)
    await page.goto('/tasks')
  })

  test('测试1', async ({ page }) => { /* ... */ })
  test('测试2', async ({ page }) => { /* ... */ })
})
```

### 4. 使用测试数据和辅助函数

```typescript
// ✅ Good
import { testUsers } from '../fixtures/test-data'
await page.fill('input', testUsers.validUser.email)

// ❌ Bad
await page.fill('input', 'test@example.com')  // 硬编码
```

### 5. 验证用户可见的内容

```typescript
// ✅ Good: 验证用户看到的内容
await expect(page.locator('text=任务创建成功')).toBeVisible()

// ❌ Bad: 验证 API 响应（不是 E2E 的职责）
```

---

## 常见问题

### Q1: 如何启动 E2E 环境？

```bash
# 方式 1: 使用 npm 脚本
pnpm e2e:setup

# 方式 2: 使用 Docker Compose
cd docker
docker-compose -f docker-compose-e2e.yml up -d

# 方式 3: 使用启动脚本
./docker/e2e/start.sh
```

### Q2: 如何查看 Docker 服务状态？

```bash
cd docker
docker-compose -f docker-compose-e2e.yml ps
```

### Q3: 如何查看 Docker 日志？

```bash
# 所有服务
docker-compose -f docker/docker-compose-e2e.yml logs -f

# 特定服务
docker-compose -f docker/docker-compose-e2e.yml logs -f backend-e2e
```

### Q4: 测试失败后如何清理环境？

```bash
# 完全清理（删除数据）
pnpm e2e:clean

# 或
./docker/e2e/stop.sh --clean
```

### Q5: 如何跳过测试？

```typescript
test.skip('临时跳过的测试', async ({ page }) => {
  // ...
})

test.only('只运行这个测试', async ({ page }) => {
  // ...
})
```

### Q6: 测试环境和开发环境冲突吗？

**不冲突！** 它们使用不同的端口：

- E2E: Postgres(:5433), Backend(:8081)
- Dev: Postgres(:5432), Backend(:8080)

可以同时运行！

---

## 环境管理

### 启动环境

```bash
./docker/e2e/start.sh
```

### 停止环境

```bash
# 停止但保留数据
./docker/e2e/stop.sh

# 停止并清理所有数据
./docker/e2e/stop.sh --clean
```

### 验证环境

```bash
# 检查健康状态
curl http://localhost:8081/health

# 测试登录
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-test@example.com","password":"Test123456!"}'
```

---

## 相关资源

- [Playwright 文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [E2E 测试方案](../../../docs/FRONTEND_E2E_PLAN.md)
- [Docker E2E 环境](../../../docker/e2e/README.md)
- [E2E 测试完成报告](../../../docs/FRONTEND_E2E_COMPLETE.md)

---

**最后更新**: 2025-11-27  
**维护者**: Frontend Team

