package model

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// TaskStatus 定义任务状态
type TaskStatus string

const (
	StatusPending    TaskStatus = "pending"
	StatusInProgress TaskStatus = "in_progress"
	StatusCompleted  TaskStatus = "completed"
)

// IsValid 检查任务状态是否有效
func (s TaskStatus) IsValid() bool {
	switch s {
	case StatusPending, StatusInProgress, StatusCompleted:
		return true
	}
	return false
}

// Priority 定义任务优先级
type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

// IsValid 检查任务优先级是否有效
func (p Priority) IsValid() bool {
	switch p {
	case PriorityLow, PriorityMedium, PriorityHigh:
		return true
	}
	return false
}

// Tag 任务标签
type Tag struct {
	Name  string
	Color string
}

// Task 聚合根
// 包含任务的所有核心属性和业务行为
type Task struct {
	ID          string
	UserID      string // 所属用户 ID
	Title       string
	Description string
	Status      TaskStatus
	Priority    Priority
	DueDate     *time.Time // 可选
	Tags        []Tag
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CompletedAt *time.Time // 完成时间
}

// 领域错误定义
var (
	ErrTaskTitleEmpty       = fmt.Errorf("TASK_TITLE_EMPTY: 任务标题不能为空")
	ErrTaskAlreadyCompleted = fmt.Errorf("TASK_ALREADY_COMPLETED: 任务已完成")
	ErrInvalidDueDate       = fmt.Errorf("INVALID_DUE_DATE: 截止日期无效")
	ErrTagNameEmpty         = fmt.Errorf("TAG_NAME_EMPTY: 标签名不能为空")
	ErrTooManyTags          = fmt.Errorf("TOO_MANY_TAGS: 标签过多，最多 10 个")
	ErrDuplicateTag         = fmt.Errorf("DUPLICATE_TAG: 标签重复")
	ErrInvalidPriority      = fmt.Errorf("INVALID_PRIORITY: 优先级无效")
)

// NewTask 创建一个新的任务
func NewTask(userID, title, description string, priority Priority) (*Task, error) {
	if userID == "" {
		return nil, fmt.Errorf("USER_ID_REQUIRED: 用户 ID 不能为空")
	}
	if title == "" {
		return nil, ErrTaskTitleEmpty
	}
	if len(title) > 200 {
		return nil, fmt.Errorf("TASK_TITLE_TOO_LONG: 标题过长，最大 200 字符")
	}
	if len(description) > 5000 {
		return nil, fmt.Errorf("TASK_DESCRIPTION_TOO_LONG: 描述过长，最大 5000 字符")
	}
	if !priority.IsValid() {
		return nil, ErrInvalidPriority
	}

	now := time.Now()
	return &Task{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       title,
		Description: description,
		Status:      StatusPending,
		Priority:    priority,
		Tags:        []Tag{},
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Update 更新任务信息
func (t *Task) Update(title, description string, priority Priority) error {
	if t.Status == StatusCompleted {
		return ErrTaskAlreadyCompleted
	}
	if title == "" {
		return ErrTaskTitleEmpty
	}
	if len(title) > 200 {
		return fmt.Errorf("TASK_TITLE_TOO_LONG: 标题过长，最大 200 字符")
	}
	if len(description) > 5000 {
		return fmt.Errorf("TASK_DESCRIPTION_TOO_LONG: 描述过长，最大 5000 字符")
	}
	if !priority.IsValid() {
		return ErrInvalidPriority
	}

	t.Title = title
	t.Description = description
	t.Priority = priority
	t.UpdatedAt = time.Now()
	return nil
}

// SetDueDate 设置截止日期
func (t *Task) SetDueDate(dueDate time.Time) error {
	// 验证日期不能早于当前时间
	if dueDate.Before(time.Now()) {
		return ErrInvalidDueDate
	}
	t.DueDate = &dueDate
	t.UpdatedAt = time.Now()
	return nil
}

// Complete 标记任务为已完成
func (t *Task) Complete() error {
	if t.Status == StatusCompleted {
		return ErrTaskAlreadyCompleted // 已经完成，返回错误
	}
	t.Status = StatusCompleted
	now := time.Now()
	t.CompletedAt = &now
	t.UpdatedAt = now
	return nil
}

// AddTag 添加标签
func (t *Task) AddTag(tag Tag) error {
	if tag.Name == "" {
		return ErrTagNameEmpty
	}
	if len(t.Tags) >= 10 {
		return ErrTooManyTags
	}
	// 检查重复
	for _, existing := range t.Tags {
		if existing.Name == tag.Name {
			return ErrDuplicateTag
		}
	}
	t.Tags = append(t.Tags, tag)
	t.UpdatedAt = time.Now()
	return nil
}

// RemoveTag 移除标签
func (t *Task) RemoveTag(tagName string) {
	newTags := []Tag{}
	for _, tag := range t.Tags {
		if tag.Name != tagName {
			newTags = append(newTags, tag)
		}
	}
	t.Tags = newTags
	t.UpdatedAt = time.Now()
}
