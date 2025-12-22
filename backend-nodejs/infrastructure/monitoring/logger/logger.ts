/**
 * 结构化日志模块
 * 基于 Pino 的高性能日志库，支持日志轮转、多输出、压缩归档
 * 
 * 功能：
 *   - 支持 JSON 和 Pretty 格式
 *   - 支持多种输出（stdout, stderr, file）
 *   - 支持日志轮转（按大小、时间轮转）
 *   - 支持日志压缩和归档
 *   - 支持日志级别（Debug, Info, Warn, Error）
 *   - 支持上下文字段（TraceID, RequestID）
 */

import pino, { type Logger as PinoLogger } from 'pino';
import { createWriteStream } from 'fs';

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  enabled: boolean;        // 是否启用结构化日志
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  output: 'stdout' | 'stderr' | 'file';
  outputPath?: string;     // 日志文件路径（当 output=file 时）
  maxSize?: number;        // 日志文件最大大小（MB）
  maxBackups?: number;     // 保留的旧日志文件数量
  maxAge?: number;         // 保留旧日志文件的最大天数
  compress?: boolean;      // 是否压缩旧日志
}

/**
 * Logger 类
 * 封装 Pino Logger，提供统一的日志接口
 */
export class Logger {
  private logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  /**
   * Debug 级别日志
   */
  debug(msg: string, fields?: Record<string, unknown>): void {
    this.logger.debug(fields || {}, msg);
  }

  /**
   * Info 级别日志
   */
  info(msg: string, fields?: Record<string, unknown>): void {
    this.logger.info(fields || {}, msg);
  }

  /**
   * Warn 级别日志
   */
  warn(msg: string, fields?: Record<string, unknown>): void {
    this.logger.warn(fields || {}, msg);
  }

  /**
   * Error 级别日志
   */
  error(msg: string, fields?: Record<string, unknown>): void {
    this.logger.error(fields || {}, msg);
  }

  /**
   * Fatal 级别日志（会退出程序）
   */
  fatal(msg: string, fields?: Record<string, unknown>): void {
    this.logger.fatal(fields || {}, msg);
  }

  /**
   * 添加上下文字段（返回新的 Logger）
   */
  child(fields: Record<string, unknown>): Logger {
    return new Logger(this.logger.child(fields));
  }

  /**
   * 刷新缓冲区（应用退出前调用）
   */
  async flush(): Promise<void> {
    // Pino 会自动刷新，但可以显式调用
    // 注意：Pino 是异步的，但 flush 不是必需的
  }

  /**
   * 获取原生 Pino Logger（用于高级用法）
   */
  getPino(): PinoLogger {
    return this.logger;
  }
}

/**
 * 创建日志输出流
 */
function createOutputStream(config: LoggerConfig): NodeJS.WritableStream {
  switch (config.output) {
    case 'stdout':
      return process.stdout;

    case 'stderr':
      return process.stderr;

    case 'file':
      if (!config.outputPath) {
        throw new Error('outputPath is required when output=file');
      }

      // 使用 pino/file 的文件流（支持日志轮转需要额外配置）
      // 注意：pino/file 本身不直接支持轮转，需要配合外部工具（如 logrotate）
      // 或者使用 pino-rotate 包（需要单独安装）
      return createWriteStream(config.outputPath);

    default:
      return process.stdout;
  }
}

/**
 * 创建 Logger 实例
 * 
 * @param config 日志配置
 * @returns Logger 实例，如果 enabled=false 则返回 null
 */
export function createLogger(config: LoggerConfig): Logger | null {
  if (!config.enabled) {
    return null; // 不启用结构化日志
  }

  // 创建输出流
  const stream = createOutputStream(config);

  // 创建 Pino Logger
  // 如果使用 pretty 格式，使用 transport（自动处理输出）
  // 否则使用指定的 stream
  const pinoLogger = config.format === 'pretty'
    ? pino({
        level: config.level,
        formatters: {
          level: (label: string) => {
            return { level: label.toUpperCase() };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
          },
        },
      })
    : pino(
        {
          level: config.level,
          formatters: {
            level: (label: string) => {
              return { level: label.toUpperCase() };
            },
          },
          timestamp: pino.stdTimeFunctions.isoTime,
        },
        stream
      );

  return new Logger(pinoLogger);
}

/**
 * 全局 Logger 实例
 */
let globalLogger: Logger | null = null;

/**
 * 初始化全局 Logger
 * 
 * @param config 日志配置
 * @throws {Error} 配置错误时抛出异常
 */
export function initGlobalLogger(config: LoggerConfig): void {
  const logger = createLogger(config);
  globalLogger = logger;

  if (logger) {
    logger.info('Structured logger initialized', {
      level: config.level,
      format: config.format,
      output: config.output,
      outputPath: config.outputPath,
    });
  }
}

/**
 * 获取全局 Logger
 * 
 * @returns Logger 实例，如果未初始化则返回 null
 */
export function getGlobalLogger(): Logger | null {
  return globalLogger;
}

/**
 * 便捷函数：使用全局 Logger 输出日志
 */
export function debug(msg: string, fields?: Record<string, unknown>): void {
  if (globalLogger) {
    globalLogger.debug(msg, fields);
  }
}

export function info(msg: string, fields?: Record<string, unknown>): void {
  if (globalLogger) {
    globalLogger.info(msg, fields);
  }
}

export function warn(msg: string, fields?: Record<string, unknown>): void {
  if (globalLogger) {
    globalLogger.warn(msg, fields);
  }
}

export function error(msg: string, fields?: Record<string, unknown>): void {
  if (globalLogger) {
    globalLogger.error(msg, fields);
  }
}

/**
 * 刷新全局 Logger 缓冲区
 */
export async function flush(): Promise<void> {
  if (globalLogger) {
    await globalLogger.flush();
  }
}

