/**
 * User 领域模型
 * 聚合根：包含用户的所有核心属性和业务行为
 */

import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { createError } from '../../../shared/errors/errors.js';

// 用户状态
export type UserStatus = 'active' | 'inactive' | 'banned';

export const UserStatuses = {
  Active: 'active' as UserStatus,
  Inactive: 'inactive' as UserStatus,
  Banned: 'banned' as UserStatus,
} as const;

// User 聚合根
export class User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName: string;
  avatarURL: string;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;

  constructor(
    id: string,
    email: string,
    passwordHash: string,
    username: string = '',
    fullName: string = '',
    avatarURL: string = '',
    status: UserStatus = UserStatuses.Inactive,
    emailVerified: boolean = false,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    lastLoginAt: Date | null = null
  ) {
    this.id = id;
    this.email = email;
    this.username = username;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.avatarURL = avatarURL;
    this.status = status;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastLoginAt = lastLoginAt;
  }

  /**
   * 创建新用户
   */
  static async create(email: string, password: string): Promise<User> {
    // 验证邮箱
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      throw createError('INVALID_EMAIL', '邮箱格式无效');
    }

    // 验证密码
    validatePassword(password);

    // 哈希密码
    const passwordHash = await hashPassword(password);

    const now = new Date();
    return new User(
      randomUUID(),
      normalizedEmail,
      passwordHash,
      '', // 用户名可选
      '', // 全名可选
      '', // 头像可选
      UserStatuses.Inactive, // 初始状态为未激活
      false, // 邮箱未验证
      now,
      now,
      null
    );
  }

  /**
   * 验证密码
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch {
      return false;
    }
  }

  /**
   * 更新密码
   */
  async updatePassword(newPassword: string): Promise<void> {
    // 验证新密码
    validatePassword(newPassword);

    // 哈希新密码
    this.passwordHash = await hashPassword(newPassword);
    this.updatedAt = new Date();
  }

  /**
   * 更新用户资料
   */
  updateProfile(username?: string, fullName?: string, avatarURL?: string): void {
    // 验证用户名（如果提供）
    if (username !== undefined && username !== '') {
      if (!isValidUsername(username)) {
        throw createError('VALIDATION_ERROR', '用户名格式无效（3-30 字符，仅字母数字下划线）');
      }
      this.username = username;
    }

    // 验证全名
    if (fullName !== undefined && fullName !== '') {
      if (fullName.length > 100) {
        throw createError('VALIDATION_ERROR', '全名过长（最多 100 字符）');
      }
      this.fullName = fullName;
    }

    // 验证头像 URL（如果提供）
    if (avatarURL !== undefined && avatarURL !== '') {
      if (!avatarURL.startsWith('http://') && !avatarURL.startsWith('https://')) {
        throw createError('VALIDATION_ERROR', '头像 URL 格式无效');
      }
      this.avatarURL = avatarURL;
    }

    this.updatedAt = new Date();
  }

  /**
   * 激活用户
   */
  activate(): void {
    if (this.status === UserStatuses.Active) {
      return; // 已经激活，直接返回
    }

    this.status = UserStatuses.Active;
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  /**
   * 禁用用户
   */
  deactivate(): void {
    if (this.status === UserStatuses.Banned) {
      return; // 已经禁用，直接返回
    }

    this.status = UserStatuses.Banned;
    this.updatedAt = new Date();
  }

  /**
   * 记录登录时间
   */
  recordLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 检查用户是否可以登录
   */
  canLogin(): void {
    if (this.status === UserStatuses.Banned) {
      throw createError('UNAUTHORIZED', '用户已被禁用');
    }
    // 注意：我们允许 Inactive 用户登录，但可能限制某些功能
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 规范化邮箱（转为小写、去除空格）
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 验证用户名格式
 */
function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * 验证密码强度
 */
function validatePassword(password: string): void {
  if (password.length < 8) {
    throw createError('PASSWORD_TOO_SHORT', '密码强度不足（至少 8 字符）');
  }
  if (password.length > 128) {
    throw createError('VALIDATION_ERROR', '密码过长（最多 128 字符）');
  }
}

/**
 * 使用 bcrypt 哈希密码
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

