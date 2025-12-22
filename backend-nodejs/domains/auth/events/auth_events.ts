/**
 * Auth 领域事件定义
 * 定义 Auth 领域发布的所有事件
 */

import { BaseEvent } from '../../shared/events/types.js';

/**
 * UserRegistered 事件负载
 */
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  registeredAt: Date;
}

/**
 * UserRegistered 事件
 */
export class UserRegisteredEvent extends BaseEvent {
  constructor(payload: UserRegisteredPayload) {
    super('UserRegistered', 'auth', payload);
  }
}

/**
 * LoginSucceeded 事件负载
 */
export interface LoginSucceededPayload {
  userId: string;
  email: string;
  loginAt: Date;
  ipAddress?: string;
}

/**
 * LoginSucceeded 事件
 */
export class LoginSucceededEvent extends BaseEvent {
  constructor(payload: LoginSucceededPayload) {
    super('LoginSucceeded', 'auth', payload);
  }
}

/**
 * LoginFailed 事件负载
 */
export interface LoginFailedPayload {
  email: string;
  reason: 'invalid_email' | 'invalid_password' | 'user_banned';
  failedAt: Date;
  ipAddress?: string;
}

/**
 * LoginFailed 事件
 */
export class LoginFailedEvent extends BaseEvent {
  constructor(payload: LoginFailedPayload) {
    super('LoginFailed', 'auth', payload);
  }
}
