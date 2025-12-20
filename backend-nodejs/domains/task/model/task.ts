/**
 * Task 领域模型
 * 聚合根：包含任务的所有核心属性和业务行为
 */

import { randomUUID } from 'crypto';

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export const TaskStatuses = {
  Pending: 'pending' as TaskStatus,
  InProgress: 'in_progress' as TaskStatus,
  Completed: 'completed' as TaskStatus,
} as const;

// 优先级
export type Priority = 'low' | 'medium' | 'high';

export const Priorities = {
  Low: 'low' as Priority,
  Medium: 'medium' as Priority,
  High: 'high' as Priority,
} as const;

// 标签
export interface Tag {
  name: string;
  color: string;
}

// Task 聚合根
export class Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;

  constructor(
    id: string,
    userId: string,
    title: string,
    description: string,
    priority: Priority,
    status: TaskStatus = TaskStatuses.Pending,
    dueDate: Date | null = null,
    tags: Tag[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    completedAt: Date | null = null
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.dueDate = dueDate;
    this.tags = tags;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.completedAt = completedAt;
  }

  /**
   * 创建新任务
   */
  static create(
    userId: string,
    title: string,
    description: string,
    priority: Priority = Priorities.Medium
  ): Task {
    if (!userId || userId.trim().length === 0) {
      throw new Error('USER_ID_REQUIRED: 用户 ID 不能为空');
    }
    if (!title || title.trim().length === 0) {
      throw new Error('TASK_TITLE_EMPTY: 任务标题不能为空');
    }
    if (title.length > 200) {
      throw new Error('TASK_TITLE_TOO_LONG: 标题过长，最大 200 字符');
    }
    if (description.length > 5000) {
      throw new Error('TASK_DESCRIPTION_TOO_LONG: 描述过长，最大 5000 字符');
    }
    if (!isValidPriority(priority)) {
      throw new Error('INVALID_PRIORITY: 优先级无效');
    }

    const now = new Date();
    return new Task(
      randomUUID(),
      userId,
      title.trim(),
      description,
      priority,
      TaskStatuses.Pending,
      null,
      [],
      now,
      now,
      null
    );
  }

  /**
   * 更新任务信息
   */
  update(title?: string, description?: string, priority?: Priority): void {
    if (this.status === TaskStatuses.Completed) {
      throw new Error('TASK_ALREADY_COMPLETED: 已完成的任务不能更新');
    }

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new Error('TASK_TITLE_EMPTY: 任务标题不能为空');
      }
      if (title.length > 200) {
        throw new Error('TASK_TITLE_TOO_LONG: 标题过长，最大 200 字符');
      }
      this.title = title.trim();
    }

    if (description !== undefined) {
      if (description.length > 5000) {
        throw new Error('TASK_DESCRIPTION_TOO_LONG: 描述过长，最大 5000 字符');
      }
      this.description = description;
    }

    if (priority !== undefined) {
      if (!isValidPriority(priority)) {
        throw new Error('INVALID_PRIORITY: 优先级无效');
      }
      this.priority = priority;
    }

    this.updatedAt = new Date();
  }

  /**
   * 设置截止日期
   */
  setDueDate(dueDate: Date): void {
    if (dueDate < this.createdAt) {
      throw new Error('INVALID_DUE_DATE: 截止日期不能早于创建日期');
    }
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }

  /**
   * 标记为已完成
   */
  complete(): void {
    if (this.status === TaskStatuses.Completed) {
      throw new Error('TASK_ALREADY_COMPLETED: 任务已完成，不能再次完成');
    }
    this.status = TaskStatuses.Completed;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  addTag(tag: Tag): void {
    if (!tag.name || tag.name.trim().length === 0) {
      throw new Error('TAG_NAME_EMPTY: 标签名不能为空');
    }
    if (this.tags.length >= 10) {
      throw new Error('TOO_MANY_TAGS: 标签过多，最多 10 个');
    }
    // 检查重复
    if (this.tags.some((t) => t.name === tag.name)) {
      throw new Error('DUPLICATE_TAG: 标签重复');
    }
    this.tags.push(tag);
    this.updatedAt = new Date();
  }

  /**
   * 移除标签
   */
  removeTag(tagName: string): void {
    this.tags = this.tags.filter((t) => t.name !== tagName);
    this.updatedAt = new Date();
  }
}

/**
 * 验证优先级是否有效
 */
function isValidPriority(priority: Priority): boolean {
  return (
    priority === Priorities.Low ||
    priority === Priorities.Medium ||
    priority === Priorities.High
  );
}

