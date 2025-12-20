/**
 * Task Repository 实现
 * 使用 Kysely 进行类型安全的数据库操作
 */

import type { Kysely, Transaction } from 'kysely';
import type { Database } from '../../../infrastructure/persistence/postgres/database.js';
import { Task } from '../model/task.js';
import type { TaskRepository, TaskFilter } from './interface.js';
import { createError } from '../../../shared/errors/errors.js';
import { withTransaction } from '../../../infrastructure/persistence/postgres/transaction.js';
import type { RequestContext } from '../../../shared/types/context.js';

export class TaskRepositoryImpl implements TaskRepository {
  constructor(private db: Kysely<Database>) {}

  async create(_ctx: RequestContext, task: Task): Promise<void> {
    // 在事务中执行：插入任务和保存标签
    await withTransaction(this.db, async (trx) => {
      // 插入任务
      await trx
        .insertInto('tasks')
        .values({
          id: task.id,
          user_id: task.userId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
          completed_at: task.completedAt,
        })
        .execute();

      // 保存标签（在同一事务中）
      if (task.tags.length > 0) {
        await this.saveTagsInTransaction(trx, task.id, task.tags);
      }
    });
  }

  async findById(_ctx: RequestContext, taskId: string): Promise<Task | null> {
    const taskRow = await this.db
      .selectFrom('tasks')
      .selectAll()
      .where('id', '=', taskId)
      .executeTakeFirst();

    if (!taskRow) {
      return null;
    }

    // 加载标签
    const tags = await this.loadTags(taskId);

    return this.toDomainModel(taskRow, tags);
  }

  async update(_ctx: RequestContext, task: Task): Promise<void> {
    // 在事务中执行：更新任务和标签
    await withTransaction(this.db, async (trx) => {
      const result = await trx
        .updateTable('tasks')
        .set({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate,
          updated_at: task.updatedAt,
          completed_at: task.completedAt,
        })
        .where('id', '=', task.id)
        .execute();

      if (result.length === 0) {
        throw createError('TASK_NOT_FOUND', '任务不存在');
      }

      // 更新标签（先删除旧的，再插入新的，在同一事务中）
      await this.deleteTagsInTransaction(trx, task.id);
      if (task.tags.length > 0) {
        await this.saveTagsInTransaction(trx, task.id, task.tags);
      }
    });
  }

  async delete(_ctx: RequestContext, taskId: string): Promise<void> {
    const result = await this.db
      .deleteFrom('tasks')
      .where('id', '=', taskId)
      .execute();

    if (result.length === 0) {
      throw createError('TASK_NOT_FOUND', '任务不存在');
    }

    // 标签会通过外键级联删除
  }

  async list(
    _ctx: RequestContext,
    filter: TaskFilter
  ): Promise<{ tasks: Task[]; total: number }> {
    // 构建查询
    let query = this.db.selectFrom('tasks');

    // 应用筛选条件
    if (filter.userId) {
      query = query.where('user_id', '=', filter.userId);
    }
    if (filter.status) {
      query = query.where('status', '=', filter.status);
    }
    if (filter.priority) {
      query = query.where('priority', '=', filter.priority);
    }
    if (filter.keyword) {
      const keyword = `%${filter.keyword}%`;
      query = query.where((eb) =>
        eb.or([
          eb('title', 'like', keyword),
          eb('description', 'like', keyword),
        ])
      );
    }
    if (filter.dueDateFrom) {
      query = query.where('due_date', '>=', filter.dueDateFrom);
    }
    if (filter.dueDateTo) {
      query = query.where('due_date', '<=', filter.dueDateTo);
    }
    if (filter.tag) {
      // 子查询：查找包含该标签的任务 ID
      const subQuery = this.db
        .selectFrom('task_tags')
        .select('task_id')
        .where('tag_name', '=', filter.tag);
      query = query.where('id', 'in', subQuery);
    }

    // 查询总数
    const totalResult = await query
      .select((eb) => eb.fn.count('id').as('total'))
      .executeTakeFirst();
    const total = Number(totalResult?.total || 0);

    // 排序
    const sortBy = filter.sortBy || 'created_at';
    const sortOrder = filter.sortOrder || 'desc';
    if (sortOrder === 'asc') {
      query = query.orderBy(sortBy, 'asc');
    } else {
      query = query.orderBy(sortBy, 'desc');
    }

    // 分页
    const offset = (filter.page - 1) * filter.limit;
    query = query.limit(filter.limit).offset(offset);

    // 执行查询
    const taskRows = await query.selectAll().execute();

    // 批量加载所有标签（修复 N+1 查询问题）
    const taskIds = taskRows.map((row) => row.id);
    const allTags = await this.loadTagsBatch(taskIds);

    // 构建标签映射
    const tagsMap = new Map<string, Array<{ name: string; color: string }>>();
    for (const tag of allTags) {
      if (!tagsMap.has(tag.task_id)) {
        tagsMap.set(tag.task_id, []);
      }
      tagsMap.get(tag.task_id)!.push({
        name: tag.tag_name,
        color: tag.tag_color || '#808080',
      });
    }

    // 转换为领域模型
    const tasks = taskRows.map((row) => {
      const tags = tagsMap.get(row.id) || [];
      return this.toDomainModel(row, tags);
    });

    return { tasks, total };
  }

