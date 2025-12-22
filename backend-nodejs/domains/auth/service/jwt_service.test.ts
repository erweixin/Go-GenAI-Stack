/**
 * JWTService 单元测试
 */

import { describe, it, expect } from 'vitest';
import { JWTService } from './jwt_service.js';

describe('JWTService', () => {
  const config = {
    secret: 'test-secret-key-for-jwt-testing',
    accessTokenExpiry: 3600, // 1 小时
    refreshTokenExpiry: 604800, // 7 天
    issuer: 'test-issuer',
  };

  const jwtService = new JWTService(config);
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testEmail = 'test@example.com';

  describe('generateAccessToken', () => {
    it('应该成功生成 Access Token', () => {
      const { token, expiresAt } = jwtService.generateAccessToken(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('生成的 Token 应该包含正确的 Claims', () => {
      const { token } = jwtService.generateAccessToken(testUserId, testEmail);
      const payload = jwtService.verifyAccessToken(token);

      expect(payload.user_id).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('access');
      expect(payload.iss).toBe(config.issuer);
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    });

    it('生成的 Token 应该在指定时间后过期', () => {
      const { expiresAt } = jwtService.generateAccessToken(testUserId, testEmail);
      const expectedExpiry = Date.now() + config.accessTokenExpiry * 1000;

      // 允许 1 秒的误差
      expect(Math.abs(expiresAt.getTime() - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('generateRefreshToken', () => {
    it('应该成功生成 Refresh Token', () => {
      const { token, expiresAt } = jwtService.generateRefreshToken(testUserId);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('生成的 Token 应该包含正确的 Claims', () => {
      const { token } = jwtService.generateRefreshToken(testUserId);
      const payload = jwtService.verifyRefreshToken(token);

      expect(payload.user_id).toBe(testUserId);
      expect(payload.type).toBe('refresh');
      expect(payload.iss).toBe(config.issuer);
      expect(payload.email).toBeUndefined(); // Refresh Token 不包含 email
    });

    it('生成的 Token 应该在指定时间后过期', () => {
      const { expiresAt } = jwtService.generateRefreshToken(testUserId);
      const expectedExpiry = Date.now() + config.refreshTokenExpiry * 1000;

      // 允许 1 秒的误差
      expect(Math.abs(expiresAt.getTime() - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe('verifyToken', () => {
    it('应该成功验证有效 Token', () => {
      const { token } = jwtService.generateAccessToken(testUserId, testEmail);
      const payload = jwtService.verifyToken(token);

      expect(payload.user_id).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('access');
    });

    it('应该拒绝无效 Token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwtService.verifyToken(invalidToken);
      }).toThrow('Token 验证失败');
    });

    it('应该拒绝错误 Secret 签名的 Token', () => {
      const wrongService = new JWTService({
        ...config,
        secret: 'wrong-secret',
      });
      const { token } = wrongService.generateAccessToken(testUserId, testEmail);

      expect(() => {
        jwtService.verifyToken(token);
      }).toThrow('Token 验证失败');
    });

    it('应该拒绝错误 Issuer 的 Token', () => {
      const wrongService = new JWTService({
        ...config,
        issuer: 'wrong-issuer',
      });
      const { token } = wrongService.generateAccessToken(testUserId, testEmail);

      expect(() => {
        jwtService.verifyToken(token);
      }).toThrow('Issuer 不匹配');
    });
  });

  describe('verifyAccessToken', () => {
    it('应该成功验证 Access Token', () => {
      const { token } = jwtService.generateAccessToken(testUserId, testEmail);
      const payload = jwtService.verifyAccessToken(token);

      expect(payload.type).toBe('access');
      expect(payload.user_id).toBe(testUserId);
    });

    it('应该拒绝 Refresh Token 作为 Access Token', () => {
      const { token } = jwtService.generateRefreshToken(testUserId);

      expect(() => {
        jwtService.verifyAccessToken(token);
      }).toThrow('Token 类型必须是 access');
    });
  });

  describe('verifyRefreshToken', () => {
    it('应该成功验证 Refresh Token', () => {
      const { token } = jwtService.generateRefreshToken(testUserId);
      const payload = jwtService.verifyRefreshToken(token);

      expect(payload.type).toBe('refresh');
      expect(payload.user_id).toBe(testUserId);
    });

    it('应该拒绝 Access Token 作为 Refresh Token', () => {
      const { token } = jwtService.generateAccessToken(testUserId, testEmail);

      expect(() => {
        jwtService.verifyRefreshToken(token);
      }).toThrow('Token 类型必须是 refresh');
    });
  });

  describe('extractUserId', () => {
    it('应该成功提取用户 ID', () => {
      const { token } = jwtService.generateAccessToken(testUserId, testEmail);
      const userId = jwtService.extractUserId(token);

      expect(userId).toBe(testUserId);
    });

    it('应该从 Refresh Token 提取用户 ID', () => {
      const { token } = jwtService.generateRefreshToken(testUserId);
      const userId = jwtService.extractUserId(token);

      expect(userId).toBe(testUserId);
    });
  });
});

