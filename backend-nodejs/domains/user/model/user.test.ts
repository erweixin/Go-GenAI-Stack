/**
 * User Model 单元测试
 */

import { describe, it, expect } from 'vitest';
import { User, UserStatuses } from './user.js';

describe('User Model', () => {
  describe('create', () => {
    it('应该创建有效用户', async () => {
      const user = await User.create('test@example.com', 'password123');

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('password123'); // 应该是哈希值
      expect(user.status).toBe(UserStatuses.Inactive);
      expect(user.emailVerified).toBe(false);
      expect(user.username).toBe('');
      expect(user.fullName).toBe('');
      expect(user.avatarURL).toBe('');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.lastLoginAt).toBeNull();
    });

    it('应该规范化邮箱（转为小写）', async () => {
      const user = await User.create('TEST@EXAMPLE.COM', 'password123');
      expect(user.email).toBe('test@example.com');
    });

    it('应该拒绝无效邮箱格式', async () => {
      await expect(User.create('invalid-email', 'password123')).rejects.toThrow('邮箱格式无效');
    });

    it('应该拒绝空邮箱', async () => {
      await expect(User.create('', 'password123')).rejects.toThrow('邮箱格式无效');
    });

    it('应该拒绝弱密码（少于 8 字符）', async () => {
      await expect(User.create('test@example.com', 'short')).rejects.toThrow('密码强度不足');
    });

    it('应该拒绝过长密码（超过 128 字符）', async () => {
      const longPassword = 'a'.repeat(129);
      await expect(User.create('test@example.com', longPassword)).rejects.toThrow('密码过长');
    });

    it('应该接受最小长度密码（8 字符）', async () => {
      const user = await User.create('test@example.com', '12345678');
      expect(user.id).toBeDefined();
    });

    it('应该接受最大长度密码（128 字符）', async () => {
      const maxPassword = 'a'.repeat(128);
      const user = await User.create('test@example.com', maxPassword);
      expect(user.id).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('应该验证正确密码', async () => {
      const user = await User.create('test@example.com', 'password123');
      const isValid = await user.verifyPassword('password123');
      expect(isValid).toBe(true);
    });

    it('应该拒绝错误密码', async () => {
      const user = await User.create('test@example.com', 'password123');
      const isValid = await user.verifyPassword('wrong-password');
      expect(isValid).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('应该成功更新密码', async () => {
      const user = await User.create('test@example.com', 'old-password');
      const oldHash = user.passwordHash;
      const oldUpdatedAt = user.updatedAt;

      await new Promise<void>(resolve => setTimeout(resolve, 10));

      await user.updatePassword('new-password-123');

      expect(user.passwordHash).not.toBe(oldHash);
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      // 验证新密码可以登录
      const isValid = await user.verifyPassword('new-password-123');
      expect(isValid).toBe(true);
    });

    it('应该拒绝弱密码', async () => {
      const user = await User.create('test@example.com', 'old-password');
      await expect(user.updatePassword('short')).rejects.toThrow('密码强度不足');
    });

    it('应该拒绝过长密码', async () => {
      const user = await User.create('test@example.com', 'old-password');
      const longPassword = 'a'.repeat(129);
      await expect(user.updatePassword(longPassword)).rejects.toThrow('密码过长');
    });
  });

  describe('updateProfile', () => {
    it('应该成功更新用户名', async () => {
      const user = await User.create('test@example.com', 'password123');
      const oldUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      user.updateProfile('newusername');

      expect(user.username).toBe('newusername');
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('应该成功更新全名', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.updateProfile(undefined, 'New Full Name');

      expect(user.fullName).toBe('New Full Name');
    });

    it('应该成功更新头像 URL', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.updateProfile(undefined, undefined, 'https://example.com/avatar.jpg');

      expect(user.avatarURL).toBe('https://example.com/avatar.jpg');
    });

    it('应该拒绝无效用户名（太短）', async () => {
      const user = await User.create('test@example.com', 'password123');
      expect(() => {
        user.updateProfile('ab');
      }).toThrow('用户名格式无效');
    });

    it('应该拒绝无效用户名（太长）', async () => {
      const user = await User.create('test@example.com', 'password123');
      const longUsername = 'a'.repeat(31);
      expect(() => {
        user.updateProfile(longUsername);
      }).toThrow('用户名格式无效');
    });

    it('应该拒绝无效用户名（包含特殊字符）', async () => {
      const user = await User.create('test@example.com', 'password123');
      expect(() => {
        user.updateProfile('user-name');
      }).toThrow('用户名格式无效');
    });

    it('应该接受有效用户名（3-30 字符，字母数字下划线）', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.updateProfile('valid_username_123');
      expect(user.username).toBe('valid_username_123');
    });

    it('应该拒绝全名过长', async () => {
      const user = await User.create('test@example.com', 'password123');
      const longName = 'a'.repeat(101);
      expect(() => {
        user.updateProfile(undefined, longName);
      }).toThrow('全名过长');
    });

    it('应该拒绝无效头像 URL（非 HTTP/HTTPS）', async () => {
      const user = await User.create('test@example.com', 'password123');
      expect(() => {
        user.updateProfile(undefined, undefined, 'ftp://example.com/avatar.jpg');
      }).toThrow('头像 URL 格式无效');
    });

    it('应该接受空字符串（不更新）', async () => {
      const user = await User.create('test@example.com', 'password123');
      user.updateProfile('username');
      const oldUsername = user.username;

      user.updateProfile(''); // 空字符串不更新
      expect(user.username).toBe(oldUsername);
    });
  });

  describe('activate', () => {
    it('应该激活未激活用户', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Inactive,
        false
      );

      user.activate();

      expect(user.status).toBe(UserStatuses.Active);
      expect(user.emailVerified).toBe(true);
    });

    it('应该允许重复激活（幂等）', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Active,
        true
      );

      user.activate(); // 再次激活

      expect(user.status).toBe(UserStatuses.Active);
      expect(user.emailVerified).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('应该禁用用户', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Active,
        true
      );

      user.deactivate();

      expect(user.status).toBe(UserStatuses.Banned);
    });

    it('应该允许重复禁用（幂等）', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Banned,
        true
      );

      user.deactivate(); // 再次禁用

      expect(user.status).toBe(UserStatuses.Banned);
    });
  });

  describe('recordLogin', () => {
    it('应该记录登录时间', async () => {
      const user = await User.create('test@example.com', 'password123');
      const oldLastLoginAt = user.lastLoginAt;
      const oldUpdatedAt = user.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      user.recordLogin();

      expect(user.lastLoginAt).toBeInstanceOf(Date);
      expect(user.lastLoginAt).not.toBe(oldLastLoginAt);
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });

  describe('canLogin', () => {
    it('应该允许激活用户登录', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Active,
        true
      );

      expect(() => {
        user.canLogin();
      }).not.toThrow();
    });

    it('应该允许未激活用户登录', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Inactive,
        false
      );

      expect(() => {
        user.canLogin();
      }).not.toThrow();
    });

    it('应该拒绝禁用用户登录', () => {
      const user = new User(
        'user-id',
        'test@example.com',
        'hash',
        '',
        '',
        '',
        UserStatuses.Banned,
        true
      );

      expect(() => {
        user.canLogin();
      }).toThrow('用户已被禁用');
    });
  });
});
