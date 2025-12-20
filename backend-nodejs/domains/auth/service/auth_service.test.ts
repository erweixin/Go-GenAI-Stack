/**
 * AuthService 单元测试
 * 使用 Mock Repository 进行测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth_service.js';
import { JWTService } from './jwt_service.js';
import type { UserRepository } from '../../user/repository/interface.js';
import { User } from '../../user/model/user.js';
import type { RequestContext } from '../../../shared/types/context.js';

// Mock UserRepository
class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private emails: Set<string> = new Set();
  private usernames: Set<string> = new Set();

  async create(_ctx: RequestContext, user: User): Promise<void> {
    this.users.set(user.id, user);
    this.emails.add(user.email.toLowerCase());
    if (user.username) {
      this.usernames.add(user.username);
    }
  }

  async getById(_ctx: RequestContext, userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getByEmail(_ctx: RequestContext, email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  async update(_ctx: RequestContext, user: User): Promise<void> {
    this.users.set(user.id, user);
    if (user.username) {
      this.usernames.add(user.username);
    }
  }

  async existsByEmail(_ctx: RequestContext, email: string): Promise<boolean> {
    return this.emails.has(email.toLowerCase());
  }

  async existsByUsername(_ctx: RequestContext, username: string): Promise<boolean> {
    return this.usernames.has(username);
  }
}

describe('AuthService', () => {
  let userRepo: MockUserRepository;
  let jwtService: JWTService;
  let authService: AuthService;

  beforeEach(() => {
    userRepo = new MockUserRepository();
    jwtService = new JWTService({
      secret: 'test-secret',
      accessTokenExpiry: 3600,
      refreshTokenExpiry: 604800,
      issuer: 'test-issuer',
    });
    authService = new AuthService(userRepo, jwtService);
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        fullName: 'New User',
      };

      const output = await authService.register({}, input);

      expect(output.userId).toBeDefined();
      expect(output.email).toBe('newuser@example.com');
      expect(output.accessToken).toBeDefined();
      expect(output.refreshToken).toBeDefined();
      expect(output.expiresIn).toBeGreaterThan(0);

      // 验证用户已创建
      const user = await userRepo.getByEmail({}, input.email);
      expect(user).not.toBeNull();
      expect(user!.email).toBe('newuser@example.com');
    });

    it('应该拒绝重复邮箱', async () => {
      // 先创建一个用户
      const user = await User.create('existing@example.com', 'password123');
      await userRepo.create({}, user);

      const input = {
        email: 'existing@example.com',
        password: 'password123',
      };

      await expect(authService.register({}, input)).rejects.toThrow('EMAIL_ALREADY_EXISTS');
    });

    it('应该拒绝重复用户名', async () => {
      const user = await User.create('user1@example.com', 'password123');
      user.updateProfile('takenusername');
      await userRepo.create({}, user);

      const input = {
        email: 'user2@example.com',
        password: 'password123',
        username: 'takenusername',
      };

      await expect(authService.register({}, input)).rejects.toThrow('USERNAME_ALREADY_EXISTS');
    });

    it('应该拒绝无效邮箱', async () => {
      const input = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(authService.register({}, input)).rejects.toThrow('INVALID_EMAIL');
    });

    it('应该拒绝弱密码', async () => {
      const input = {
        email: 'user@example.com',
        password: 'short',
      };

      await expect(authService.register({}, input)).rejects.toThrow('WEAK_PASSWORD');
    });
  });

  describe('login', () => {
    it('应该成功登录', async () => {
      // 创建测试用户
      const user = await User.create('test@example.com', 'password123');
      user.activate();
      await userRepo.create({}, user);

      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const output = await authService.login({}, input);

      expect(output.userId).toBe(user.id);
      expect(output.email).toBe('test@example.com');
      expect(output.accessToken).toBeDefined();
      expect(output.refreshToken).toBeDefined();
      expect(output.expiresIn).toBeGreaterThan(0);
    });

    it('应该拒绝错误密码', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.activate();
      await userRepo.create({}, user);

      const input = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      await expect(authService.login({}, input)).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('应该拒绝不存在的邮箱', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.login({}, input)).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('应该拒绝禁用用户登录', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.deactivate();
      await userRepo.create({}, user);

      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.login({}, input)).rejects.toThrow('USER_BANNED');
    });

    it('应该允许未激活用户登录', async () => {
      const user = await User.create('test@example.com', 'password123');
      // 不激活用户
      await userRepo.create({}, user);

      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const output = await authService.login({}, input);
      expect(output.userId).toBe(user.id);
    });
  });

  describe('refreshToken', () => {
    it('应该成功刷新 Token', async () => {
      // 创建测试用户
      const user = await User.create('test@example.com', 'password123');
      user.activate();
      await userRepo.create({}, user);

      // 生成 Refresh Token
      const { token: refreshToken } = jwtService.generateRefreshToken(user.id);

      const input = {
        refreshToken,
      };

      const output = await authService.refreshToken({}, input);

      expect(output.accessToken).toBeDefined();
      expect(output.refreshToken).toBeDefined();
      expect(output.expiresIn).toBeGreaterThan(0);
    });

    it('应该拒绝无效 Refresh Token', async () => {
      const input = {
        refreshToken: 'invalid-token',
      };

      await expect(authService.refreshToken({}, input)).rejects.toThrow('INVALID_REFRESH_TOKEN');
    });

    it('应该拒绝 Access Token 作为 Refresh Token', async () => {
      const user = await User.create('test@example.com', 'password123');
      await userRepo.create({}, user);

      const { token: accessToken } = jwtService.generateAccessToken(user.id, user.email);

      const input = {
        refreshToken: accessToken,
      };

      await expect(authService.refreshToken({}, input)).rejects.toThrow('INVALID_REFRESH_TOKEN');
    });

    it('应该拒绝不存在的用户', async () => {
      const nonExistentUserId = '00000000-0000-0000-0000-000000000999';
      const { token: refreshToken } = jwtService.generateRefreshToken(nonExistentUserId);

      const input = {
        refreshToken,
      };

      await expect(authService.refreshToken({}, input)).rejects.toThrow('USER_NOT_FOUND');
    });

    it('应该拒绝禁用用户的 Refresh Token', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.deactivate();
      await userRepo.create({}, user);

      const { token: refreshToken } = jwtService.generateRefreshToken(user.id);

      const input = {
        refreshToken,
      };

      await expect(authService.refreshToken({}, input)).rejects.toThrow('USER_BANNED');
    });
  });
});

