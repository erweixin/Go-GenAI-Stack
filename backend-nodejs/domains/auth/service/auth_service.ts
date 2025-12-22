/**
 * Auth Service 领域服务层
 * 实现认证业务用例
 */

import type { UserRepository } from '../../user/repository/interface.js';
import { User } from '../../user/model/user.js';
import { JWTService } from './jwt_service.js';
import { createError } from '../../../shared/errors/errors.js';
import type { RequestContext } from '../../../shared/types/context.js';
import type { EventBus } from '../../shared/events/event_bus.js';
import {
  UserRegisteredEvent,
  LoginSucceededEvent,
  LoginFailedEvent,
} from '../events/auth_events.js';

export interface RegisterInput {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
}

export interface RegisterOutput {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 秒
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 秒
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 秒
}

/**
 * AuthService 认证服务
 * 
 * 注意：AuthService 可以访问 UserRepository，因为：
 * - Auth 领域需要创建和验证用户（这是 Auth 的核心职责）
 * - 但应该通过事件总线与其他领域通信，而不是直接调用其他领域的 Service
 */
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private jwtService: JWTService,
    private eventBus: EventBus
  ) {}

  /**
   * 用户注册
   */
  async register(ctx: RequestContext, input: RegisterInput): Promise<RegisterOutput> {
    // Step 1: 验证输入（由 Model 层的验证逻辑处理）

    // Step 2: 检查邮箱是否已被注册
    const emailExists = await this.userRepo.existsByEmail(ctx, input.email);
    if (emailExists) {
      throw createError('EMAIL_ALREADY_EXISTS', '邮箱已被占用');
    }

    // Step 3: 检查用户名是否已被占用（如果提供）
    if (input.username) {
      const usernameExists = await this.userRepo.existsByUsername(ctx, input.username);
      if (usernameExists) {
        throw createError('VALIDATION_ERROR', '用户名已被占用');
      }
    }

    // Step 4: 创建用户实体（调用 User Domain）
    const user = await User.create(input.email, input.password);

    // 设置可选字段
    if (input.username || input.fullName) {
      user.updateProfile(input.username, input.fullName, undefined);
    }

    // Step 5: 保存用户到数据库
    await this.userRepo.create(ctx, user);

    // Step 6: 生成 JWT Token
    const { token: accessToken, expiresAt } = this.jwtService.generateAccessToken(
      user.id,
      user.email
    );
    const { token: refreshToken } = this.jwtService.generateRefreshToken(user.id);

    // Step 7: 发布用户注册事件（User 领域可以订阅此事件）
    await this.eventBus.publish(
      ctx,
      new UserRegisteredEvent({
        userId: user.id,
        email: user.email,
        registeredAt: user.createdAt,
      })
    );

    return {
      userId: user.id,
      email: user.email,
      accessToken,
      refreshToken,
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    };
  }

  /**
   * 用户登录
   */
  async login(ctx: RequestContext, input: LoginInput): Promise<LoginOutput> {
    // Step 1: 验证输入（由 Model 层的验证逻辑处理）

    // Step 2: 根据邮箱获取用户
    const user = await this.userRepo.getByEmail(ctx, input.email);
    if (!user) {
      // 发布登录失败事件
      await this.eventBus.publish(
        ctx,
        new LoginFailedEvent({
          email: input.email,
          reason: 'invalid_email',
          failedAt: new Date(),
        })
      );
      // 统一返回错误消息，不泄露是邮箱还是密码错误
      throw createError('INVALID_CREDENTIALS', '邮箱或密码错误');
    }

    // Step 3: 验证密码
    const isValid = await user.verifyPassword(input.password);
    if (!isValid) {
      // 发布登录失败事件
      await this.eventBus.publish(
        ctx,
        new LoginFailedEvent({
          email: input.email,
          reason: 'invalid_password',
          failedAt: new Date(),
        })
      );
      // 统一返回错误消息
      throw createError('INVALID_CREDENTIALS', '邮箱或密码错误');
    }

    // Step 4: 检查用户状态
    try {
      user.canLogin();
    } catch (error) {
      // 发布登录失败事件（用户被禁用）
      await this.eventBus.publish(
        ctx,
        new LoginFailedEvent({
          email: input.email,
          reason: 'user_banned',
          failedAt: new Date(),
        })
      );
      throw error; // 直接抛出 Model 层的错误
    }

    // Step 5: 生成 JWT Token
    const { token: accessToken, expiresAt } = this.jwtService.generateAccessToken(
      user.id,
      user.email
    );
    const { token: refreshToken } = this.jwtService.generateRefreshToken(user.id);

    // Step 6: 记录最后登录时间
    user.recordLogin();
    try {
      await this.userRepo.update(ctx, user);
    } catch (error) {
      // 记录失败不影响登录
      // logger.warn('更新登录时间失败', error);
    }

    // Step 7: 发布登录成功事件
    await this.eventBus.publish(
      ctx,
      new LoginSucceededEvent({
        userId: user.id,
        email: user.email,
        loginAt: new Date(),
      })
    );

    return {
      userId: user.id,
      email: user.email,
      accessToken,
      refreshToken,
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    };
  }

  /**
   * 刷新 Token
   */
  async refreshToken(ctx: RequestContext, input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // Step 1: 验证 Refresh Token
    let claims;
    try {
      claims = this.jwtService.verifyRefreshToken(input.refreshToken);
    } catch (error) {
      throw createError('REFRESH_TOKEN_INVALID', 'Refresh Token 无效或已过期');
    }

    // Step 2: 获取用户信息
    const user = await this.userRepo.getById(ctx, claims.user_id);
    if (!user) {
      throw createError('USER_NOT_FOUND', '用户不存在');
    }

    // Step 3: 检查用户状态（如果用户被禁用，会抛出错误）
    user.canLogin();

    // Step 4: 生成新的 Access Token 和 Refresh Token
    const { token: accessToken, expiresAt } = this.jwtService.generateAccessToken(
      user.id,
      user.email
    );
    const { token: refreshToken } = this.jwtService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    };
  }
}

