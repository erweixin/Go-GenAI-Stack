/**
 * 队列处理器引导模块
 * 自动发现并注册所有领域的队列处理器
 *
 * 设计模式：Auto-discovery Pattern
 * - 自动扫描各个领域，查找并注册处理器
 * - 支持开发环境的示例处理器
 * - 支持生产环境的领域处理器
 */

import { processorRegistry } from './registry.js';
import type { JobProcessor } from './types.js';
import { getGlobalLogger } from '../monitoring/logger/logger.js';

/**
 * 注册领域处理器
 * 从各个领域动态导入并注册处理器
 *
 * 领域处理器应该遵循以下约定：
 * - 文件路径：domains/{domain}/queue/processors.ts
 * - 导出函数：registerProcessors(registry: ProcessorRegistry)
 *
 * @param domains 要扫描的领域列表（可选，默认自动发现）
 */
async function registerDomainProcessors(domains?: string[]): Promise<void> {
  const logger = getGlobalLogger();

  // 如果没有指定领域，尝试从配置或环境变量获取
  // 或者扫描所有可能的领域
  const domainsToScan = domains || ['task', 'user', 'auth', 'llm'];

  let registeredCount = 0;

  for (const domain of domainsToScan) {
    try {
      // 动态导入领域处理器
      const processorsModule = await import(`../../domains/${domain}/queue/processors.js`);

      // 检查是否有注册函数
      if (
        processorsModule.registerProcessors &&
        typeof processorsModule.registerProcessors === 'function'
      ) {
        // 调用注册函数（不再传递 processorRegistry，直接使用全局实例）
        processorsModule.registerProcessors();
        registeredCount++;

        logger?.info('Domain processors registered', {
          component: 'QueueBootstrap',
          domain,
        });
      } else {
        logger?.debug('No processors found in domain', {
          component: 'QueueBootstrap',
          domain,
        });
      }
    } catch (error) {
      // 领域可能没有队列处理器，这是正常的，只记录调试日志
      logger?.debug('Domain has no queue processors', {
        component: 'QueueBootstrap',
        domain,
        error:
          error instanceof Error &&
          'code' in error &&
          (error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND'
            ? 'module not found'
            : error instanceof Error
              ? error.message
              : String(error),
      });
    }
  }

  logger?.info('Domain processors registration completed', {
    component: 'QueueBootstrap',
    scannedDomains: domainsToScan.length,
    registeredDomains: registeredCount,
  });
}

/**
 * 队列处理器引导结果
 */
export interface QueueProcessorsResult {
  /**
   * 按队列分组的处理器映射
   * { queueName: { jobName: processor } }
   */
  processorsByQueue: Record<string, Record<string, JobProcessor>>;

  /**
   * 所有已注册的队列名称
   */
  queueNames: string[];

  /**
   * 处理器总数
   */
  totalProcessors: number;
}

/**
 * 引导队列处理器注册
 *
 * 执行顺序：
 * 1. 注册领域处理器（生产环境）
 * 2. 注册示例处理器（开发环境）
 *
 * @param options 引导选项
 * @returns 按队列分组的处理器映射
 */
export async function bootstrapQueueProcessors(options?: {
  /**
   * 是否注册示例处理器（默认：开发环境自动注册）
   */
  includeExamples?: boolean;

  /**
   * 要扫描的领域列表（可选）
   */
  domains?: string[];
}): Promise<QueueProcessorsResult> {
  const logger = getGlobalLogger();
  logger?.info('Bootstrapping queue processors', {
    component: 'QueueBootstrap',
  });

  // 1. 先注册领域处理器（生产环境的主要处理器）
  await registerDomainProcessors(options?.domains);

  // 按队列分组处理器
  const processorsByQueue = processorRegistry.getProcessorsByQueue();
  const queueNames = processorRegistry.getQueueNames();

  logger?.info('Queue processors bootstrap completed', {
    component: 'QueueBootstrap',
    totalProcessors: processorRegistry.size(),
    queueNames,
    processorsByQueue: Object.keys(processorsByQueue).map(queueName => ({
      queueName,
      processorCount: Object.keys(processorsByQueue[queueName]).length,
      jobNames: Object.keys(processorsByQueue[queueName]),
    })),
  });

  return {
    processorsByQueue,
    queueNames,
    totalProcessors: processorRegistry.size(),
  };
}
