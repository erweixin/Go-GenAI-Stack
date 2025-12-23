/**
 * 队列处理器注册表
 * 集中管理所有任务处理器，支持动态注册
 *
 * 设计模式：Registry Pattern
 * - 各领域可以自行注册处理器
 * - 支持自动发现和注册
 * - 类型安全的处理器管理
 */

import type { JobProcessor, QueueTaskData } from './types.js';
import { getGlobalLogger } from '../monitoring/logger/logger.js';

/**
 * 处理器注册选项
 */
export interface ProcessorRegistrationOptions {
  /**
   * 队列名称（必填）
   */
  queueName: string;
}

/**
 * 处理器注册表
 * 单例模式，全局共享
 */
class ProcessorRegistry {
  private processors = new Map<string, JobProcessor>();
  private queueMapping = new Map<string, string>(); // jobName -> queueName
  private logger = getGlobalLogger();

  /**
   * 注册处理器
   *
   * @param jobName 任务名称
   * @param processor 处理器函数（支持泛型类型，但内部统一存储为 JobProcessor）
   * @param options 注册选项（必须指定队列名称）
   * @throws {Error} 如果任务名称已注册或队列名称未指定
   */
  register<T extends QueueTaskData = QueueTaskData>(
    jobName: string,
    processor: JobProcessor<T>,
    options: ProcessorRegistrationOptions
  ): void {
    if (!options.queueName || options.queueName.trim().length === 0) {
      throw new Error(`Queue name is required for job "${jobName}"`);
    }

    if (this.processors.has(jobName)) {
      const error = new Error(`Processor for job "${jobName}" is already registered`);
      this.logger?.error('Failed to register processor', {
        component: 'ProcessorRegistry',
        jobName,
        error: error.message,
      });
      throw error;
    }

    // 类型断言：将泛型处理器转换为通用 JobProcessor
    // 因为所有处理器都符合 JobProcessor 的签名
    this.processors.set(jobName, processor as JobProcessor);
    this.queueMapping.set(jobName, options.queueName);

    this.logger?.info('Processor registered', {
      component: 'ProcessorRegistry',
      jobName,
      queueName: options.queueName,
      totalProcessors: this.processors.size,
    });
  }

  /**
   * 获取所有已注册的处理器
   *
   * @returns 处理器映射对象
   */
  getAll(): Record<string, JobProcessor> {
    return Object.fromEntries(this.processors);
  }

  /**
   * 获取指定任务名称的处理器
   *
   * @param jobName 任务名称
   * @returns 处理器函数，如果不存在则返回 undefined
   */
  get(jobName: string): JobProcessor | undefined {
    return this.processors.get(jobName);
  }

  /**
   * 检查处理器是否已注册
   *
   * @param jobName 任务名称
   * @returns 是否已注册
   */
  has(jobName: string): boolean {
    return this.processors.has(jobName);
  }

  /**
   * 获取已注册的处理器数量
   */
  size(): number {
    return this.processors.size;
  }

  /**
   * 获取所有已注册的任务名称
   */
  getJobNames(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * 获取任务所属的队列名称
   *
   * @param jobName 任务名称
   * @returns 队列名称，如果未注册则返回 undefined
   */
  getQueueName(jobName: string): string | undefined {
    return this.queueMapping.get(jobName);
  }

  /**
   * 按队列分组获取所有处理器
   *
   * @returns 按队列分组的处理器映射 { queueName: { jobName: processor } }
   */
  getProcessorsByQueue(): Record<string, Record<string, JobProcessor>> {
    const result: Record<string, Record<string, JobProcessor>> = {};

    for (const [jobName, processor] of this.processors) {
      const queueName = this.queueMapping.get(jobName);
      if (!queueName) {
        // 理论上不应该发生，因为注册时必须指定队列
        this.logger?.warn('Processor has no queue mapping', {
          component: 'ProcessorRegistry',
          jobName,
        });
        continue;
      }

      if (!result[queueName]) {
        result[queueName] = {};
      }
      result[queueName][jobName] = processor;
    }

    return result;
  }

  /**
   * 获取所有队列名称
   *
   * @returns 所有已注册的队列名称列表
   */
  getQueueNames(): string[] {
    return Array.from(new Set(this.queueMapping.values()));
  }

  /**
   * 清空所有注册的处理器（主要用于测试）
   */
  clear(): void {
    this.processors.clear();
    this.queueMapping.clear();
    this.logger?.info('Processor registry cleared', {
      component: 'ProcessorRegistry',
    });
  }
}

/**
 * 全局处理器注册表实例
 * 单例模式，所有领域共享同一个注册表
 */
export const processorRegistry = new ProcessorRegistry();
