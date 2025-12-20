/**
 * User Repository 接口
 * 定义用户仓储的抽象接口
 */

import type { User } from '../model/user.js';

/**
 * UserRepository 用户仓储接口
 */
export interface UserRepository {
  /**
   * 创建用户
   */
  create(ctx: unknown, user: User): Promise<void>;

  /**
   * 根据 ID 获取用户
   */
  getById(ctx: unknown, userId: string): Promise<User | null>;

  /**
   * 根据邮箱获取用户
   */
  getByEmail(ctx: unknown, email: string): Promise<User | null>;

  /**
   * 根据用户名获取用户
   */
  getByUsername(ctx: unknown, username: string): Promise<User | null>;

  /**
   * 更新用户信息
   */
  update(ctx: unknown, user: User): Promise<void>;

  /**
   * 删除用户
   */
  delete(ctx: unknown, userId: string): Promise<void>;

  /**
   * 检查邮箱是否存在
   */
  existsByEmail(ctx: unknown, email: string): Promise<boolean>;

  /**
   * 检查用户名是否存在
   */
  existsByUsername(ctx: unknown, username: string): Promise<boolean>;
}

