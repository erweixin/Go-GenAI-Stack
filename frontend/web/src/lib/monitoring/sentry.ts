/**
 * Sentry 监控配置
 * 
 * 功能：
 * - 错误捕获和追踪
 * - 性能监控
 * - 会话重放
 * - 用户上下文
 */

import * as Sentry from '@sentry/react'

/**
 * 初始化 Sentry
 * 
 * 在应用启动时调用一次
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.MODE
  
  // 如果没有配置 DSN，则不初始化
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  Sentry.init({
    // DSN 配置
    dsn,
    
    // 环境标识
    environment,
    
    // 版本号（用于 Release 追踪）
    // 注意：通过 vite 的 define 注入，见 vite.config.js
    release: `go-genai-stack-web@${import.meta.env.VITE_RELEASE_NAME || '1.0.0'}`,
    
    // ==================== 集成配置 ====================
    integrations: [
      ...Sentry.getDefaultIntegrations({}),
      
      // 浏览器追踪（性能监控）
      Sentry.browserTracingIntegration(),
      
      // 会话重放（可选，用于重现用户操作）
      Sentry.replayIntegration({
        // 遮罩敏感信息
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        
        // 网络请求记录
        networkDetailAllowUrls: [window.location.origin],
        networkCaptureBodies: true,
        networkRequestHeaders: ['User-Agent'],
        networkResponseHeaders: ['Content-Type'],
      }),
    ],
    
    // 自动追踪组件更新（性能监控配置）
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/yourapp\.com/,
      /^\/api/,
    ],
    
    // ==================== 采样率配置 ====================
    
    // 性能追踪采样率
    // 开发环境：100% | 生产环境：10%
    tracesSampleRate: environment === 'development' ? 1.0 : 0.1,
    
    // 会话重放采样率（正常会话）
    // 开发环境：10% | 生产环境：1%
    replaysSessionSampleRate: environment === 'development' ? 0.1 : 0.01,
    
    // 会话重放采样率（发生错误时）
    // 始终录制错误会话，方便调试
    replaysOnErrorSampleRate: 1.0,
    
    // ==================== 数据过滤 ====================
    
    // 发送前处理（过滤敏感信息）
    beforeSend(event, hint) {
      // 移除密码字段
      if (event.request?.data) {
        const data = event.request.data
        if (typeof data === 'object' && data !== null) {
          const dataObj = data as Record<string, any>
          delete dataObj.password
          delete dataObj.oldPassword
          delete dataObj.newPassword
          delete dataObj.confirmPassword
          delete dataObj.token
          delete dataObj.accessToken
          delete dataObj.refreshToken
        }
      }
      
      // 过滤掉已知的无害错误
      const error = hint.originalException
      if (error instanceof Error) {
        // 忽略 ResizeObserver 错误（浏览器兼容性问题）
        if (error.message.includes('ResizeObserver loop limit exceeded')) {
          return null
        }
        
        // 忽略网络中断错误
        if (error.message.includes('Network request failed')) {
          return null
        }
      }
      
      return event
    },
    
    // 面包屑过滤（用户操作记录）
    beforeBreadcrumb(breadcrumb) {
      // 不记录 console.log
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null
      }
      
      // 遮罩 URL 中的敏感参数
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
        breadcrumb.data.to = breadcrumb.data.to.replace(/token=[^&]+/, 'token=***')
      }
      
      return breadcrumb
    },
    
    // ==================== 忽略错误 ====================
    
    // 忽略特定错误
    ignoreErrors: [
      // 浏览器扩展错误
      'top.GLOBALS',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      
      // 浏览器兼容性错误
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      
      // 网络错误（这些通常不是代码问题）
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      
      // 第三方脚本错误
      'Script error',
    ],
    
    // 忽略来自特定 URL 的错误
    denyUrls: [
      // 浏览器扩展
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      
      // 广告和统计脚本
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
    ],
    
    // ==================== 调试配置 ====================
    
    // 开发环境开启调试
    debug: environment === 'development',
  })
}

/**
 * 设置用户上下文
 * 
 * 在用户登录后调用，用于关联错误和用户
 */
export function setUser(user: {
  id: string
  email?: string
  username?: string
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  })
}

/**
 * 清除用户上下文
 * 
 * 在用户登出时调用
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * 设置自定义标签
 * 
 * 用于分类和过滤错误
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

/**
 * 设置额外上下文
 * 
 * 用于提供更多调试信息
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context)
}

/**
 * 手动捕获错误
 * 
 * 用于 try-catch 中的错误上报
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

/**
 * 手动捕获消息
 * 
 * 用于记录特定事件
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * 添加面包屑
 * 
 * 用于记录用户操作流程
 */
export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: 'info' | 'warning' | 'error'
  data?: Record<string, any>
}) {
  Sentry.addBreadcrumb(breadcrumb)
}

// 导出 Sentry 实例（用于高级用法）
export { Sentry }

