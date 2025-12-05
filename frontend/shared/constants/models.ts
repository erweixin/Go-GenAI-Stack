/**
 * LLM 模型常量
 */

/**
 * 支持的模型列表
 */
export const MODELS = {
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  GEMINI_PRO: 'gemini-1.5-pro',
} as const

export type ModelName = (typeof MODELS)[keyof typeof MODELS]

/**
 * 模型显示名称
 */
export const MODEL_DISPLAY_NAMES: Record<ModelName, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
}

/**
 * 模型能力标签
 */
export const MODEL_CAPABILITIES = {
  FAST: 'fast', // 快速响应
  QUALITY: 'quality', // 高质量输出
  COST_EFFECTIVE: 'cost', // 成本优化
  LARGE_CONTEXT: 'context', // 大上下文
} as const

export type ModelCapability = (typeof MODEL_CAPABILITIES)[keyof typeof MODEL_CAPABILITIES]

/**
 * 模型元数据
 */
export interface ModelMetadata {
  name: ModelName
  displayName: string
  provider: 'openai' | 'anthropic' | 'google'
  capabilities: ModelCapability[]
  maxTokens: number
  description: string
}

/**
 * 模型元数据映射
 */
export const MODEL_METADATA: Record<ModelName, ModelMetadata> = {
  'gpt-4o': {
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    capabilities: ['quality', 'context'],
    maxTokens: 128000,
    description: 'OpenAI 最新旗舰模型，平衡性能与成本',
  },
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['fast', 'cost'],
    maxTokens: 128000,
    description: '快速且经济的选择',
  },
  'claude-3-5-sonnet-20241022': {
    name: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    capabilities: ['quality', 'context'],
    maxTokens: 200000,
    description: 'Anthropic 顶级模型，擅长复杂推理',
  },
  'claude-3-opus-20240229': {
    name: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    provider: 'anthropic',
    capabilities: ['quality'],
    maxTokens: 200000,
    description: 'Claude 3 系列最强模型',
  },
  'gemini-1.5-pro': {
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'google',
    capabilities: ['context', 'cost'],
    maxTokens: 1000000,
    description: 'Google 多模态模型，超大上下文窗口',
  },
}

/**
 * 路由策略
 */
export const ROUTING_STRATEGIES = {
  LATENCY: 'latency', // 最低延迟
  COST: 'cost', // 最低成本
  QUALITY: 'quality', // 最高质量
  BALANCED: 'balanced', // 平衡
} as const

export type RoutingStrategy = (typeof ROUTING_STRATEGIES)[keyof typeof ROUTING_STRATEGIES]

/**
 * 获取模型显示名称
 */
export function getModelDisplayName(model: ModelName): string {
  return MODEL_DISPLAY_NAMES[model] || model
}

/**
 * 根据能力筛选模型
 */
export function getModelsByCapability(capability: ModelCapability): ModelName[] {
  return Object.values(MODEL_METADATA)
    .filter((meta) => meta.capabilities.includes(capability))
    .map((meta) => meta.name)
}

/**
 * 按供应商分组模型
 */
export function getModelsByProvider(): Record<string, ModelName[]> {
  const grouped: Record<string, ModelName[]> = {}

  for (const meta of Object.values(MODEL_METADATA)) {
    if (!grouped[meta.provider]) {
      grouped[meta.provider] = []
    }
    grouped[meta.provider].push(meta.name)
  }

  return grouped
}
