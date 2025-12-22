/**
 * 事件类型定义
 * 定义事件接口和基础事件结构
 */

/**
 * 事件接口
 * 所有领域事件都需要实现这个接口
 */
export interface Event {
  /**
   * 事件类型（如 "TaskCreated", "UserRegistered"）
   */
  type: string;

  /**
   * 事件来源领域（如 "task", "user", "auth"）
   */
  source: string;

  /**
   * 事件负载数据（具体的事件数据）
   */
  payload: unknown;

  /**
   * 事件发生时间
   */
  timestamp: Date;

  /**
   * 事件唯一标识
   */
  id: string;
}

/**
 * 事件处理器函数类型
 *
 * 处理器应该快速返回，耗时操作应该异步执行
 */
export type EventHandler = (ctx: unknown, event: Event) => Promise<void> | void;

/**
 * 基础事件类
 * 所有领域事件可以继承这个类
 */
export class BaseEvent implements Event {
  public readonly id: string;
  public readonly type: string;
  public readonly source: string;
  public readonly payload: unknown;
  public readonly timestamp: Date;

  constructor(type: string, source: string, payload: unknown) {
    this.id = this.generateId();
    this.type = type;
    this.source = source;
    this.payload = payload;
    this.timestamp = new Date();
  }

  /**
   * 生成事件 ID
   */
  private generateId(): string {
    // 使用时间戳 + 随机数生成唯一 ID
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
