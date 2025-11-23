package events

import (
	"time"

	"github.com/google/uuid"
)

// BaseEvent 基础事件结构
//
// 所有领域事件应该嵌入这个结构
type BaseEvent struct {
	id        string
	eventType string
	source    string
	timestamp time.Time
	payload   interface{}
}

// NewBaseEvent 创建基础事件
func NewBaseEvent(eventType, source string, payload interface{}) BaseEvent {
	return BaseEvent{
		id:        uuid.New().String(),
		eventType: eventType,
		source:    source,
		timestamp: time.Now(),
		payload:   payload,
	}
}

// ID 返回事件 ID
func (e BaseEvent) ID() string {
	return e.id
}

// Type 返回事件类型
func (e BaseEvent) Type() string {
	return e.eventType
}

// Source 返回事件来源
func (e BaseEvent) Source() string {
	return e.source
}

// Timestamp 返回事件时间戳
func (e BaseEvent) Timestamp() time.Time {
	return e.timestamp
}

// Payload 返回事件负载
func (e BaseEvent) Payload() interface{} {
	return e.payload
}

// =============================================================================
// Chat 领域事件
// =============================================================================

// MessageSentPayload 消息发送事件负载
type MessageSentPayload struct {
	MessageID      string
	ConversationID string
	UserID         string
	Content        string
	Role           string
	Tokens         int
	Model          string
}

// MessageSentEvent 消息发送事件
type MessageSentEvent struct {
	BaseEvent
}

// NewMessageSentEvent 创建消息发送事件
func NewMessageSentEvent(payload MessageSentPayload) *MessageSentEvent {
	return &MessageSentEvent{
		BaseEvent: NewBaseEvent("MessageSent", "chat", payload),
	}
}

// MessageReceivedPayload 消息接收事件负载
type MessageReceivedPayload struct {
	MessageID      string
	ConversationID string
	Content        string
	Role           string
	Tokens         int
	Model          string
	Latency        int64 // 毫秒
}

// MessageReceivedEvent 消息接收事件
type MessageReceivedEvent struct {
	BaseEvent
}

// NewMessageReceivedEvent 创建消息接收事件
func NewMessageReceivedEvent(payload MessageReceivedPayload) *MessageReceivedEvent {
	return &MessageReceivedEvent{
		BaseEvent: NewBaseEvent("MessageReceived", "chat", payload),
	}
}

// ConversationCreatedPayload 对话创建事件负载
type ConversationCreatedPayload struct {
	ConversationID string
	UserID         string
	Title          string
}

// ConversationCreatedEvent 对话创建事件
type ConversationCreatedEvent struct {
	BaseEvent
}

// NewConversationCreatedEvent 创建对话创建事件
func NewConversationCreatedEvent(payload ConversationCreatedPayload) *ConversationCreatedEvent {
	return &ConversationCreatedEvent{
		BaseEvent: NewBaseEvent("ConversationCreated", "chat", payload),
	}
}

// ConversationDeletedPayload 对话删除事件负载
type ConversationDeletedPayload struct {
	ConversationID string
	UserID         string
	MessageCount   int
}

// ConversationDeletedEvent 对话删除事件
type ConversationDeletedEvent struct {
	BaseEvent
}

// NewConversationDeletedEvent 创建对话删除事件
func NewConversationDeletedEvent(payload ConversationDeletedPayload) *ConversationDeletedEvent {
	return &ConversationDeletedEvent{
		BaseEvent: NewBaseEvent("ConversationDeleted", "chat", payload),
	}
}

// =============================================================================
// LLM 领域事件
// =============================================================================

// ModelSelectedPayload 模型选择事件负载
type ModelSelectedPayload struct {
	Model    string
	Provider string
	Strategy string // latency, cost, quality
	Reason   string
}

// ModelSelectedEvent 模型选择事件
type ModelSelectedEvent struct {
	BaseEvent
}

// NewModelSelectedEvent 创建模型选择事件
func NewModelSelectedEvent(payload ModelSelectedPayload) *ModelSelectedEvent {
	return &ModelSelectedEvent{
		BaseEvent: NewBaseEvent("ModelSelected", "llm", payload),
	}
}

// GenerationCompletedPayload 生成完成事件负载
type GenerationCompletedPayload struct {
	RequestID    string
	Model        string
	Provider     string
	InputTokens  int
	OutputTokens int
	Latency      int64 // 毫秒
	Success      bool
	Error        string
}

// GenerationCompletedEvent 生成完成事件
type GenerationCompletedEvent struct {
	BaseEvent
}

// NewGenerationCompletedEvent 创建生成完成事件
func NewGenerationCompletedEvent(payload GenerationCompletedPayload) *GenerationCompletedEvent {
	return &GenerationCompletedEvent{
		BaseEvent: NewBaseEvent("GenerationCompleted", "llm", payload),
	}
}

// SchemaValidationFailedPayload Schema 验证失败事件负载
type SchemaValidationFailedPayload struct {
	RequestID string
	Model     string
	Schema    string
	Output    string
	Error     string
}

// SchemaValidationFailedEvent Schema 验证失败事件
type SchemaValidationFailedEvent struct {
	BaseEvent
}

// NewSchemaValidationFailedEvent 创建 Schema 验证失败事件
func NewSchemaValidationFailedEvent(payload SchemaValidationFailedPayload) *SchemaValidationFailedEvent {
	return &SchemaValidationFailedEvent{
		BaseEvent: NewBaseEvent("SchemaValidationFailed", "llm", payload),
	}
}

// =============================================================================
// Monitoring 领域事件
// =============================================================================

// MetricCollectedPayload 指标收集事件负载
type MetricCollectedPayload struct {
	Name   string
	Value  float64
	Labels map[string]string
}

// MetricCollectedEvent 指标收集事件
type MetricCollectedEvent struct {
	BaseEvent
}

// NewMetricCollectedEvent 创建指标收集事件
func NewMetricCollectedEvent(payload MetricCollectedPayload) *MetricCollectedEvent {
	return &MetricCollectedEvent{
		BaseEvent: NewBaseEvent("MetricCollected", "monitoring", payload),
	}
}

// AlertTriggeredPayload 告警触发事件负载
type AlertTriggeredPayload struct {
	AlertName string
	Severity  string // critical, warning, info
	Message   string
	Labels    map[string]string
}

// AlertTriggeredEvent 告警触发事件
type AlertTriggeredEvent struct {
	BaseEvent
}

// NewAlertTriggeredEvent 创建告警触发事件
func NewAlertTriggeredEvent(payload AlertTriggeredPayload) *AlertTriggeredEvent {
	return &AlertTriggeredEvent{
		BaseEvent: NewBaseEvent("AlertTriggered", "monitoring", payload),
	}
}
