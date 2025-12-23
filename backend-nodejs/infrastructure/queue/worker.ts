/**
 * BullMQ Worker 实现
 * 用于处理队列中的任务
 */

import { Worker, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import type { Job } from 'bullmq';
import type { WorkerManager, WorkerConfig, QueueTaskData, JobProcessor } from './types.js';
import { getGlobalLogger } from '../monitoring/logger/logger.js';

/**
 * BullMQ Worker 管理器实现
 */
export class BullMQWorkerManager implements WorkerManager {
  private workers: Worker[] = [];
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
   * 启动 Worker
   */
  startWorker(config: WorkerConfig): Worker {
    const workerOptions: WorkerOptions = {
      connection: this.redisConnection,
      concurrency: config.concurrency || 10,
      maxStalledCount: 1, // 最大停滞次数
      stalledInterval: 30000, // 30 秒检查一次停滞任务
      removeOnComplete: {
        age: 24 * 3600, // 保留 24 小时
        count: 1000, // 最多保留 1000 个
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // 失败任务保留 7 天
      },
    };

    // 创建 Worker
    const worker = new Worker(
      config.queueName,
      async (job: Job<QueueTaskData>) => {
        const processor = config.processors[job.name];
        if (!processor) {
          throw new Error(`No processor found for job: ${job.name}`);
        }

        // 调用处理器（类型断言，因为处理器可能有不同的泛型类型）
        await (processor as JobProcessor)(job);
      },
      workerOptions
    );

    // 设置事件监听
    worker.on('completed', (job: Job) => {
      this.logger?.info('Job completed', {
        component: 'Worker',
        queueName: config.queueName,
        jobName: job.name,
        jobId: job.id,
        taskId: (job.data as QueueTaskData).taskId,
      });
    });

    worker.on('failed', (job: Job | undefined, error: Error) => {
      this.logger?.error('Job failed', {
        component: 'Worker',
        queueName: config.queueName,
        jobName: job?.name,
        jobId: job?.id,
        taskId: job ? (job.data as QueueTaskData).taskId : undefined,
        error: error.message,
        stack: error.stack,
      });
    });

    worker.on('error', (error: Error) => {
      this.logger?.error('Worker error', {
        component: 'Worker',
        queueName: config.queueName,
        error: error.message,
        stack: error.stack,
      });
    });

    worker.on('stalled', (jobId: string) => {
      this.logger?.warn('Job stalled', {
        component: 'Worker',
        queueName: config.queueName,
        jobId,
      });
    });

    this.workers.push(worker);

    this.logger?.info('Worker started', {
      component: 'Worker',
      queueName: config.queueName,
      concurrency: config.concurrency || 10,
      processors: Object.keys(config.processors),
    });

    return worker;
  }

  /**
   * 停止所有 Worker
   */
  async stopAll(): Promise<void> {
    const closePromises = this.workers.map(worker => worker.close());
    await Promise.all(closePromises);
    this.workers = [];

    this.logger?.info('All workers stopped', {
      component: 'Worker',
    });
  }
}

/**
 * 创建 Worker 管理器
 */
export function createWorkerManager(redisConfig: {
  host: string;
  port: number;
  password?: string;
  db: number;
}): WorkerManager {
  return new BullMQWorkerManager(redisConfig);
}
