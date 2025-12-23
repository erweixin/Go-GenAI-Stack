/**
 * 配置管理模块
 * 从环境变量读取配置，使用 Zod 进行验证，提供类型安全的配置对象
 */

import { z } from 'zod';

/**
 * 解析时间字符串为秒数
 * 支持格式：15m, 1h, 7d, 3600 (纯数字表示秒)
 */
function parseTimeToSeconds(timeStr: string | undefined): number {
  if (!timeStr) {
    return 0;
  }

  // 如果是纯数字，直接返回
  const numOnly = /^\d+$/.test(timeStr);
  if (numOnly) {
    return parseInt(timeStr, 10);
  }

  // 解析带单位的时间字符串
  const match = timeStr.match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}. Expected format: 15m, 1h, 7d, or 3600`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

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
    maxConnections: z.coerce
      .number()
      .int()
      .positive()
      .max(100, 'Database max connections cannot exceed 100')
      .default(25),
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
    secret: z
      .string()
      .min(1, 'JWT secret is required')
      .refine(
        val => {
          // 测试环境可以使用固定值，但长度仍需满足最小要求
          if (process.env.NODE_ENV === 'test') {
            return val.length >= 16; // 测试环境降低要求到 16 字符
          }
          return val.length >= 32; // 生产环境要求至少 32 字符
        },
        {
          message: 'JWT secret must be at least 32 characters (16 in test mode)',
        }
      ),
    accessTokenExpiry: z
      .preprocess(val => {
        if (typeof val === 'string') {
          return parseTimeToSeconds(val);
        }
        return typeof val === 'number' ? val : parseTimeToSeconds(String(val));
      }, z.number().int().positive())
      .default(3600), // 1 小时（默认）
    refreshTokenExpiry: z
      .preprocess(val => {
        if (typeof val === 'string') {
          return parseTimeToSeconds(val);
        }
        return typeof val === 'number' ? val : parseTimeToSeconds(String(val));
      }, z.number().int().positive())
      .default(604800), // 7 天（默认）
    issuer: z.string().default('go-genai-stack'),
  }),
  logging: z.object({
    enabled: z.coerce.boolean().default(true),
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'pretty']).default('json'),
    output: z.enum(['stdout', 'stderr', 'file']).default('stdout'),
    outputPath: z.string().optional(),
    maxSize: z.coerce.number().int().positive().optional(), // MB
    maxBackups: z.coerce.number().int().nonnegative().optional(),
    maxAge: z.coerce.number().int().nonnegative().optional(), // days
    compress: z.coerce.boolean().default(false),
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
      logging: {
        enabled: process.env.LOGGING_ENABLED,
        level: process.env.LOGGING_LEVEL,
        format: process.env.LOGGING_FORMAT,
        output: process.env.LOGGING_OUTPUT,
        outputPath: process.env.LOGGING_OUTPUT_PATH,
        maxSize: process.env.LOGGING_MAX_SIZE,
        maxBackups: process.env.LOGGING_MAX_BACKUPS,
        maxAge: process.env.LOGGING_MAX_AGE,
        compress: process.env.LOGGING_COMPRESS,
      },
    };

    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      error.issues.forEach(issue => {
        const path = issue.path.join('.');
        console.error(`   ${path}: ${issue.message}`);
      });
      console.error('\nPlease check your environment variables and .env file.');
      process.exit(1);
    }
    throw error;
  }
}
