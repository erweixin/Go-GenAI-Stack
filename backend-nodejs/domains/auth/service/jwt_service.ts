/**
 * JWT Service
 * 负责 JWT Token 的生成和验证
 */

import * as jwt from 'jsonwebtoken';

export type TokenType = 'access' | 'refresh';

export interface JWTPayload {
  user_id: string;
  email?: string;
  type: TokenType;
  iss: string;
  exp: number;
  iat: number;
}

export interface JWTConfig {
  secret: string;
  accessTokenExpiry: number; // 秒
  refreshTokenExpiry: number; // 秒
  issuer: string;
}

/**
 * JWTService JWT 服务
 */
export class JWTService {
  private config: JWTConfig;

  constructor(config: JWTConfig) {
    this.config = config;
  }

  /**
   * 生成 Access Token
   */
  generateAccessToken(userId: string, email: string): { token: string; expiresAt: Date } {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.config.accessTokenExpiry;

    const payload: JWTPayload = {
      user_id: userId,
      email,
      type: 'access',
      iss: this.config.issuer,
      exp: expiresAt,
      iat: now,
    };

    const token = jwt.sign(payload, this.config.secret, {
      algorithm: 'HS256',
    });

    return {
      token,
      expiresAt: new Date(expiresAt * 1000),
    };
  }

  /**
   * 生成 Refresh Token
   */
  generateRefreshToken(userId: string): { token: string; expiresAt: Date } {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.config.refreshTokenExpiry;

    const payload: JWTPayload = {
      user_id: userId,
      type: 'refresh',
      iss: this.config.issuer,
      exp: expiresAt,
      iat: now,
    };

    const token = jwt.sign(payload, this.config.secret, {
      algorithm: 'HS256',
    });

    return {
      token,
      expiresAt: new Date(expiresAt * 1000),
    };
  }

  /**
   * 验证 Token
   */
  verifyToken(tokenString: string): JWTPayload {
    try {
      const decoded = jwt.verify(tokenString, this.config.secret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      // 验证 Issuer
      if (decoded.iss !== this.config.issuer) {
        throw new Error('INVALID_ISSUER: Issuer 不匹配');
      }

      // 转换为 JWTPayload
      const payload: JWTPayload = {
        user_id: decoded.user_id as string,
        email: decoded.email as string | undefined,
        type: decoded.type as TokenType,
        iss: decoded.iss as string,
        exp: decoded.exp as number,
        iat: decoded.iat as number,
      };

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('INVALID_TOKEN: Token 已过期');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN: Token 验证失败');
      }
      throw error;
    }
  }

  /**
   * 验证 Access Token
   */
  verifyAccessToken(tokenString: string): JWTPayload {
    const payload = this.verifyToken(tokenString);

    if (payload.type !== 'access') {
      throw new Error('INVALID_TOKEN_TYPE: Token 类型必须是 access');
    }

    return payload;
  }

  /**
   * 验证 Refresh Token
   */
  verifyRefreshToken(tokenString: string): JWTPayload {
    const payload = this.verifyToken(tokenString);

    if (payload.type !== 'refresh') {
      throw new Error('INVALID_TOKEN_TYPE: Token 类型必须是 refresh');
    }

    return payload;
  }

  /**
   * 从 Token 中提取用户 ID
   */
  extractUserId(tokenString: string): string {
    const payload = this.verifyToken(tokenString);
    return payload.user_id;
  }
}

