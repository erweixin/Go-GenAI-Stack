package dto

// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
	Title       string   `json:"title" binding:"required,min=1,max=200"`
	Description string   `json:"description" binding:"max=5000"`
	Priority    string   `json:"priority" binding:"omitempty,oneof=low medium high"`
	DueDate     string   `json:"due_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	Tags        []string `json:"tags" binding:"omitempty,max=10,dive,max=50"`
}

// CreateTaskResponse 创建任务响应
type CreateTaskResponse struct {
	TaskID    string `json:"task_id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

// UpdateTaskRequest 更新任务请求
type UpdateTaskRequest struct {
	Title       string   `json:"title" binding:"omitempty,min=1,max=200"`
	Description string   `json:"description" binding:"max=5000"`
	Priority    string   `json:"priority" binding:"omitempty,oneof=low medium high"`
	DueDate     string   `json:"due_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	Tags        []string `json:"tags" binding:"omitempty,max=10,dive,max=50"`
}

// UpdateTaskResponse 更新任务响应
type UpdateTaskResponse struct {
	TaskID    string `json:"task_id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	UpdatedAt string `json:"updated_at"`
}

// CompleteTaskResponse 完成任务响应
type CompleteTaskResponse struct {
	TaskID      string `json:"task_id"`
	Status      string `json:"status"`
	CompletedAt string `json:"completed_at"`
}

// DeleteTaskResponse 删除任务响应
type DeleteTaskResponse struct {
	Success   bool   `json:"success"`
	DeletedAt string `json:"deleted_at"`
}

// GetTaskResponse 获取任务响应
type GetTaskResponse struct {
	TaskID      string   `json:"task_id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Status      string   `json:"status"`
	Priority    string   `json:"priority"`
	DueDate     *string  `json:"due_date"`
	Tags        []string `json:"tags"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
	CompletedAt *string  `json:"completed_at"`
}

// ListTasksRequest 列出任务请求
type ListTasksRequest struct {
	// 筛选参数
	Status      string `form:"status" binding:"omitempty,oneof=pending in_progress completed"`
	Priority    string `form:"priority" binding:"omitempty,oneof=low medium high"`
	Tag         string `form:"tag"`
	DueDateFrom string `form:"due_date_from" binding:"omitempty,datetime=2006-01-02"`
	DueDateTo   string `form:"due_date_to" binding:"omitempty,datetime=2006-01-02"`
	Keyword     string `form:"keyword" binding:"omitempty,max=100"`

	// 排序参数
	SortBy    string `form:"sort_by" binding:"omitempty,oneof=created_at due_date priority"`
	SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`

	// 分页参数
	Page  int `form:"page" binding:"omitempty,min=1"`
	Limit int `form:"limit" binding:"omitempty,min=1,max=100"`
}

// TaskItem 任务列表项
type TaskItem struct {
	TaskID    string   `json:"task_id"`
	Title     string   `json:"title"`
	Status    string   `json:"status"`
	Priority  string   `json:"priority"`
	DueDate   *string  `json:"due_date"`
	Tags      []string `json:"tags"`
	CreatedAt string   `json:"created_at"`
}

// ListTasksResponse 列出任务响应
type ListTasksResponse struct {
	Tasks      []TaskItem `json:"tasks"`
	TotalCount int        `json:"total_count"`
	Page       int        `json:"page"`
	Limit      int        `json:"limit"`
	HasMore    bool       `json:"has_more"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`             // 错误码
	Message string `json:"message"`           // 错误消息
	Details string `json:"details,omitempty"` // 详细信息（可选）
}
