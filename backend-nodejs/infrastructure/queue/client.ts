/**
 * BullMQ 队列客户端实现
 * 用于发布任务到队列
 */

import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import type { QueueClient, QueueJobOptions, QueueTaskData } from './types.js';
import { getGlobalLogger } from '../monitoring/logger/logger.js';

/**
 * BullMQ 队列客户端实现
 */
export class BullMQClient implements QueueClient {
  private queues = new Map<string, Queue>();
  private redisConnection: IORedis;
  private logger = getGlobalLogger();

  constructor(redisConfig: { host: string; port: number; password?: string; db: number }) {
    // BullMQ 需要 IORedis 连接
    this.redisConnection = new IORedis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
      maxRetriesPerRequest: null, // BullMQ 要求
    });
  }

  /**
   * 添加任务到队列
   */
  async addJob<T extends QueueTaskData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueJobOptions
  ): Promise<string> {
    const queue = this.getQueue(queueName);

    // 转换选项格式
    const bullMQOptions: {
      delay?: number;
      priority?: number;
      attempts?: number;
      backoff?: { type: 'fixed' | 'exponential'; delay: number };
      timeout?: number;
      jobId?: string;
      removeOnComplete?: boolean | number | { age?: number; count?: number };
      removeOnFail?: boolean | number | { age?: number; count?: number };
    } = {};

    if (options?.delay) {
      bullMQOptions.delay = options.delay;
    }
    if (options?.priority) {
      bullMQOptions.priority = options.priority;
    }
    if (options?.attempts) {
      bullMQOptions.attempts = options.attempts;
    }
    if (options?.backoff) {
      bullMQOptions.backoff = {
        type: options.backoff.type,
        delay: options.backoff.delay,
      };
    }
    if (options?.timeout) {
      bullMQOptions.timeout = options.timeout;
    }
    if (options?.jobId) {
      bullMQOptions.jobId = options.jobId;
    }
    if (options?.removeOnComplete !== undefined) {
      bullMQOptions.removeOnComplete = options.removeOnComplete;
    }
    if (options?.removeOnFail !== undefined) {
      bullMQOptions.removeOnFail = options.removeOnFail;
    }

    try {
      const job = await queue.add(jobName, data, bullMQOptions);

      this.logger?.info('Job added to queue', {
        component: 'QueueClient',
        queueName,
        jobName,
        jobId: job.id,
        taskId: data.taskId,
      });

      return job.id!;
    } catch (error) {
      this.logger?.error('Failed to add job to queue', {
        component: 'QueueClient',
        queueName,
        jobName,
        taskId: data.taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 获取队列实例（如果不存在则创建）
   */
  getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      // 创建队列配置
      const queueOptions: QueueOptions = {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: {
            age: 24 * 3600, // 保留 24 小时
            count: 1000, // 最多保留 1000 个
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // 失败任务保留 7 天
          },
        },
      };

      const queue = new Queue(queueName, queueOptions);
      this.queues.set(queueName, queue);

      this.logger?.info('Queue created', {
        component: 'QueueClient',
        queueName,
      });
    }

    return this.queues.get(queueName)!;
  }

  /**
   * 关闭所有队列连接
   */
  async close(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();

    this.logger?.info('All queues closed', {
      component: 'QueueClient',
    });
  }
}

/**
 * 创建队列客户端
 */
export function createQueueClient(redisConfig: {
  host: string;
  port: number;
  password?: string;
  db: number;
}): QueueClient {
  return new BullMQClient(redisConfig);
}
