/**
 * 事件总线
 * 提供事件发布/订阅机制，支持领域间解耦通信
 * 
 * 当前实现：内存事件总线（InMemoryEventBus）
 * 未来扩展：可以替换为 Redis Pub/Sub、Kafka 等
 */

import type { Event, EventHandler } from './types.js';
import { getGlobalLogger } from '../../../infrastructure/monitoring/logger/logger.js';

/**
 * 事件总线接口
 */
export interface EventBus {
  /**
   * 发布事件
   * 
   * @param ctx 请求上下文
   * @param event 事件对象
   */
  publish(ctx: unknown, event: Event): Promise<void>;

  /**
   * 订阅事件类型
   * 
   * @param eventType 事件类型（如 "TaskCreated"）
   * @param handler 事件处理器
   */
  subscribe(eventType: string, handler: EventHandler): void;

  /**
   * 取消订阅
   * 
   * @param eventType 事件类型
   * @param handler 事件处理器（可选，如果不提供则取消该类型的所有订阅）
   */
  unsubscribe(eventType: string, handler?: EventHandler): void;

  /**
   * 关闭事件总线
   */
  close(): Promise<void>;
}

/**
 * 内存事件总线实现
 * 
 * 适用于开发环境和单体应用
 * 生产环境建议使用 Kafka 等消息队列
 */
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, Array<EventHandler>>();
  
  /**
   * 记录日志
   * 优先使用全局结构化日志，如果未初始化则降级到 console
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, unknown>): void {
    const globalLogger = getGlobalLogger();
    
    if (globalLogger) {
      // 使用结构化日志，添加上下文字段
      const logFields = {
        component: 'EventBus',
        ...fields,
      };
      
      switch (level) {
        case 'debug':
          globalLogger.debug(`[EventBus] ${message}`, logFields);
          break;
        case 'info':
          globalLogger.info(`[EventBus] ${message}`, logFields);
          break;
        case 'warn':
          globalLogger.warn(`[EventBus] ${message}`, logFields);
          break;
        case 'error':
          globalLogger.error(`[EventBus] ${message}`, logFields);
          break;
      }
    } else {
      // 降级到 console（logger 未初始化时）
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      logFn(`[EventBus] ${message}`, fields || {});
    }
  }

  /**
   * 发布事件
   * 
   * 同步调用所有订阅者的处理器
   * 如果任何处理器返回错误，会记录日志但不中断其他处理器
   */
  async publish(ctx: unknown, event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    if (handlers.length === 0) {
      // 没有订阅者时，只记录调试日志（不是错误）
      this.log('debug', `No handlers for event type: ${event.type}`, {
        eventType: event.type,
        eventId: event.id,
        source: event.source,
      });
      return;
    }

    // 记录事件发布
    this.log('info', `Publishing event: ${event.type}`, {
      eventType: event.type,
      eventId: event.id,
      source: event.source,
      handlerCount: handlers.length,
    });

    // 调用所有处理器（并行执行）
    const results = await Promise.allSettled(
      handlers.map(async (handler, index) => {
        try {
          await this.callHandler(ctx, event, handler, index);
        } catch (error) {
          // 记录错误但不中断其他处理器
          this.log('error', `Event handler failed: ${event.type}`, {
            eventType: event.type,
            eventId: event.id,
            handlerIndex: index,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error; // 重新抛出，让 Promise.allSettled 捕获
        }
      })
    );

    // 检查是否有失败的处理器
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      this.log('warn', `Some event handlers failed: ${event.type}`, {
        eventType: event.type,
        eventId: event.id,
        failureCount: failures.length,
        totalHandlers: handlers.length,
      });
    }
  }

  /**
   * 调用单个处理器
   * 
   * 包含 panic 恢复机制
   */
  private async callHandler(
    ctx: unknown,
    event: Event,
    handler: EventHandler,
    index: number
  ): Promise<void> {
    try {
      const result = handler(ctx, event);
      
      // 如果返回 Promise，等待完成
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      // 记录 panic 错误
      this.log('error', `Event handler panicked: ${event.type}`, {
        eventType: event.type,
        eventId: event.id,
        handlerIndex: index,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 订阅事件类型
   * 
   * @param eventType 事件类型（如 "TaskCreated"）
   * @param handler 事件处理器
   * 
   * @example
   * ```typescript
   * eventBus.subscribe('TaskCreated', async (ctx, event) => {
   *   const payload = event.payload as TaskCreatedPayload;
   *   // 处理事件
   * });
   * ```
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!eventType || eventType.trim().length === 0) {
      throw new Error('Event type cannot be empty');
    }

    if (!handler) {
      throw new Error('Handler cannot be null or undefined');
    }

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);

    this.log('info', `Subscribed to event type: ${eventType}`, {
      eventType,
      totalHandlers: this.handlers.get(eventType)!.length,
    });
  }

  /**
   * 取消订阅
   * 
   * 注意：由于 JavaScript 的函数比较限制，如果提供了 handler，
   * 会移除第一个匹配的处理器；如果不提供 handler，会移除该类型的所有订阅
   */
  unsubscribe(eventType: string, handler?: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      return;
    }

    if (handler) {
      // 移除指定的处理器（移除第一个匹配的）
      const handlers = this.handlers.get(eventType)!;
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.handlers.delete(eventType);
        }
      }
    } else {
      // 移除该类型的所有订阅
      this.handlers.delete(eventType);
    }

    this.log('info', `Unsubscribed from event type: ${eventType}`, {
      eventType,
    });
  }

  /**
   * 关闭事件总线
   * 
   * 清除所有订阅
   */
  async close(): Promise<void> {
    this.handlers.clear();
    this.log('info', 'Event bus closed');
  }
}

/**
 * 创建默认的事件总线实例
 */
export function createEventBus(): EventBus {
  return new InMemoryEventBus();
}

