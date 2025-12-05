/**
 * API 端点常量
 * 与后端路由保持一致
 */

export const API_ENDPOINTS = {
  /**
   * 聊天相关接口
   */
  chat: {
    send: '/api/chat/send',
    stream: '/api/chat/stream',
    history: '/api/chat/history',
    conversations: '/api/chat/conversations',
    createConversation: '/api/chat/conversations/create',
    deleteConversation: '/api/chat/conversations/:id/delete',
    exportConversation: '/api/chat/conversations/:id/export',
  },

  /**
   * LLM 相关接口
   */
  llm: {
    models: '/api/llm/models',
    generate: '/api/llm/generate',
    structuredOutput: '/api/llm/structured',
    selectModel: '/api/llm/select-model',
  },

  /**
   * 监控相关接口
   */
  monitoring: {
    metrics: '/api/monitoring/metrics',
    stats: '/api/monitoring/stats',
    traces: '/api/monitoring/traces',
    health: '/api/health',
  },

  /**
   * 用户相关接口
   */
  user: {
    login: '/api/user/login',
    logout: '/api/user/logout',
    profile: '/api/user/profile',
    settings: '/api/user/settings',
  },
} as const

/**
 * 构建带参数的 URL
 *
 * @example
 * buildUrl(API_ENDPOINTS.chat.deleteConversation, { id: 'conv-123' })
 * // "/api/chat/conversations/conv-123/delete"
 */
export function buildUrl(template: string, params: Record<string, string | number>): string {
  let url = template
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value))
  }
  return url
}
