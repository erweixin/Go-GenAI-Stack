/**
 * User Repository 接口
 * 定义用户仓储的抽象接口
 */

import type { User } from '../model/user.js';
import type { RequestContext } from '../../../shared/types/context.js';

/**
 * UserRepository 用户仓储接口
 */
export interface UserRepository {
  /**
   * 创建用户
   */
  create(ctx: RequestContext, user: User): Promise<void>;

  /**
   * 根据 ID 获取用户
   */
  getById(ctx: RequestContext, userId: string): Promise<User | null>;

  /**
   * 根据邮箱获取用户
   */
  getByEmail(ctx: RequestContext, email: string): Promise<User | null>;

  /**
   * 根据用户名获取用户
   */
  getByUsername(ctx: RequestContext, username: string): Promise<User | null>;

  /**
   * 更新用户信息
   */
  update(ctx: RequestContext, user: User): Promise<void>;

  /**
   * 删除用户
   */
  delete(ctx: RequestContext, userId: string): Promise<void>;

  /**
   * 检查邮箱是否存在
   */
  existsByEmail(ctx: RequestContext, email: string): Promise<boolean>;

  /**
   * 检查用户名是否存在
   */
  existsByUsername(ctx: RequestContext, username: string): Promise<boolean>;
}

