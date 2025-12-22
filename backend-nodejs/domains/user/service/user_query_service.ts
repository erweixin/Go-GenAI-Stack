/**
 * UserQueryService 用户查询服务
 *
 * 用于其他领域同步查询用户信息（只读操作）
 *
 * 设计原则：
 * - 只提供查询接口，不提供写操作
 * - 用于领域间同步查询（如 Task 领域需要验证用户是否存在）
 * - 写操作应该通过事件总线异步处理
 */

import type { User } from '../model/user.js';
import type { UserRepository } from '../repository/interface.js';
import type { RequestContext } from '../../../shared/types/context.js';

/**
 * UserQueryService 用户查询服务
 *
 * 提供只读的用户查询接口，供其他领域使用
 */
export class UserQueryService {
  constructor(private userRepo: UserRepository) {}

  /**
   * 根据 ID 获取用户
   *
   * @param ctx 请求上下文
   * @param userId 用户 ID
   * @returns 用户对象，如果不存在则返回 null
   */
  async getUser(ctx: RequestContext, userId: string): Promise<User | null> {
    return await this.userRepo.getById(ctx, userId);
  }

  /**
   * 根据邮箱获取用户
   *
   * @param ctx 请求上下文
   * @param email 邮箱地址
   * @returns 用户对象，如果不存在则返回 null
   */
  async getUserByEmail(ctx: RequestContext, email: string): Promise<User | null> {
    return await this.userRepo.getByEmail(ctx, email);
  }

  /**
   * 检查用户是否存在
   *
   * @param ctx 请求上下文
   * @param userId 用户 ID
   * @returns 如果用户存在返回 true，否则返回 false
   */
  async userExists(ctx: RequestContext, userId: string): Promise<boolean> {
    const user = await this.userRepo.getById(ctx, userId);
    return user !== null;
  }

  /**
   * 检查邮箱是否已被注册
   *
   * @param ctx 请求上下文
   * @param email 邮箱地址
   * @returns 如果邮箱已被注册返回 true，否则返回 false
   */
  async emailExists(ctx: RequestContext, email: string): Promise<boolean> {
    return await this.userRepo.existsByEmail(ctx, email);
  }
}
