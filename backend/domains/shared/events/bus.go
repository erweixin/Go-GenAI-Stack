package events

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Event 事件接口
//
// 所有领域事件都需要实现这个接口
type Event interface {
	// Type 返回事件类型（如 "MessageSent", "ModelSelected"）
	Type() string

	// Payload 返回事件负载数据
	Payload() interface{}

	// Timestamp 返回事件发生时间
	Timestamp() time.Time

	// Source 返回事件来源领域（如 "chat", "llm"）
	Source() string

	// ID 返回事件唯一标识
	ID() string
}

// EventHandler 事件处理器函数类型
//
// 处理器应该快速返回，耗时操作应该异步执行
type EventHandler func(ctx context.Context, event Event) error

// EventBus 事件总线接口
type EventBus interface {
	// Publish 发布事件
	Publish(ctx context.Context, event Event) error

	// Subscribe 订阅事件类型
	// eventType: 事件类型（如 "MessageSent"）
	// handler: 事件处理器
	Subscribe(eventType string, handler EventHandler) error

	// Unsubscribe 取消订阅
	Unsubscribe(eventType string, handler EventHandler) error

	// Close 关闭事件总线
	Close() error
}

// InMemoryEventBus 内存事件总线实现
//
// 适用于开发环境和单体应用
// 生产环境建议使用 Kafka 等消息队列
type InMemoryEventBus struct {
	handlers map[string][]EventHandler
	mu       sync.RWMutex
	logger   Logger
}

// Logger 日志接口
type Logger interface {
	Info(msg string, fields ...interface{})
	Error(msg string, fields ...interface{})
	Warn(msg string, fields ...interface{})
}

// NewInMemoryEventBus 创建新的内存事件总线
//
// Example:
//
//	bus := NewInMemoryEventBus(logger)
//	bus.Subscribe("MessageSent", func(ctx context.Context, event Event) error {
//	    fmt.Println("Received event:", event.Type())
//	    return nil
//	})
//	bus.Publish(ctx, &MessageSentEvent{...})
func NewInMemoryEventBus(logger Logger) *InMemoryEventBus {
	return &InMemoryEventBus{
		handlers: make(map[string][]EventHandler),
		logger:   logger,
	}
}

// Publish 发布事件
//
// 同步调用所有订阅者的处理器
// 如果任何处理器返回错误，会记录日志但不中断其他处理器
func (b *InMemoryEventBus) Publish(ctx context.Context, event Event) error {
	b.mu.RLock()
	handlers, exists := b.handlers[event.Type()]
	b.mu.RUnlock()

	if !exists || len(handlers) == 0 {
		b.logger.Warn("no handlers for event", "type", event.Type())
		return nil
	}

	// 记录事件发布
	b.logger.Info("publishing event",
		"type", event.Type(),
		"id", event.ID(),
		"source", event.Source(),
		"handlers", len(handlers),
	)

	// 调用所有处理器
	var errors []error
	for i, handler := range handlers {
		if err := b.callHandler(ctx, event, handler, i); err != nil {
			errors = append(errors, err)
		}
	}

	// 如果有错误，返回第一个错误
	if len(errors) > 0 {
		return errors[0]
	}

	return nil
}

// callHandler 调用单个处理器
func (b *InMemoryEventBus) callHandler(ctx context.Context, event Event, handler EventHandler, index int) error {
	defer func() {
		if r := recover(); r != nil {
			b.logger.Error("handler panicked",
				"type", event.Type(),
				"handler_index", index,
				"panic", r,
			)
		}
	}()

	if err := handler(ctx, event); err != nil {
		b.logger.Error("handler failed",
			"type", event.Type(),
			"handler_index", index,
			"error", err,
		)
		return err
	}

	return nil
}

// Subscribe 订阅事件
//
// Example:
//
//	bus.Subscribe("MessageSent", func(ctx context.Context, event Event) error {
//	    // 处理事件
//	    return nil
//	})
func (b *InMemoryEventBus) Subscribe(eventType string, handler EventHandler) error {
	if eventType == "" {
		return fmt.Errorf("event type cannot be empty")
	}

	if handler == nil {
		return fmt.Errorf("handler cannot be nil")
	}

	b.mu.Lock()
	defer b.mu.Unlock()

	b.handlers[eventType] = append(b.handlers[eventType], handler)

	b.logger.Info("subscribed to event",
		"type", eventType,
		"total_handlers", len(b.handlers[eventType]),
	)

	return nil
}

// Unsubscribe 取消订阅
//
// 注意：由于 Go 的函数比较限制，这个方法难以实现
// 建议使用命名的处理器或者使用订阅 token
func (b *InMemoryEventBus) Unsubscribe(eventType string, handler EventHandler) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	// 注意：这个实现是简化版，实际中需要更复杂的处理器管理
	// 建议使用订阅 ID 的方式
	delete(b.handlers, eventType)

	b.logger.Info("unsubscribed from event", "type", eventType)

	return nil
}

// Close 关闭事件总线
func (b *InMemoryEventBus) Close() error {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.handlers = make(map[string][]EventHandler)
	b.logger.Info("event bus closed")

	return nil
}

// defaultLogger 默认日志实现
type defaultLogger struct{}

func (l *defaultLogger) Info(msg string, fields ...interface{})  {}
func (l *defaultLogger) Error(msg string, fields ...interface{}) {}
func (l *defaultLogger) Warn(msg string, fields ...interface{})  {}

// NewDefaultEventBus 创建使用默认日志的事件总线
func NewDefaultEventBus() *InMemoryEventBus {
	return NewInMemoryEventBus(&defaultLogger{})
}
