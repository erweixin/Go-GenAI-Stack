/**
 * User Service 领域服务层
 * 实现业务用例，封装复杂业务流程
 */

import type { User } from '../model/user.js';
import type { UserRepository } from '../repository/interface.js';
import { createError } from '../../../shared/errors/errors.js';
import type { RequestContext } from '../../../shared/types/context.js';

export interface GetUserProfileInput {
  userId: string;
}

export interface GetUserProfileOutput {
  user: User;
}

export interface UpdateUserProfileInput {
  userId: string;
  username?: string;
  fullName?: string;
  avatarURL?: string;
}

export interface UpdateUserProfileOutput {
  user: User;
}

export interface ChangePasswordInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordOutput {
  success: boolean;
  message: string;
}

/**
 * UserService 用户领域服务
 */
export class UserService {
  constructor(private userRepo: UserRepository) {}

  /**
   * 获取用户资料
   */
  async getUserProfile(ctx: RequestContext, input: GetUserProfileInput): Promise<GetUserProfileOutput> {
    // Step 1: 从数据库获取用户
    const user = await this.userRepo.getById(ctx, input.userId);
    if (!user) {
      throw createError('USER_NOT_FOUND', '用户不存在');
    }

    // Step 2: 返回用户信息（不包含敏感字段）
    return { user };
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(
    ctx: RequestContext,
    input: UpdateUserProfileInput
  ): Promise<UpdateUserProfileOutput> {
    // Step 1: 验证输入（由 Model 层的验证逻辑处理）

    // Step 2: 获取用户
    const user = await this.userRepo.getById(ctx, input.userId);
    if (!user) {
      throw createError('USER_NOT_FOUND', '用户不存在');
    }

    // Step 3: 检查用户名是否已被占用（如果修改了用户名）
    if (input.username && input.username !== user.username) {
      const exists = await this.userRepo.existsByUsername(ctx, input.username);
      if (exists) {
        throw createError('VALIDATION_ERROR', '用户名已被占用');
      }
    }

    // Step 4: 更新用户字段
    try {
      user.updateProfile(input.username, input.fullName, input.avatarURL);
    } catch (error) {
      throw error; // 直接抛出 Model 层的错误
    }

    // Step 5: 保存用户
    await this.userRepo.update(ctx, user);

    // Step 6: 发布用户更新事件（扩展点）
    // eventBus.publish(ctx, UserUpdatedEvent{...});

    return { user };
  }

  /**
   * 修改密码
   */
  async changePassword(
    ctx: RequestContext,
    input: ChangePasswordInput
  ): Promise<ChangePasswordOutput> {
    // Step 1: 验证输入（密码强度由 Model 层验证）

    // Step 2: 获取用户
    const user = await this.userRepo.getById(ctx, input.userId);
    if (!user) {
      throw createError('USER_NOT_FOUND', '用户不存在');
    }

    // Step 3: 验证旧密码
    const isValid = await user.verifyPassword(input.oldPassword);
    if (!isValid) {
      throw createError('VALIDATION_ERROR', '密码错误');
    }

    // Step 4 & 5: 更新密码（包含哈希）
    try {
      await user.updatePassword(input.newPassword);
    } catch (error) {
      throw error; // 直接抛出 Model 层的错误
    }

    // 保存到数据库
    await this.userRepo.update(ctx, user);

    // Step 6: 撤销所有 Token（扩展点）
    // 可以在 Auth Service 中实现，通过发布 PasswordChanged 事件通知

    return {
      success: true,
      message: '密码修改成功',
    };
  }
}

