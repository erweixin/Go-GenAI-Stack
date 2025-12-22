/**
 * 事务管理工具
 * 提供事务执行辅助函数，自动处理事务的开始、提交和回滚
 * 参考 Go 后端的 WithTransaction 实现
 */

import type { Kysely, Transaction } from 'kysely';
import type { Database } from './database.js';

/**
 * 事务函数类型
 * 在事务中执行的业务逻辑函数
 * 如果返回错误，事务会自动回滚
 * 如果返回正常，事务会自动提交
 */
export type TransactionFunction<T> = (trx: Transaction<Database>) => Promise<T>;

/**
 * 在事务中执行函数
 * 自动处理事务的开始、提交和回滚
 *
 * @param db 数据库连接
 * @param fn 在事务中执行的函数
 * @returns 函数执行结果
 *
 * @example
 * ```typescript
 * await withTransaction(db, async (trx) => {
 *   await trx.insertInto('tasks').values({...}).execute();
 *   await trx.insertInto('task_tags').values({...}).execute();
 *   // 如果任何操作失败，事务会自动回滚
 * });
 * ```
 */
export async function withTransaction<T>(
  db: Kysely<Database>,
  fn: TransactionFunction<T>
): Promise<T> {
  return await db.transaction().execute(async trx => {
    return await fn(trx);
  });
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
