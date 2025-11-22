package tasks

import (
	"context"
	"encoding/json"
	"fmt"
)

// TaskType 任务类型常量
const (
	// 监控相关任务
	TaskTypeMetricsAggregation = "metrics:aggregation" // 指标聚合
	TaskTypeLogArchiving       = "logs:archiving"      // 日志归档
	TaskTypeAlertCheck         = "alert:check"         // 告警检查

	// 数据处理任务
	TaskTypeDataCleanup  = "data:cleanup"  // 数据清理
	TaskTypeDataExport   = "data:export"   // 数据导出
	TaskTypeDataBackup   = "data:backup"   // 数据备份

	// 通知任务
	TaskTypeSendEmail = "notification:email" // 发送邮件
	TaskTypeSendSMS   = "notification:sms"   // 发送短信
	TaskTypeSendPush  = "notification:push"  // 推送通知
)

// TaskRegistry 任务注册表
//
// 管理所有异步任务的注册和处理
type TaskRegistry struct {
	handlers map[string]TaskHandler
}

// TaskHandler 任务处理器函数类型
type TaskHandler func(ctx context.Context, payload []byte) error

// NewTaskRegistry 创建新的任务注册表
func NewTaskRegistry() *TaskRegistry {
	return &TaskRegistry{
		handlers: make(map[string]TaskHandler),
	}
}

// Register 注册任务处理器
//
// Example:
//
//	registry := NewTaskRegistry()
//	registry.Register(TaskTypeSendEmail, handleSendEmail)
func (r *TaskRegistry) Register(taskType string, handler TaskHandler) {
	r.handlers[taskType] = handler
}

// GetHandler 获取任务处理器
func (r *TaskRegistry) GetHandler(taskType string) (TaskHandler, bool) {
	handler, exists := r.handlers[taskType]
	return handler, exists
}

// RegisterAll 将所有任务注册到队列
func (r *TaskRegistry) RegisterAll(queue interface {
	RegisterHandler(taskType string, handler func(context.Context, []byte) error)
}) {
	for taskType, handler := range r.handlers {
		queue.RegisterHandler(taskType, handler)
	}
}

// =============================================================================
// 任务 Payload 定义
// =============================================================================

// MetricsAggregationPayload 指标聚合任务负载
type MetricsAggregationPayload struct {
	StartTime int64  `json:"start_time"` // Unix 时间戳
	EndTime   int64  `json:"end_time"`
	Interval  string `json:"interval"` // "1m", "5m", "1h"
}

// LogArchivingPayload 日志归档任务负载
type LogArchivingPayload struct {
	StartDate string `json:"start_date"` // "2025-11-22"
	EndDate   string `json:"end_date"`
}

// DataCleanupPayload 数据清理任务负载
type DataCleanupPayload struct {
	TableName   string `json:"table_name"`
	RetentionDays int    `json:"retention_days"`
}

// SendEmailPayload 发送邮件任务负载
type SendEmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
	HTML    bool   `json:"html"`
}

// =============================================================================
// 任务处理器示例
// =============================================================================

// HandleMetricsAggregation 处理指标聚合任务
//
// Extension point: 实现指标聚合逻辑
// 示例：聚合 Prometheus 指标、生成报表等
func HandleMetricsAggregation(ctx context.Context, payload []byte) error {
	var p MetricsAggregationPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// 示例实现：打印日志
	fmt.Printf("Aggregating metrics from %d to %d with interval %s\n",
		p.StartTime, p.EndTime, p.Interval)

	return nil
}

// HandleLogArchiving 处理日志归档任务
//
// Extension point: 实现日志归档逻辑
// 示例：归档到 S3、压缩旧日志等
func HandleLogArchiving(ctx context.Context, payload []byte) error {
	var p LogArchivingPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// 示例实现：打印日志
	fmt.Printf("Archiving logs from %s to %s\n", p.StartDate, p.EndDate)

	return nil
}

// HandleDataCleanup 处理数据清理任务
//
// Extension point: 实现数据清理逻辑
// 示例：删除过期数据、清理临时文件等
func HandleDataCleanup(ctx context.Context, payload []byte) error {
	var p DataCleanupPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// 示例实现：打印日志
	fmt.Printf("Cleaning up table %s with retention %d days\n",
		p.TableName, p.RetentionDays)

	return nil
}

// HandleSendEmail 处理发送邮件任务
func HandleSendEmail(ctx context.Context, payload []byte) error {
	var p SendEmailPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	// Extension point: 集成邮件服务（SendGrid, AWS SES等）
	fmt.Printf("Sending email to %s: %s\n", p.To, p.Subject)

	return nil
}

// RegisterDefaultTasks 注册默认任务
func RegisterDefaultTasks(registry *TaskRegistry) {
	registry.Register(TaskTypeMetricsAggregation, HandleMetricsAggregation)
	registry.Register(TaskTypeLogArchiving, HandleLogArchiving)
	registry.Register(TaskTypeDataCleanup, HandleDataCleanup)
	registry.Register(TaskTypeSendEmail, HandleSendEmail)
}

