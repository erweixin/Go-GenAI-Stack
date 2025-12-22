/**
 * User 领域事件定义
 * 定义 User 领域发布的所有事件
 */

import { BaseEvent } from '../../shared/events/types.js';

/**
 * UserCreated 事件负载
 */
export interface UserCreatedPayload {
  userId: string;
  email: string;
  username?: string;
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
}

/**
 * UserCreated 事件
 */
export class UserCreatedEvent extends BaseEvent {
  constructor(payload: UserCreatedPayload) {
    super('UserCreated', 'user', payload);
  }
}

/**
 * UserUpdated 事件负载
 */
export interface UserUpdatedPayload {
  userId: string;
  updatedFields: Record<string, unknown>;
  updatedAt: Date;
}

/**
 * UserUpdated 事件
 */
export class UserUpdatedEvent extends BaseEvent {
  constructor(payload: UserUpdatedPayload) {
    super('UserUpdated', 'user', payload);
  }
}

/**
 * PasswordChanged 事件负载
 */
export interface PasswordChangedPayload {
  userId: string;
  changedAt: Date;
}

/**
 * PasswordChanged 事件
 */
export class PasswordChangedEvent extends BaseEvent {
  constructor(payload: PasswordChangedPayload) {
    super('PasswordChanged', 'user', payload);
  }
}