  async exists(_ctx: RequestContext, taskId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('tasks')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('id', '=', taskId)
      .executeTakeFirst();

    return Number(result?.count || 0) > 0;
  }

  // ============================================
  // 私有辅助方法
  // ============================================

  /**
   * 保存标签（在事务中）
   */
  private async saveTagsInTransaction(
    trx: Transaction<Database>,
    taskId: string,
    tags: Array<{ name: string; color: string }>
  ): Promise<void> {
    if (tags.length === 0) {
      return;
    }

    // 批量插入标签（使用 INSERT ... ON CONFLICT DO NOTHING 避免重复）
    const tagValues = tags.map((tag) => ({
      task_id: taskId,
      tag_name: tag.name,
      tag_color: tag.color || '#808080',
    }));

    await trx
      .insertInto('task_tags')
      .values(tagValues)
      .onConflict((oc) => oc
        .columns(['task_id', 'tag_name'])
        .doNothing()
      )
      .execute();
  }

  /**
   * 删除标签（在事务中）
   */
  private async deleteTagsInTransaction(trx: Transaction<Database>, taskId: string): Promise<void> {
    await trx
      .deleteFrom('task_tags')
      .where('task_id', '=', taskId)
      .execute();
  }


  /**
   * 批量加载标签（修复 N+1 查询问题）
   */
  private async loadTagsBatch(
    taskIds: string[]
  ): Promise<Array<{ task_id: string; tag_name: string; tag_color: string | null }>> {
    if (taskIds.length === 0) {
      return [];
    }

    return await this.db
      .selectFrom('task_tags')
      .select(['task_id', 'tag_name', 'tag_color'])
      .where('task_id', 'in', taskIds)
      .execute();
  }

  /**
   * 加载单个任务的标签（保留用于兼容）
   */
  private async loadTags(taskId: string): Promise<Array<{ name: string; color: string }>> {
    const tagRows = await this.db
      .selectFrom('task_tags')
      .select(['tag_name', 'tag_color'])
      .where('task_id', '=', taskId)
      .execute();

    return tagRows.map((row) => ({
      name: row.tag_name,
      color: row.tag_color || '#808080',
    }));
  }

  /**
   * 将数据库行转换为领域模型
   */
  private toDomainModel(
    row: Database['tasks'],
    tags: Array<{ name: string; color: string }>
  ): Task {
    return new Task(
      row.id,
      row.user_id || '',
      row.title,
      row.description || '',
      row.priority as 'low' | 'medium' | 'high',
      row.status as 'pending' | 'in_progress' | 'completed',
      row.due_date || null,
      tags,
      row.created_at,
      row.updated_at,
      row.completed_at || null
    );
  }
}

