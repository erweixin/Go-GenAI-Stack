/**
 * Task Repository 接口
 * 定义任务仓储的抽象接口
 */

import type { Task } from '../model/task.js';

export interface TaskFilter {
  // 筛选条件
  userId?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  keyword?: string;

  // 排序
  sortBy?: 'created_at' | 'due_date' | 'priority';
  sortOrder?: 'asc' | 'desc';

  // 分页
  page: number;
  limit: number;
}

/**
 * TaskRepository 任务仓储接口
 */
export interface TaskRepository {
  /**
   * 创建任务
   */
  create(ctx: unknown, task: Task): Promise<void>;

  /**
   * 根据 ID 查找任务
   */
  findById(ctx: unknown, taskId: string): Promise<Task | null>;

  /**
   * 更新任务
   */
  update(ctx: unknown, task: Task): Promise<void>;

  /**
   * 删除任务
   */
  delete(ctx: unknown, taskId: string): Promise<void>;

  /**
   * 列出任务
   */
  list(ctx: unknown, filter: TaskFilter): Promise<{ tasks: Task[]; total: number }>;

  /**
   * 检查任务是否存在
   */
  exists(ctx: unknown, taskId: string): Promise<boolean>;
}

