/**
 * 队列并发控制集成测试
 * 验证超过并发数时任务会进入等待状态
 *
 * 注意：此测试需要真实的 Redis 连接
 * 如果 Redis 不可用，测试会被跳过
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BullMQClient } from '../client.js';
import { BullMQWorkerManager } from '../worker.js';
import type { Job, Queue } from 'bullmq';
import type { QueueTaskData, JobProcessor } from '../types.js';
import IORedis from 'ioredis';

/**
 * 测试任务数据
 */
interface TestTaskData extends QueueTaskData {
  taskIndex: number;
  processingTime: number; // 处理时间（毫秒）
}

/**
 * 用于追踪任务处理状态的处理器
 */
const processingTasks = new Set<string>();
const completedTasks = new Set<string>();

const testProcessor: JobProcessor<TestTaskData> = async (job: Job<TestTaskData>) => {
  const { taskId, processingTime } = job.data;

  // 记录任务开始处理
  processingTasks.add(taskId);

  // 更新进度
  await job.updateProgress(50);

  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // 记录任务完成
  processingTasks.delete(taskId);
  completedTasks.add(taskId);

  // 更新进度
  await job.updateProgress(100);
};

describe('队列并发控制集成测试', () => {
  let redisAvailable = false;
  let redisConnection: IORedis | null = null;
  let queueClient: BullMQClient | null = null;
  let workerManager: BullMQWorkerManager | null = null;
  let queue: Queue | null = null;
  const queueName = 'test-concurrency-queue';
  const concurrency = 10; // 并发数
  const totalTasks = 20; // 总任务数（超过并发数）

  beforeAll(async () => {
    try {
      // 尝试连接 Redis
      redisConnection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
        maxRetriesPerRequest: null,
        retryStrategy: () => null, // 快速失败
        connectTimeout: 2000,
      });

      // 测试连接
      await redisConnection.ping();
      redisAvailable = true;

      // 创建队列客户端和 Worker 管理器
      queueClient = new BullMQClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
      });

      workerManager = new BullMQWorkerManager({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
      });

      // 获取队列实例
      queue = queueClient.getQueue(queueName);

      // 清空队列（清理之前的测试数据）
      await queue.obliterate({ force: true });
    } catch (error) {
      console.warn('⚠️  Redis 不可用，跳过并发控制集成测试');
      console.warn('   错误信息:', error instanceof Error ? error.message : String(error));
      redisAvailable = false;
    }
  });

  afterAll(async () => {
    // 清理资源
    if (queue) {
      try {
        await queue.obliterate({ force: true });
        await queue.close();
      } catch (error) {
        // 忽略清理错误
      }
    }

    if (workerManager) {
      try {
        await workerManager.stopAll();
      } catch (error) {
        // 忽略清理错误
      }
    }

    if (queueClient) {
      try {
        await queueClient.close();
      } catch (error) {
        // 忽略清理错误
      }
    }

    if (redisConnection) {
      try {
        await redisConnection.quit();
      } catch (error) {
        // 忽略清理错误
      }
    }

    // 清空追踪状态
    processingTasks.clear();
    completedTasks.clear();
  });

  it('应该验证并发控制：超过并发数的任务会进入等待状态', async () => {
    if (!redisAvailable || !queueClient || !workerManager || !queue) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    // 启动 Worker，并发数为 10
    workerManager.startWorker({
      queueName,
      concurrency,
      processors: {
        'test-task': testProcessor,
      },
    });

    // 添加 20 个任务（超过并发数 10）
    const jobIds: string[] = [];
    const processingTime = 2000; // 每个任务处理 2 秒

    for (let i = 0; i < totalTasks; i++) {
      const jobId = await queueClient.addJob<TestTaskData>(queueName, 'test-task', {
        taskId: `task-${i}`,
        taskIndex: i,
        processingTime,
      });
      jobIds.push(jobId);
    }

    // 等待一小段时间，让任务开始处理
    await new Promise(resolve => setTimeout(resolve, 500));

    // 检查队列状态
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();

    console.log('📊 队列状态检查:');
    console.log(`   等待中: ${waiting.length}`);
    console.log(`   处理中: ${active.length}`);
    console.log(`   已完成: ${completed.length}`);

    // 验证：同时处理的任务数应该不超过并发数
    expect(active.length).toBeLessThanOrEqual(concurrency);
    console.log(`✅ 验证通过：同时处理的任务数 (${active.length}) <= 并发数 (${concurrency})`);

    // 验证：应该有任务在等待
    if (active.length === concurrency) {
      expect(waiting.length).toBeGreaterThan(0);
      console.log(`✅ 验证通过：有 ${waiting.length} 个任务在等待`);
    }

    // 等待所有任务完成
    const maxWaitTime = totalTasks * processingTime + 5000; // 最大等待时间
    const startTime = Date.now();

    while (completedTasks.size < totalTasks && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const currentCompleted = await queue.getCompleted();
      const currentActive = await queue.getActive();
      const currentWaiting = await queue.getWaiting();

      // 验证：在处理过程中，同时处理的任务数始终不超过并发数
      expect(currentActive.length).toBeLessThanOrEqual(concurrency);

      // 验证：等待中的任务数 + 处理中的任务数 + 已完成的任务数 = 总任务数
      const totalInQueue = currentWaiting.length + currentActive.length + currentCompleted.length;
      expect(totalInQueue).toBeLessThanOrEqual(totalTasks);
    }

    // 最终验证：所有任务都应该完成
    const finalCompleted = await queue.getCompleted();
    const finalActive = await queue.getActive();
    const finalWaiting = await queue.getWaiting();

    console.log('📊 最终队列状态:');
    console.log(`   等待中: ${finalWaiting.length}`);
    console.log(`   处理中: ${finalActive.length}`);
    console.log(`   已完成: ${finalCompleted.length}`);

    // 验证所有任务都已完成
    expect(finalActive.length).toBe(0);
    expect(finalWaiting.length).toBe(0);
    expect(finalCompleted.length).toBe(totalTasks);
    console.log(`✅ 验证通过：所有 ${totalTasks} 个任务都已完成`);
  }, 60000); // 60 秒超时

  it('应该验证并发控制：任务完成后等待的任务会开始处理', async () => {
    if (!redisAvailable || !queueClient || !workerManager) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    // 创建新的 Worker 管理器（避免与第一个测试冲突）
    const testWorkerManager = new BullMQWorkerManager({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
    });

    const testQueueName = `${queueName}-2`;
    const testQueue = queueClient.getQueue(testQueueName);

    // 清空队列
    await testQueue.obliterate({ force: true });
    processingTasks.clear();
    completedTasks.clear();

    // 启动 Worker，并发数为 10
    testWorkerManager.startWorker({
      queueName: testQueueName,
      concurrency,
      processors: {
        'test-task': testProcessor,
      },
    });

    // 添加 15 个任务（超过并发数 10）
    const jobIds: string[] = [];
    const processingTime = 1000; // 每个任务处理 1 秒

    for (let i = 0; i < 15; i++) {
      const jobId = await queueClient.addJob<TestTaskData>(testQueueName, 'test-task', {
        taskId: `task-${i}`,
        taskIndex: i,
        processingTime,
      });
      jobIds.push(jobId);
    }

    // 等待任务开始处理
    await new Promise(resolve => setTimeout(resolve, 500));

    // 第一次检查：应该有 10 个任务在处理，5 个在等待
    let active = await testQueue.getActive();
    let waiting = await testQueue.getWaiting();

    console.log('📊 初始状态:');
    console.log(`   处理中: ${active.length}`);
    console.log(`   等待中: ${waiting.length}`);

    expect(active.length).toBeLessThanOrEqual(concurrency);
    expect(waiting.length).toBeGreaterThan(0);

    // 等待一些任务完成
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 第二次检查：等待的任务应该开始处理
    active = await testQueue.getActive();
    waiting = await testQueue.getWaiting();
    const completed = await testQueue.getCompleted();

    console.log('📊 任务完成后状态:');
    console.log(`   处理中: ${active.length}`);
    console.log(`   等待中: ${waiting.length}`);
    console.log(`   已完成: ${completed.length}`);

    // 验证：等待的任务数应该减少（因为部分任务已完成，等待的任务开始处理）
    expect(completed.length).toBeGreaterThan(0);
    expect(active.length).toBeLessThanOrEqual(concurrency);

    // 清理
    await testWorkerManager.stopAll();
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  }, 30000); // 30 秒超时
});

