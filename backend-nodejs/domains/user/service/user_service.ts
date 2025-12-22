/**
 * User Service 领域服务层
 * 实现业务用例，封装复杂业务流程
 */

import type { User } from '../model/user.js';
import type { UserRepository } from '../repository/interface.js';
import { createError } from '../../../shared/errors/errors.js';
import type { RequestContext } from '../../../shared/types/context.js';
import type { EventBus } from '../../shared/events/event_bus.js';
import {
  UserUpdatedEvent,
  PasswordChangedEvent,
} from '../events/user_events.js';

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
 * 
 * 示例：订阅 Task 领域的事件（如任务创建时更新用户统计）
 * 这展示了如何通过事件总线实现领域间解耦通信
 */
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private eventBus: EventBus
  ) {
    // 订阅 TaskCreated 事件（示例：当任务创建时，可以更新用户的任务统计）
    // 注意：这是一个示例，实际业务中可能需要根据需求决定是否订阅
    this.eventBus.subscribe('TaskCreated', async (_ctx, _event) => {
      try {
        // 示例：可以在这里更新用户的任务统计、发送通知等
        // 注意：这里只是示例，实际业务中可能需要更复杂的逻辑
        // const payload = _event.payload as TaskCreatedPayload;
        // await this.updateUserTaskStats(ctx, payload.userId);
      } catch (error) {
        // 事件处理失败不应该影响主流程，只记录错误
        // 实际生产环境中应该使用结构化日志
        console.error('Failed to handle TaskCreated event:', error);
      }
    });
  }

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

    // Step 6: 发布用户更新事件
    await this.eventBus.publish(
      ctx,
      new UserUpdatedEvent({
        userId: user.id,
        updatedFields: {
          username: input.username !== undefined ? input.username : undefined,
          fullName: input.fullName !== undefined ? input.fullName : undefined,
          avatarURL: input.avatarURL !== undefined ? input.avatarURL : undefined,
        },
        updatedAt: user.updatedAt,
      })
    );

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

    // Step 6: 发布密码修改事件（Auth 领域可以订阅此事件来撤销 Token）
    await this.eventBus.publish(
      ctx,
      new PasswordChangedEvent({
        userId: user.id,
        changedAt: new Date(),
      })
    );

    return {
      success: true,
      message: '密码修改成功',
    };
  }
}

