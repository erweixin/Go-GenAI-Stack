import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 只包含 src 目录下的测试文件
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    // 排除 e2e 目录（E2E 测试由 Playwright 运行）
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',  // 排除 Playwright E2E 测试
      '**/.{idea,git,cache,output,temp}/**',
    ],
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/App.tsx', // 入口文件，不需要测试
      ],
      thresholds: {
        lines: 7,
        functions: 7,
        branches: 7,
        statements: 7,
      },
    },
    // 并发运行测试
    pool: 'threads',
    // 测试超时时间
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

