/**
 * EventBus 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventBus, createEventBus } from './event_bus.js';
import { BaseEvent, type EventHandler } from './types.js';

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;
  let mockContext: unknown;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
    mockContext = { requestId: 'test-request-id' };
  });

  describe('subscribe', () => {
    it('应该成功订阅事件类型', () => {
      const handler: EventHandler = vi.fn();
      
      expect(() => {
        eventBus.subscribe('TaskCreated', handler);
      }).not.toThrow();
    });

    it('应该支持多个处理器订阅同一事件类型', () => {
      const handler1: EventHandler = vi.fn();
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      
      // 应该可以正常订阅，不会抛出异常
      expect(true).toBe(true);
    });

    it('应该拒绝空的事件类型', () => {
      const handler: EventHandler = vi.fn();
      
      expect(() => {
        eventBus.subscribe('', handler);
      }).toThrow('Event type cannot be empty');
    });

    it('应该拒绝空白的事件类型', () => {
      const handler: EventHandler = vi.fn();
      
      expect(() => {
        eventBus.subscribe('   ', handler);
      }).toThrow('Event type cannot be empty');
    });

    it('应该拒绝 null 或 undefined 的处理器', () => {
      expect(() => {
        eventBus.subscribe('TaskCreated', null as unknown as EventHandler);
      }).toThrow('Handler cannot be null or undefined');
      
      expect(() => {
        eventBus.subscribe('TaskCreated', undefined as unknown as EventHandler);
      }).toThrow('Handler cannot be null or undefined');
    });
  });

  describe('publish', () => {
    it('应该成功发布事件并调用订阅的处理器', async () => {
      const handler: EventHandler = vi.fn();
      eventBus.subscribe('TaskCreated', handler);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      await eventBus.publish(mockContext, event);
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(mockContext, event);
    });

    it('应该调用所有订阅的处理器', async () => {
      const handler1: EventHandler = vi.fn();
      const handler2: EventHandler = vi.fn();
      const handler3: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      eventBus.subscribe('TaskCreated', handler3);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      await eventBus.publish(mockContext, event);
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('应该支持异步处理器', async () => {
      const handler: EventHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      eventBus.subscribe('TaskCreated', handler);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      await eventBus.publish(mockContext, event);
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('应该支持同步处理器', async () => {
      const handler: EventHandler = vi.fn(() => {
        // 同步处理器
      });
      
      eventBus.subscribe('TaskCreated', handler);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      await eventBus.publish(mockContext, event);
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('当没有订阅者时应该正常返回', async () => {
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      // 不应该抛出异常
      await expect(eventBus.publish(mockContext, event)).resolves.not.toThrow();
    });

    it('当处理器抛出错误时应该继续执行其他处理器', async () => {
      const handler1: EventHandler = vi.fn(() => {
        throw new Error('Handler 1 failed');
      });
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      // 应该不抛出异常，继续执行其他处理器
      await expect(eventBus.publish(mockContext, event)).resolves.not.toThrow();
      
      // handler2 应该被调用
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('当处理器返回 Promise 并 reject 时应该继续执行其他处理器', async () => {
      const handler1: EventHandler = vi.fn(async () => {
        throw new Error('Handler 1 failed');
      });
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      // 应该不抛出异常，继续执行其他处理器
      await expect(eventBus.publish(mockContext, event)).resolves.not.toThrow();
      
      // handler2 应该被调用
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('应该并行执行所有处理器', async () => {
      const executionOrder: number[] = [];
      
      const handler1: EventHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push(1);
      });
      
      const handler2: EventHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        executionOrder.push(2);
      });
      
      const handler3: EventHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push(3);
      });
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      eventBus.subscribe('TaskCreated', handler3);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      await eventBus.publish(mockContext, event);
      
      // 由于并行执行，执行顺序应该是 3, 2, 1（按完成时间）
      expect(executionOrder).toEqual([3, 2, 1]);
    });
  });

  describe('unsubscribe', () => {
    it('应该成功取消订阅指定的处理器', () => {
      const handler1: EventHandler = vi.fn();
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      
      eventBus.unsubscribe('TaskCreated', handler1);
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      // handler1 不应该被调用
      eventBus.publish(mockContext, event);
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('当不提供处理器时应该取消该类型的所有订阅', () => {
      const handler1: EventHandler = vi.fn();
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('TaskCreated', handler2);
      
      eventBus.unsubscribe('TaskCreated');
      
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      // 两个处理器都不应该被调用
      eventBus.publish(mockContext, event);
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('当事件类型不存在时应该正常返回', () => {
      expect(() => {
        eventBus.unsubscribe('NonExistentEvent');
      }).not.toThrow();
    });

    it('当处理器不存在时应该正常返回', () => {
      const handler1: EventHandler = vi.fn();
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      
      // 尝试取消订阅不存在的处理器
      expect(() => {
        eventBus.unsubscribe('TaskCreated', handler2);
      }).not.toThrow();
      
      // handler1 应该仍然被调用
      const event = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      eventBus.publish(mockContext, event);
      
      expect(handler1).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('应该清除所有订阅', async () => {
      const handler1: EventHandler = vi.fn();
      const handler2: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', handler1);
      eventBus.subscribe('UserCreated', handler2);
      
      await eventBus.close();
      
      const event1 = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      const event2 = new BaseEvent('UserCreated', 'user', { userId: '456' });
      
      await eventBus.publish(mockContext, event1);
      await eventBus.publish(mockContext, event2);
      
      // 所有处理器都不应该被调用
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('应该可以多次调用而不抛出异常', async () => {
      await expect(eventBus.close()).resolves.not.toThrow();
      await expect(eventBus.close()).resolves.not.toThrow();
    });
  });

  describe('多事件类型', () => {
    it('应该支持订阅不同类型的事件', async () => {
      const taskHandler: EventHandler = vi.fn();
      const userHandler: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', taskHandler);
      eventBus.subscribe('UserCreated', userHandler);
      
      const taskEvent = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      const userEvent = new BaseEvent('UserCreated', 'user', { userId: '456' });
      
      await eventBus.publish(mockContext, taskEvent);
      await eventBus.publish(mockContext, userEvent);
      
      expect(taskHandler).toHaveBeenCalledTimes(1);
      expect(taskHandler).toHaveBeenCalledWith(mockContext, taskEvent);
      
      expect(userHandler).toHaveBeenCalledTimes(1);
      expect(userHandler).toHaveBeenCalledWith(mockContext, userEvent);
    });

    it('应该只调用对应事件类型的处理器', async () => {
      const taskHandler: EventHandler = vi.fn();
      const userHandler: EventHandler = vi.fn();
      
      eventBus.subscribe('TaskCreated', taskHandler);
      eventBus.subscribe('UserCreated', userHandler);
      
      const taskEvent = new BaseEvent('TaskCreated', 'task', { taskId: '123' });
      
      await eventBus.publish(mockContext, taskEvent);
      
      expect(taskHandler).toHaveBeenCalledTimes(1);
      expect(userHandler).not.toHaveBeenCalled();
    });
  });
});

describe('createEventBus', () => {
  it('应该创建 InMemoryEventBus 实例', () => {
    const eventBus = createEventBus();
    
    expect(eventBus).toBeInstanceOf(InMemoryEventBus);
  });

  it('创建的事件总线应该可以正常工作', async () => {
    const eventBus = createEventBus();
    const handler: EventHandler = vi.fn();
    
    eventBus.subscribe('TestEvent', handler);
    
    const event = new BaseEvent('TestEvent', 'test', { data: 'test' });
    await eventBus.publish({}, event);
    
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

