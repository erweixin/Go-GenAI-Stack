/**
 * 队列类型定义
 * 定义队列接口和任务类型
 */

import type { Job, Queue, Worker } from 'bullmq';

/**
 * 队列任务数据接口
 * 所有任务数据都需要实现这个接口
 */
export interface QueueTaskData {
  taskId: string;
  [key: string]: unknown;
}

/**
 * 队列客户端接口
 * 用于发布任务到队列
 */
export interface QueueClient {
  /**
   * 添加任务到队列
   *
   * @param queueName 队列名称
   * @param jobName 任务名称
   * @param data 任务数据
   * @param options 任务选项（延迟、优先级、重试等）
   * @returns 任务 ID
   */
  addJob<T extends QueueTaskData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: QueueJobOptions
  ): Promise<string>;

  /**
   * 获取队列实例
   *
   * @param queueName 队列名称
   * @returns 队列实例
   */
  getQueue(queueName: string): Queue;

  /**
   * 关闭所有队列连接
   */
  close(): Promise<void>;
}

/**
 * 队列任务选项
 */
export interface QueueJobOptions {
  /**
   * 延迟执行时间（毫秒）
   */
  delay?: number;

  /**
   * 任务优先级（数字越大优先级越高）
   */
  priority?: number;

  /**
   * 最大重试次数
   */
  attempts?: number;

  /**
   * 重试延迟（毫秒）
   */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };

  /**
   * 任务超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 任务 ID（用于幂等性）
   */
  jobId?: string;

  /**
   * 移除任务选项
   */
  removeOnComplete?: boolean | number; // true = 保留所有，false = 不保留，数字 = 保留 N 个
  removeOnFail?: boolean | number;
}

/**
 * 任务处理器函数类型
 */
export type JobProcessor<T extends QueueTaskData = QueueTaskData> = (job: Job<T>) => Promise<void>;

/**
 * Worker 配置
 */
export interface WorkerConfig {
  /**
   * 队列名称
   */
  queueName: string;

  /**
   * 并发数（同时处理的任务数）
   */
  concurrency?: number;

  /**
   * 任务处理器映射
   * key: 任务名称，value: 处理器函数
   */
  processors: Record<string, JobProcessor>;

  /**
   * 是否启用自动重试
   */
  enableRetry?: boolean;

  /**
   * 最大重试次数（默认 3）
   */
  maxRetries?: number;
}

/**
 * Worker 管理器接口
 */
export interface WorkerManager {
  /**
   * 启动 Worker
   *
   * @param config Worker 配置
   * @returns Worker 实例
   */
  startWorker(config: WorkerConfig): Worker;

  /**
   * 停止所有 Worker
   */
  stopAll(): Promise<void>;
}