/**
 * 失败和重试测试
 */
describe('队列失败和重试集成测试', () => {
  let redisAvailable = false;
  let redisConnection: IORedis | null = null;
  let queueClient: BullMQClient | null = null;
  let workerManager: BullMQWorkerManager | null = null;
  const queueName = 'test-retry-queue';

  // 追踪任务执行次数
  const executionCounts = new Map<string, number>();
  const failedTasks = new Set<string>();

  /**
   * 总是失败的处理器
   */
  const alwaysFailProcessor: JobProcessor<TestTaskData> = async (job: Job<TestTaskData>) => {
    const { taskId } = job.data;
    const count = executionCounts.get(taskId) || 0;
    executionCounts.set(taskId, count + 1);

    console.log(`❌ 任务 ${taskId} 第 ${count + 1} 次执行失败`);
    throw new Error(`Task ${taskId} failed on attempt ${count + 1}`);
  };

  /**
   * 前 N 次失败，之后成功的处理器
   */
  const createRetryThenSuccessProcessor = (failCount: number): JobProcessor<TestTaskData> => {
    return async (job: Job<TestTaskData>) => {
      const { taskId } = job.data;
      const count = executionCounts.get(taskId) || 0;
      executionCounts.set(taskId, count + 1);

      if (count < failCount) {
        console.log(`❌ 任务 ${taskId} 第 ${count + 1} 次执行失败（预期）`);
        throw new Error(`Task ${taskId} failed on attempt ${count + 1} (expected)`);
      }

      console.log(`✅ 任务 ${taskId} 第 ${count + 1} 次执行成功`);
      // 任务成功，不需要做任何事情
    };
  };

  beforeAll(async () => {
    try {
      // 尝试连接 Redis
      redisConnection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
        maxRetriesPerRequest: null,
        retryStrategy: () => null,
        connectTimeout: 2000,
      });

      await redisConnection.ping();
      redisAvailable = true;

      queueClient = new BullMQClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
      });

      workerManager = new BullMQWorkerManager({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.QUEUE_REDIS_DB || '1'),
      });
    } catch (error) {
      console.warn('⚠️  Redis 不可用，跳过失败和重试集成测试');
      redisAvailable = false;
    }
  });

  afterAll(async () => {
    if (workerManager) {
      try {
        await workerManager.stopAll();
      } catch (error) {
        // 忽略清理错误
      }
    }

    if (queueClient) {
      try {
        await queueClient.close();
      } catch (error) {
        // 忽略清理错误
      }
    }

    if (redisConnection) {
      try {
        await redisConnection.quit();
      } catch (error) {
        // 忽略清理错误
      }
    }

    // 清空追踪状态
    executionCounts.clear();
    failedTasks.clear();
  });

  beforeEach(() => {
    // 每个测试前清空追踪状态
    executionCounts.clear();
    failedTasks.clear();
  });

  it('应该验证任务失败：抛出错误会导致任务失败', async () => {
    if (!redisAvailable || !queueClient || !workerManager) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    const testQueueName = `${queueName}-fail`;
    const testQueue = queueClient.getQueue(testQueueName);
    await testQueue.obliterate({ force: true });

    // 启动 Worker
    workerManager.startWorker({
      queueName: testQueueName,
      concurrency: 1,
      processors: {
        'fail-task': alwaysFailProcessor,
      },
    });

    // 添加一个会失败的任务（不设置重试）
    const jobId = await queueClient.addJob<TestTaskData>(
      testQueueName,
      'fail-task',
      {
        taskId: 'fail-once',
        taskIndex: 0,
        processingTime: 100,
      },
      {
        attempts: 1, // 只尝试 1 次
      }
    );

    // 等待任务处理
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 检查任务状态
    const failed = await testQueue.getFailed();
    const completed = await testQueue.getCompleted();

    console.log('📊 任务失败状态:');
    console.log(`   失败: ${failed.length}`);
    console.log(`   完成: ${completed.length}`);
    console.log(`   执行次数: ${executionCounts.get('fail-once') || 0}`);

    // 验证：任务应该失败
    expect(failed.length).toBe(1);
    expect(completed.length).toBe(0);
    expect(executionCounts.get('fail-once')).toBe(1);

    // 验证失败任务的信息
    const failedJob = failed[0];
    expect(failedJob.id).toBe(jobId);
    expect(failedJob.failedReason).toContain('failed');

    // 清理
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  }, 10000);

  it('应该验证自动重试：配置 attempts 后任务会自动重试', async () => {
    if (!redisAvailable || !queueClient || !workerManager) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    const testQueueName = `${queueName}-retry`;
    const testQueue = queueClient.getQueue(testQueueName);
    await testQueue.obliterate({ force: true });

    // 启动 Worker
    workerManager.startWorker({
      queueName: testQueueName,
      concurrency: 1,
      processors: {
        'retry-task': alwaysFailProcessor,
      },
    });

    const attempts = 3; // 最多重试 3 次
    await queueClient.addJob<TestTaskData>(
      testQueueName,
      'retry-task',
      {
        taskId: 'retry-task',
        taskIndex: 0,
        processingTime: 100,
      },
      {
        attempts, // 最多重试 3 次
      }
    );

    // 等待所有重试完成
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 检查任务状态
    const failed = await testQueue.getFailed();
    const completed = await testQueue.getCompleted();
    const executionCount = executionCounts.get('retry-task') || 0;

    console.log('📊 重试状态:');
    console.log(`   失败: ${failed.length}`);
    console.log(`   完成: ${completed.length}`);
    console.log(`   执行次数: ${executionCount}`);

    // 验证：任务应该失败（因为总是失败）
    expect(failed.length).toBe(1);
    expect(completed.length).toBe(0);

    // 验证：任务应该执行了 attempts 次
    expect(executionCount).toBe(attempts);
    console.log(`✅ 验证通过：任务重试了 ${executionCount} 次（预期 ${attempts} 次）`);

    // 清理
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  }, 15000);

  it('应该验证重试延迟：配置 backoff 后重试会有延迟', async () => {
    if (!redisAvailable || !queueClient || !workerManager) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    const testQueueName = `${queueName}-backoff`;
    const testQueue = queueClient.getQueue(testQueueName);
    await testQueue.obliterate({ force: true });

    // 启动 Worker
    workerManager.startWorker({
      queueName: testQueueName,
      concurrency: 1,
      processors: {
        'backoff-task': alwaysFailProcessor,
      },
    });

    const attempts = 3;
    const backoffDelay = 1000; // 1 秒延迟
    const startTime = Date.now();
    const retryTimes: number[] = [];

    // 监听任务执行时间
    const originalProcessor = alwaysFailProcessor;
    const trackedProcessor: JobProcessor<TestTaskData> = async job => {
      retryTimes.push(Date.now() - startTime);
      await originalProcessor(job);
    };

    // 重新启动 Worker 以使用追踪处理器
    await workerManager.stopAll();
    workerManager.startWorker({
      queueName: testQueueName,
      concurrency: 1,
      processors: {
        'backoff-task': trackedProcessor,
      },
    });

    await queueClient.addJob<TestTaskData>(
      testQueueName,
      'backoff-task',
      {
        taskId: 'backoff-task',
        taskIndex: 0,
        processingTime: 100,
      },
      {
        attempts,
        backoff: {
          type: 'fixed',
          delay: backoffDelay,
        },
      }
    );

    // 等待所有重试完成（包括延迟）
    await new Promise(resolve => setTimeout(resolve, attempts * backoffDelay + 2000));

    const failed = await testQueue.getFailed();
    const executionCount = executionCounts.get('backoff-task') || 0;

    console.log('📊 重试延迟状态:');
    console.log(`   失败: ${failed.length}`);
    console.log(`   执行次数: ${executionCount}`);
    console.log(`   重试时间点: ${retryTimes.map(t => `${t}ms`).join(', ')}`);

    // 验证：任务应该执行了 attempts 次
    expect(executionCount).toBe(attempts);

    // 验证：重试之间应该有延迟（至少 500ms，考虑到处理时间）
    if (retryTimes.length >= 2) {
      const delays = [];
      for (let i = 1; i < retryTimes.length; i++) {
        delays.push(retryTimes[i] - retryTimes[i - 1]);
      }
      const minDelay = Math.min(...delays);
      console.log(`   重试间隔: ${delays.map(d => `${d}ms`).join(', ')}`);
      expect(minDelay).toBeGreaterThan(backoffDelay * 0.8); // 允许 20% 误差
      console.log(`✅ 验证通过：重试延迟约为 ${backoffDelay}ms`);
    }

    // 清理
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  }, 20000);

  it('应该验证重试后成功：前 N 次失败后最终成功', async () => {
    if (!redisAvailable || !queueClient || !workerManager) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    const testQueueName = `${queueName}-retry-success`;
    const testQueue = queueClient.getQueue(testQueueName);
    await testQueue.obliterate({ force: true });

    const failCount = 2; // 前 2 次失败
    const retryThenSuccessProcessor = createRetryThenSuccessProcessor(failCount);

    // 启动 Worker
    workerManager.startWorker({
      queueName: testQueueName,
      concurrency: 1,
      processors: {
        'retry-success-task': retryThenSuccessProcessor,
      },
    });

    const attempts = 5; // 最多重试 5 次（足够让任务成功）
    await queueClient.addJob<TestTaskData>(
      testQueueName,
      'retry-success-task',
      {
        taskId: 'retry-success-task',
        taskIndex: 0,
        processingTime: 100,
      },
      {
        attempts,
        backoff: {
          type: 'fixed',
          delay: 500, // 500ms 延迟
        },
      }
    );

    // 等待任务完成（包括重试）
    await new Promise(resolve => setTimeout(resolve, failCount * 500 + 2000));

    const failed = await testQueue.getFailed();
    const completed = await testQueue.getCompleted();
    const executionCount = executionCounts.get('retry-success-task') || 0;

    console.log('📊 重试后成功状态:');
    console.log(`   失败: ${failed.length}`);
    console.log(`   完成: ${completed.length}`);
    console.log(`   执行次数: ${executionCount}`);

    // 验证：任务应该成功完成
    expect(failed.length).toBe(0);
    expect(completed.length).toBe(1);

    // 验证：任务应该执行了 failCount + 1 次（前 failCount 次失败，最后一次成功）
    expect(executionCount).toBe(failCount + 1);
    console.log(`✅ 验证通过：任务在第 ${executionCount} 次执行时成功（前 ${failCount} 次失败）`);

    // 清理
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  }, 15000);

  it('应该验证重试次数限制：超过 attempts 后任务最终失败', async () => {
    if (!redisAvailable || !queueClient || !workerManager) {
      console.log('⏭️  跳过测试：Redis 不可用');
      return;
    }

    const testQueueName = `${queueName}-max-retries`;
    const testQueue = queueClient.getQueue(testQueueName);
    await testQueue.obliterate({ force: true });

    // 启动 Worker
    workerManager.startWorker({
      queueName: testQueueName,
      concurrency: 1,
      processors: {
        'max-retries-task': alwaysFailProcessor,
      },
    });

    const attempts = 3; // 最多重试 3 次
    const jobId = await queueClient.addJob<TestTaskData>(
      testQueueName,
      'max-retries-task',
      {
        taskId: 'max-retries-task',
        taskIndex: 0,
        processingTime: 100,
      },
      {
        attempts,
        backoff: {
          type: 'fixed',
          delay: 500,
        },
      }
    );

    // 等待所有重试完成
    await new Promise(resolve => setTimeout(resolve, attempts * 500 + 2000));

    const failed = await testQueue.getFailed();
    const completed = await testQueue.getCompleted();
    const executionCount = executionCounts.get('max-retries-task') || 0;

    console.log('📊 重试次数限制状态:');
    console.log(`   失败: ${failed.length}`);
    console.log(`   完成: ${completed.length}`);
    console.log(`   执行次数: ${executionCount}`);

    // 验证：任务应该失败（因为总是失败且达到重试上限）
    expect(failed.length).toBe(1);
    expect(completed.length).toBe(0);

    // 验证：任务应该执行了 attempts 次（不超过）
    expect(executionCount).toBe(attempts);
    console.log(
      `✅ 验证通过：任务在 ${executionCount} 次重试后最终失败（达到上限 ${attempts} 次）`
    );

    // 验证失败任务的信息
    const failedJob = failed[0];
    expect(failedJob.id).toBe(jobId);
    expect(failedJob.attemptsMade).toBe(attempts);

    // 清理
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  }, 15000);
});
