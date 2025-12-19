/**
 * 配置管理模块
 * 从环境变量读取配置，提供类型安全的配置对象
 */

export interface Config {
  server: {
    host: string;
    port: number;
    env: string;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    sslMode: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
}

/**
 * 加载配置
 * 从环境变量读取配置，提供默认值
 */
export function loadConfig(): Config {
  return {
    server: {
      host: process.env.SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8081', 10),
      env: process.env.NODE_ENV || 'development',
    },
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5435', 10),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'go_genai_stack_backend_debug',
      sslMode: process.env.DATABASE_SSL_MODE || 'disable',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '25', 10),
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10000', 10),
      connectionTimeout: parseInt(
        process.env.DATABASE_CONNECTION_TIMEOUT || '2000',
        10
      ),
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  };
}

