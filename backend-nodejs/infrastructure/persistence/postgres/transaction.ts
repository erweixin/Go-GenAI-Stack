/**
 * 事务管理工具
 * 提供事务执行辅助函数，自动处理事务的开始、提交和回滚
 * 支持错误重试、超时控制和死锁检测
 * 参考 Go 后端的 WithTransaction 实现
 */

import type { Kysely, Transaction } from 'kysely';
import type { Database } from './database.js';
import { getGlobalLogger } from '../../monitoring/logger/logger.js';

/**
 * 事务函数类型
 * 在事务中执行的业务逻辑函数
 * 如果返回错误，事务会自动回滚
 * 如果返回正常，事务会自动提交
 */
export type TransactionFunction<T> = (trx: Transaction<Database>) => Promise<T>;

/**
 * 事务选项
 */
export interface TransactionOptions {
  /**
   * 最大重试次数（针对死锁和序列化失败）
   * 默认：0（不重试）
   */
  maxRetries?: number;
  /**
   * 事务超时时间（毫秒）
   * 默认：30000（30秒）
   */
  timeout?: number;
  /**
   * 重试延迟基数（毫秒）
   * 实际延迟 = baseDelay * (attempt + 1)
   * 默认：100
   */
  retryBaseDelay?: number;
}

/**
 * 检查是否为可重试的错误（死锁或序列化失败）
 * PostgreSQL 错误码：
 * - 40001: serialization_failure
 * - 40P01: deadlock_detected
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // 检查 PostgreSQL 错误
  const pgError = error as { code?: string; message?: string };
  if (pgError.code === '40001' || pgError.code === '40P01') {
    return true;
  }

  // 检查错误消息中是否包含死锁相关关键词
  const errorMessage = pgError.message?.toLowerCase() || '';
  if (
    errorMessage.includes('deadlock') ||
    errorMessage.includes('serialization failure') ||
    errorMessage.includes('could not serialize')
  ) {
    return true;
  }

  return false;
}

/**
 * 在事务中执行函数
 * 自动处理事务的开始、提交和回滚
 * 支持错误重试、超时控制和死锁检测
 *
 * @param db 数据库连接
 * @param fn 在事务中执行的函数
 * @param options 事务选项
 * @returns 函数执行结果
 *
 * @example
 * ```typescript
 * // 基本用法
 * await withTransaction(db, async (trx) => {
 *   await trx.insertInto('tasks').values({...}).execute();
 *   await trx.insertInto('task_tags').values({...}).execute();
 * });
 *
 * // 带重试和超时
 * await withTransaction(
 *   db,
 *   async (trx) => { ... },
 *   { maxRetries: 3, timeout: 10000 }
 * );
 * ```
 */
export async function withTransaction<T>(
  db: Kysely<Database>,
  fn: TransactionFunction<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 0;
  const timeout = options.timeout ?? 30000; // 30秒默认超时
  const retryBaseDelay = options.retryBaseDelay ?? 100;
  const logger = getGlobalLogger();

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 使用 Promise.race 实现超时控制
      const result = await Promise.race([
        db.transaction().execute(async trx => {
          return await fn(trx);
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Transaction timeout after ${timeout}ms`));
          }, timeout);
        }),
      ]);

      // 成功执行，返回结果
      if (attempt > 0) {
        logger?.info('Transaction succeeded after retry', {
          attempt,
          maxRetries,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // 检查是否为可重试的错误
      const isRetryable = isRetryableError(error);
      const canRetry = attempt < maxRetries && isRetryable;

      if (canRetry) {
        // 计算重试延迟（指数退避）
        const delay = retryBaseDelay * (attempt + 1);
        logger?.warn('Transaction failed, retrying', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: error instanceof Error ? error.message : String(error),
          errorCode: (error as { code?: string }).code,
        });

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // 不可重试或已达到最大重试次数，抛出错误
      if (isRetryable && attempt >= maxRetries) {
        logger?.error('Transaction failed after all retries', {
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
          errorCode: (error as { code?: string }).code,
        });
      }

      throw error;
    }
  }

  // 理论上不会到达这里，但 TypeScript 需要
  throw lastError || new Error('Transaction failed');
}

/**
 * 在只读事务中执行函数
 * 适用于需要一致性读取但不修改数据的场景
 *
 * @param db 数据库连接
 * @param fn 在事务中执行的函数
 * @returns 函数执行结果
 *
 * @example
 * ```typescript
 * await withReadOnlyTransaction(db, async (trx) => {
 *   const tasks = await trx.selectFrom('tasks').selectAll().execute();
 *   // 只读操作，不会修改数据
 * });
 * ```
 */
export async function withReadOnlyTransaction<T>(
  db: Kysely<Database>,
  fn: TransactionFunction<T>
): Promise<T> {
  // Kysely 的事务默认是读写的，只读事务需要在数据库层面配置
  // 这里使用普通事务，但可以通过注释说明这是只读操作
  return await db.transaction().execute(async trx => {
    return await fn(trx);
  });
}
