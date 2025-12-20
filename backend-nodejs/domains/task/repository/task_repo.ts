/**
 * Task Repository 实现
 * 使用 Kysely 进行类型安全的数据库操作
 */

import type { Kysely } from 'kysely';
import type { Database } from '../../../infrastructure/persistence/postgres/database.js';
import { Task } from '../model/task.js';
import type { TaskRepository, TaskFilter } from './interface.js';

export class TaskRepositoryImpl implements TaskRepository {
  constructor(private db: Kysely<Database>) {}

  async create(_ctx: unknown, task: Task): Promise<void> {
    // 插入任务
    await this.db
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

    // 保存标签
    if (task.tags.length > 0) {
      await this.saveTags(task.id, task.tags);
    }
  }

  async findById(_ctx: unknown, taskId: string): Promise<Task | null> {
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

  async update(_ctx: unknown, task: Task): Promise<void> {
    const result = await this.db
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
      throw new Error('TASK_NOT_FOUND: 任务不存在');
    }

    // 更新标签（先删除旧的，再插入新的）
    await this.deleteTags(task.id);
    if (task.tags.length > 0) {
      await this.saveTags(task.id, task.tags);
    }
  }

  async delete(_ctx: unknown, taskId: string): Promise<void> {
    const result = await this.db
      .deleteFrom('tasks')
      .where('id', '=', taskId)
      .execute();

    if (result.length === 0) {
      throw new Error('TASK_NOT_FOUND: 任务不存在');
    }

    // 标签会通过外键级联删除
  }

  async list(
    _ctx: unknown,
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

    // 加载标签并转换为领域模型
    const tasks: Task[] = [];
    for (const row of taskRows) {
      const tags = await this.loadTags(row.id);
      tasks.push(this.toDomainModel(row, tags));
    }

    return { tasks, total };
  }

  async exists(_ctx: unknown, taskId: string): Promise<boolean> {
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
   * 保存标签
   */
  private async saveTags(taskId: string, tags: Array<{ name: string; color: string }>): Promise<void> {
    if (tags.length === 0) {
      return;
    }

    // 检查并插入标签（避免重复）
    for (const tag of tags) {
      const existing = await this.db
        .selectFrom('task_tags')
        .select('task_id')
        .where('task_id', '=', taskId)
        .where('tag_name', '=', tag.name)
        .executeTakeFirst();

      if (!existing) {
        // 不存在，插入
        await this.db
          .insertInto('task_tags')
          .values({
            task_id: taskId,
            tag_name: tag.name,
            tag_color: tag.color || '#808080',
          })
          .execute();
      }
      // 已存在，跳过
    }
  }

  /**
   * 删除标签
   */
  private async deleteTags(taskId: string): Promise<void> {
    await this.db
      .deleteFrom('task_tags')
      .where('task_id', '=', taskId)
      .execute();
  }

  /**
   * 加载标签
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

