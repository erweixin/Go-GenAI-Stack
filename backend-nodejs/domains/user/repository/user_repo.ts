/**
 * User Repository 实现
 * 使用 Kysely 进行类型安全的数据库操作
 */

import type { Kysely } from 'kysely';
import type { Database } from '../../../infrastructure/persistence/postgres/database.js';
import { User } from '../model/user.js';
import type { UserRepository } from './interface.js';

export class UserRepositoryImpl implements UserRepository {
  constructor(private db: Kysely<Database>) {}

  async create(_ctx: unknown, user: User): Promise<void> {
    try {
      await this.db
        .insertInto('users')
        .values({
          id: user.id,
          email: user.email,
          username: user.username || null,
          password_hash: user.passwordHash,
          full_name: user.fullName || null,
          avatar_url: user.avatarURL || null,
          status: user.status,
          email_verified: user.emailVerified,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          last_login_at: user.lastLoginAt,
        })
        .execute();
    } catch (error: any) {
      // 检查是否是唯一性约束冲突（PostgreSQL）
      if (error.code === '23505') {
        // unique_violation
        if (error.constraint === 'users_email_key' || error.constraint === 'idx_users_email') {
          throw new Error('EMAIL_ALREADY_EXISTS: 邮箱已被占用');
        }
        if (error.constraint === 'users_username_key' || error.constraint === 'idx_users_username') {
          throw new Error('USERNAME_ALREADY_EXISTS: 用户名已被占用');
        }
      }
      throw new Error(`创建用户失败: ${error.message}`);
    }
  }

  async getById(_ctx: unknown, userId: string): Promise<User | null> {
    const userRow = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!userRow) {
      return null;
    }

    return this.toDomainModel(userRow);
  }

  async getByEmail(_ctx: unknown, email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const userRow = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', normalizedEmail)
      .executeTakeFirst();

    if (!userRow) {
      return null;
    }

    return this.toDomainModel(userRow);
  }

  async getByUsername(_ctx: unknown, username: string): Promise<User | null> {
    const userRow = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();

    if (!userRow) {
      return null;
    }

    return this.toDomainModel(userRow);
  }

  async update(_ctx: unknown, user: User): Promise<void> {
    try {
      const result = await this.db
        .updateTable('users')
        .set({
          email: user.email,
          username: user.username || null,
          password_hash: user.passwordHash,
          full_name: user.fullName || null,
          avatar_url: user.avatarURL || null,
          status: user.status,
          email_verified: user.emailVerified,
          updated_at: user.updatedAt,
          last_login_at: user.lastLoginAt,
        })
        .where('id', '=', user.id)
        .execute();

      if (result.length === 0) {
        throw new Error('USER_NOT_FOUND: 用户不存在');
      }
    } catch (error: any) {
      // 检查是否是唯一性约束冲突
      if (error.code === '23505') {
        if (error.constraint === 'users_email_key' || error.constraint === 'idx_users_email') {
          throw new Error('EMAIL_ALREADY_EXISTS: 邮箱已被占用');
        }
        if (error.constraint === 'users_username_key' || error.constraint === 'idx_users_username') {
          throw new Error('USERNAME_ALREADY_EXISTS: 用户名已被占用');
        }
      }
      if (error.message.includes('USER_NOT_FOUND')) {
        throw error;
      }
      throw new Error(`更新用户失败: ${error.message}`);
    }
  }

  async delete(_ctx: unknown, userId: string): Promise<void> {
    const result = await this.db
      .deleteFrom('users')
      .where('id', '=', userId)
      .execute();

    if (result.length === 0) {
      throw new Error('USER_NOT_FOUND: 用户不存在');
    }
  }

  async existsByEmail(_ctx: unknown, email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('email', '=', normalizedEmail)
      .executeTakeFirst();

    return Number(result?.count || 0) > 0;
  }

  async existsByUsername(_ctx: unknown, username: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('username', '=', username)
      .executeTakeFirst();

    return Number(result?.count || 0) > 0;
  }

  // ============================================
  // 私有辅助方法
  // ============================================

  /**
   * 将数据库行转换为领域模型
   */
  private toDomainModel(row: Database['users']): User {
    return new User(
      row.id,
      row.email,
      row.password_hash,
      row.username || '',
      row.full_name || '',
      row.avatar_url || '',
      row.status as 'active' | 'inactive' | 'banned',
      row.email_verified,
      row.created_at,
      row.updated_at,
      row.last_login_at || null
    );
  }
}

