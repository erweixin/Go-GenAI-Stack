import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'
import { getVersionInfo, logVersionInfo, getVersionDefines } from './scripts/version.js'

// 获取当前文件目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 获取版本信息
const versionInfo = getVersionInfo(process.env)

// 打印版本信息
logVersionInfo(versionInfo)

// https://vite.dev/config/
export default defineConfig({
  // 定义全局常量（注入到前端代码）
  define: getVersionDefines(versionInfo),
  
  plugins: [
    react(),
    tailwindcss(),
    
    // Sentry 插件（仅在生产构建时启用）
    !versionInfo.isDev && process.env.VITE_SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG || 'go-genai-stack',
      project: process.env.VITE_SENTRY_PROJECT || 'web',
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      
      // Source Map 上传配置
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules'],
        filesToDeleteAfterUpload: ['**/*.js.map'], // 上传后删除 source map 文件
      },
      
      // Release 配置
      release: {
        name: `go-genai-stack-web@${versionInfo.releaseName}`,
        cleanArtifacts: true,
        setCommits: {
          auto: true,
          ignoreMissing: true,
        },
      },
      
      // 调试配置
      debug: false,
      silent: false,
    }),
  ].filter(Boolean),
  
  build: {
    // 生成 Source Map（生产环境）
    sourcemap: true,
    
    // Rollup 配置
    rollupOptions: {
      output: {
        // Source Map 文件命名
        sourcemapExcludeSources: false,
      },
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
