import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 *
 * 文档: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // 测试超时时间（30秒）
  timeout: 30000,

  // 断言超时
  expect: {
    timeout: 5000,
  },

  // 失败重试（CI 环境重试 2 次）
  retries: process.env.CI ? 2 : 0,

  // 并发运行（CI 环境串行，本地并行）
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [
    ['list'], // 控制台输出
    ['html', { outputFolder: 'playwright-report' }], // HTML 报告
    ['json', { outputFile: 'test-results/results.json' }], // JSON 结果
  ],

  use: {
    // Base URL（前端开发服务器）
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // 截图设置（仅失败时）
    screenshot: 'only-on-failure',

    // 视频录制（仅失败时保留）
    video: 'retain-on-failure',

    // 追踪（首次重试时启用）
    trace: 'on-first-retry',

    // 导航超时
    navigationTimeout: 10000,

    // 操作超时
    actionTimeout: 5000,
  },

  // 测试项目（浏览器配置）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // 可选：取消注释以启用更多浏览器
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'mobile',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  // 开发服务器配置
  // 注意：后端服务由 Docker 提供
  // 可以通过 E2E_BACKEND_URL 环境变量选择后端：
  //   - 默认: http://localhost:8081 (Go 后端)
  //   - Node.js: http://localhost:8082 (Node.js 后端)
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      // 指向 Docker 中的后端服务
      // 支持通过 E2E_BACKEND_URL 环境变量切换后端
      VITE_API_BASE_URL: process.env.E2E_BACKEND_URL || 'http://localhost:8081',
    },
  },
})
