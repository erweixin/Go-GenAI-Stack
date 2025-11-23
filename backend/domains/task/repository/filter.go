package repository

import (
	"github.com/erweixin/go-genai-stack/domains/task/model"
)

// TaskFilter 任务筛选条件
type TaskFilter struct {
	// 筛选条件
	Status      *model.TaskStatus
	Priority    *model.Priority
	Tag         *string
	DueDateFrom *string
	DueDateTo   *string
	Keyword     *string

	// 排序
	SortBy    string // created_at, due_date, priority
	SortOrder string // asc, desc

	// 分页
	Page  int
	Limit int
}

// NewTaskFilter 创建默认筛选条件
func NewTaskFilter() *TaskFilter {
	return &TaskFilter{
		SortBy:    "created_at",
		SortOrder: "desc",
		Page:      1,
		Limit:     20,
	}
}
