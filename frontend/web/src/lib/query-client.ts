import { QueryClient } from '@tanstack/react-query'
import { captureException } from '@/lib/monitoring/sentry'

/**
 * React Query Client 配置
 * 
 * 用于数据缓存、自动重试、后台更新等
 * 
 * @see https://tanstack.com/query/latest/docs/react/reference/QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据缓存时间（毫秒）
      staleTime: 1000 * 60 * 5, // 5 分钟

      // 缓存生命周期（毫秒）
      gcTime: 1000 * 60 * 30, // 30 分钟

      // 失败重试配置
      retry: (failureCount, error: any) => {
        // 401/403 不重试（认证问题）
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false
        }
        // 最多重试 2 次
        return failureCount < 2
      },

      // 重试延迟（指数退避）
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // 窗口聚焦时自动重新获取
      refetchOnWindowFocus: false,

      // 网络重连时自动重新获取
      refetchOnReconnect: true,

      // 组件挂载时不自动重新获取（避免不必要的请求）
      refetchOnMount: false,

      // 错误处理
      throwOnError: false,
    },
    mutations: {
      // 失败重试（mutation 默认不重试）
      retry: false,

      // 错误处理
      onError: (error) => {
        // 上报到 Sentry
        if (error instanceof Error) {
          captureException(error, {
            type: 'mutation',
          })
        }
      },
    },
  },
})

