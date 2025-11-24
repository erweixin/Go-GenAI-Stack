package repository

import (
	"context"

	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
)

// TaskRepository 定义任务仓储接口
//
// 遵循领域驱动设计原则，提供对 Task 聚合根的持久化操作
type TaskRepository interface {
	// Create 保存一个新的任务
	Create(ctx context.Context, task *model.Task) error

	// FindByID 根据 ID 查找任务
	FindByID(ctx context.Context, taskID string) (*model.Task, error)

	// Update 更新一个现有任务
	Update(ctx context.Context, task *model.Task) error

	// Delete 根据 ID 删除任务
	Delete(ctx context.Context, taskID string) error

	// List 根据筛选条件列出任务
	// 返回任务列表、总数和错误
	List(ctx context.Context, filter *TaskFilter) ([]*model.Task, int, error)

	// Exists 检查任务是否存在
	Exists(ctx context.Context, taskID string) (bool, error)
}
