package events

import (
	"time"

	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
	"github.com/google/uuid"
)

// ========================================
// Task 领域事件定义
//
// 对应 events.md 中定义的所有事件
// ========================================

// BaseEvent 事件基类
type BaseEvent struct {
	EventID   string    `json:"event_id"`   // 事件 ID (UUID)
	EventType string    `json:"event_type"` // 事件类型
	Source    string    `json:"source"`     // 来源领域
	Timestamp time.Time `json:"timestamp"`  // 事件时间
}

// Type 返回事件类型
func (e *BaseEvent) Type() string {
	return e.EventType
}

// ID 返回事件 ID
func (e *BaseEvent) ID() string {
	return e.EventID
}

// SourceDomain 返回来源领域
func (e *BaseEvent) SourceDomain() string {
	return e.Source
}

// OccurredAt 返回事件时间
func (e *BaseEvent) OccurredAt() time.Time {
	return e.Timestamp
}

// ========================================
// TaskCreatedEvent 任务创建事件
// ========================================

// TaskCreatedEvent 任务创建事件
//
// 对应 events.md 中的 TaskCreated
//
// 触发时机：任务成功创建后
// 消费者：Analytics, Notification
type TaskCreatedEvent struct {
	BaseEvent
	TaskID    string    `json:"task_id"`    // 任务 ID
	UserID    string    `json:"user_id"`    // 创建者 ID
	Title     string    `json:"title"`      // 任务标题
	Priority  string    `json:"priority"`   // 优先级
	DueDate   *string   `json:"due_date"`   // 截止日期 (ISO 8601)
	Tags      []string  `json:"tags"`       // 标签列表
	CreatedAt time.Time `json:"created_at"` // 创建时间
}

// Payload 返回事件负载
func (e *TaskCreatedEvent) Payload() interface{} {
	return e
}

// NewTaskCreatedEvent 创建任务创建事件
func NewTaskCreatedEvent(task *model.Task) *TaskCreatedEvent {
	var dueDate *string
	if task.DueDate != nil {
		d := task.DueDate.Format(time.RFC3339)
		dueDate = &d
	}

	tags := make([]string, len(task.Tags))
	for i, tag := range task.Tags {
		tags[i] = tag.Name
	}

	return &TaskCreatedEvent{
		BaseEvent: BaseEvent{
			EventID:   uuid.New().String(),
			EventType: "task.created",
			Source:    "task",
			Timestamp: time.Now(),
		},
		TaskID:    task.ID,
		UserID:    task.UserID,
		Title:     task.Title,
		Priority:  string(task.Priority),
		DueDate:   dueDate,
		Tags:      tags,
		CreatedAt: task.CreatedAt,
	}
}

// ========================================
// TaskUpdatedEvent 任务更新事件
// ========================================

// TaskUpdatedEvent 任务更新事件
//
// 对应 events.md 中的 TaskUpdated
//
// 触发时机：任务字段更新后
// 消费者：Analytics
type TaskUpdatedEvent struct {
	BaseEvent
	TaskID        string                 `json:"task_id"`        // 任务 ID
	UserID        string                 `json:"user_id"`        // 更新者 ID
	UpdatedFields map[string]interface{} `json:"updated_fields"` // 变更的字段
	UpdatedAt     time.Time              `json:"updated_at"`     // 更新时间
}

// Payload 返回事件负载
func (e *TaskUpdatedEvent) Payload() interface{} {
	return e
}

// NewTaskUpdatedEvent 创建任务更新事件
func NewTaskUpdatedEvent(task *model.Task, updatedFields map[string]interface{}) *TaskUpdatedEvent {
	return &TaskUpdatedEvent{
		BaseEvent: BaseEvent{
			EventID:   uuid.New().String(),
			EventType: "task.updated",
			Source:    "task",
			Timestamp: time.Now(),
		},
		TaskID:        task.ID,
		UserID:        task.UserID,
		UpdatedFields: updatedFields,
		UpdatedAt:     task.UpdatedAt,
	}
}

// ========================================
// TaskCompletedEvent 任务完成事件
// ========================================

// TaskCompletedEvent 任务完成事件
//
// 对应 events.md 中的 TaskCompleted
//
// 触发时机：任务状态变更为 Completed 后
// 消费者：Analytics, Achievement
type TaskCompletedEvent struct {
	BaseEvent
	TaskID      string    `json:"task_id"`      // 任务 ID
	UserID      string    `json:"user_id"`      // 用户 ID
	Title       string    `json:"title"`        // 任务标题
	Priority    string    `json:"priority"`     // 优先级
	CompletedAt time.Time `json:"completed_at"` // 完成时间
	Duration    int64     `json:"duration"`     // 任务耗时（秒）
	IsOnTime    bool      `json:"is_on_time"`   // 是否按时完成
}

// Payload 返回事件负载
func (e *TaskCompletedEvent) Payload() interface{} {
	return e
}

// NewTaskCompletedEvent 创建任务完成事件
func NewTaskCompletedEvent(task *model.Task) *TaskCompletedEvent {
	duration := int64(0)
	if task.CompletedAt != nil {
		duration = int64(task.CompletedAt.Sub(task.CreatedAt).Seconds())
	}

	isOnTime := true
	if task.DueDate != nil && task.CompletedAt != nil {
		isOnTime = task.CompletedAt.Before(*task.DueDate) || task.CompletedAt.Equal(*task.DueDate)
	}

	return &TaskCompletedEvent{
		BaseEvent: BaseEvent{
			EventID:   uuid.New().String(),
			EventType: "task.completed",
			Source:    "task",
			Timestamp: time.Now(),
		},
		TaskID:      task.ID,
		UserID:      task.UserID,
		Title:       task.Title,
		Priority:    string(task.Priority),
		CompletedAt: *task.CompletedAt,
		Duration:    duration,
		IsOnTime:    isOnTime,
	}
}

// ========================================
// TaskDeletedEvent 任务删除事件
// ========================================

// TaskDeletedEvent 任务删除事件
//
// 对应 events.md 中的 TaskDeleted
//
// 触发时机：任务删除后
// 消费者：Analytics, Cleanup
type TaskDeletedEvent struct {
	BaseEvent
	TaskID    string    `json:"task_id"`    // 任务 ID
	UserID    string    `json:"user_id"`    // 删除者 ID
	Title     string    `json:"title"`      // 任务标题
	Status    string    `json:"status"`     // 删除时的状态
	DeletedAt time.Time `json:"deleted_at"` // 删除时间
	Reason    string    `json:"reason"`     // 删除原因 (可选)
}

// Payload 返回事件负载
func (e *TaskDeletedEvent) Payload() interface{} {
	return e
}

// NewTaskDeletedEvent 创建任务删除事件
func NewTaskDeletedEvent(task *model.Task, deletedAt time.Time) *TaskDeletedEvent {
	return &TaskDeletedEvent{
		BaseEvent: BaseEvent{
			EventID:   uuid.New().String(),
			EventType: "task.deleted",
			Source:    "task",
			Timestamp: time.Now(),
		},
		TaskID:    task.ID,
		UserID:    task.UserID,
		Title:     task.Title,
		Status:    string(task.Status),
		DeletedAt: deletedAt,
		Reason:    "", // 可以扩展为支持删除原因
	}
}
