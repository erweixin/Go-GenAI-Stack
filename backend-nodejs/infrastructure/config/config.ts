/**
 * 配置管理模块
 * 从环境变量读取配置，使用 Zod 进行验证，提供类型安全的配置对象
 */

import { z } from 'zod';

/**
 * 配置 Schema（使用 Zod 进行验证）
 */
const ConfigSchema = z.object({
  server: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.coerce.number().int().positive().default(8080),
    env: z.enum(['development', 'production', 'test']).default('development'),
  }),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().int().positive().default(5432),
    user: z.string().min(1, 'Database user is required'),
    password: z.string().min(1, 'Database password is required'),
    database: z.string().min(1, 'Database name is required'),
    sslMode: z.enum(['disable', 'require', 'verify-ca', 'verify-full']).default('disable'),
    maxConnections: z.coerce.number().int().positive().default(25),
    idleTimeout: z.coerce.number().int().nonnegative().default(10000),
    connectionTimeout: z.coerce.number().int().nonnegative().default(2000),
  }),
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().int().positive().default(6379),
    password: z.string().default(''),
    db: z.coerce.number().int().nonnegative().default(0),
  }),
  jwt: z.object({
    secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    accessTokenExpiry: z.coerce.number().int().positive().default(3600), // 1 小时
    refreshTokenExpiry: z.coerce.number().int().positive().default(604800), // 7 天
    issuer: z.string().default('go-genai-stack'),
  }),
});

/**
 * 配置类型（从 Schema 自动推断）
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * 加载配置
 * 从环境变量读取配置，使用 Zod 进行验证
 * 
 * @throws {Error} 配置验证失败时抛出错误
 */
export function loadConfig(): Config {
  try {
    const rawConfig = {
      server: {
        host: process.env.SERVER_HOST,
        port: process.env.SERVER_PORT || process.env.PORT,
        env: process.env.NODE_ENV,
      },
      database: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        sslMode: process.env.DATABASE_SSL_MODE,
        maxConnections: process.env.DATABASE_MAX_CONNECTIONS,
        idleTimeout: process.env.DATABASE_IDLE_TIMEOUT,
        connectionTimeout: process.env.DATABASE_CONNECTION_TIMEOUT,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB,
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY,
        issuer: process.env.JWT_ISSUER,
      },
    };

    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`   ${path}: ${err.message}`);
      });
      console.error('\nPlease check your environment variables and .env file.');
      process.exit(1);
    }
    throw error;
  }
}

