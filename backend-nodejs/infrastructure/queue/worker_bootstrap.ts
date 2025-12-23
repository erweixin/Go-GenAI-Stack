/**
 * Worker 启动引导模块
 * 根据队列分组启动多个 Worker
 *
 * 设计模式：Bootstrap Pattern
 * - 根据处理器注册结果自动启动 Worker
 * - 每个队列启动独立的 Worker
 * - 支持队列级别的配置
 */

import type { WorkerManager } from './types.js';
import type { QueueProcessorsResult } from './bootstrap.js';
import type { Config } from '../config/config.js';
import { getGlobalLogger } from '../monitoring/logger/logger.js';

/**
 * 启动所有队列的 Worker
 *
 * @param workerManager Worker 管理器
 * @param queueProcessors 队列处理器引导结果
 * @param config 应用配置
 */
export function startQueueWorkers(
  workerManager: WorkerManager,
  queueProcessors: QueueProcessorsResult,
  config: Config
): void {
  const logger = getGlobalLogger();
  const { processorsByQueue, queueNames } = queueProcessors;

  if (queueNames.length === 0) {
    logger?.warn('No queue processors registered, skipping worker startup', {
      component: 'WorkerBootstrap',
    });
    return;
  }

  logger?.info('Starting queue workers', {
    component: 'WorkerBootstrap',
    queueCount: queueNames.length,
    queueNames,
  });

  // 为每个队列启动独立的 Worker
  for (const queueName of queueNames) {
    const processors = processorsByQueue[queueName];

    if (!processors || Object.keys(processors).length === 0) {
      logger?.warn('Queue has no processors, skipping', {
        component: 'WorkerBootstrap',
        queueName,
      });
      continue;
    }

    // 启动 Worker
    workerManager.startWorker({
      queueName,
      concurrency: config.queue.worker.concurrency,
      processors,
      maxRetries: config.queue.worker.maxRetries,
    });

    logger?.info('Worker started for queue', {
      component: 'WorkerBootstrap',
      queueName,
      processorCount: Object.keys(processors).length,
      jobNames: Object.keys(processors),
      concurrency: config.queue.worker.concurrency,
    });
  }

  logger?.info('All queue workers started', {
    component: 'WorkerBootstrap',
    totalQueues: queueNames.length,
  });
}
