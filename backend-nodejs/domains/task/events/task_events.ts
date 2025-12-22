/**
 * Task 领域事件定义
 * 定义 Task 领域发布的所有事件
 */

import { BaseEvent } from '../../shared/events/types.js';

/**
 * TaskCreated 事件负载
 */
export interface TaskCreatedPayload {
  taskId: string;
  userId: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO 8601
  tags?: string[];
  createdAt: Date;
}

/**
 * TaskCreated 事件
 */
export class TaskCreatedEvent extends BaseEvent {
  constructor(payload: TaskCreatedPayload) {
    super('TaskCreated', 'task', payload);
  }
}

/**
 * TaskUpdated 事件负载
 */
export interface TaskUpdatedPayload {
  taskId: string;
  userId: string;
  updatedFields: Record<string, unknown>;
  updatedAt: Date;
}

/**
 * TaskUpdated 事件
 */
export class TaskUpdatedEvent extends BaseEvent {
  constructor(payload: TaskUpdatedPayload) {
    super('TaskUpdated', 'task', payload);
  }
}

/**
 * TaskCompleted 事件负载
 */
export interface TaskCompletedPayload {
  taskId: string;
  userId: string;
  completedAt: Date;
}

/**
 * TaskCompleted 事件
 */
export class TaskCompletedEvent extends BaseEvent {
  constructor(payload: TaskCompletedPayload) {
    super('TaskCompleted', 'task', payload);
  }
}

/**
 * TaskDeleted 事件负载
 */
export interface TaskDeletedPayload {
  taskId: string;
  userId: string;
  deletedAt: Date;
}

/**
 * TaskDeleted 事件
 */
export class TaskDeletedEvent extends BaseEvent {
  constructor(payload: TaskDeletedPayload) {
    super('TaskDeleted', 'task', payload);
  }
}

