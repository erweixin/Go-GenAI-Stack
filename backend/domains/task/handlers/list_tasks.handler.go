package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/model"
	"github.com/erweixin/go-genai-stack/domains/task/repository"
	"github.com/erweixin/go-genai-stack/domains/task/service"
)

// ListTasksHandler 列出任务（HTTP 适配层）
//
// 用例：ListTasks（参考 usecases.yaml）
//
// HTTP:
//   - Method: GET
//   - Path: /api/tasks
//
// Handler 职责：
//  1. 解析 HTTP 查询参数 → Domain Input
//  2. 调用 Domain Service
//  3. 转换 Domain Output → HTTP 响应
//
// 业务逻辑在 service.TaskService.ListTasks() 中实现
func (deps *HandlerDependencies) ListTasksHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 解析查询参数
	var req dto.ListTasksRequest
	if err := c.BindQuery(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_QUERY",
			Message: "查询参数无效",
			Details: err.Error(),
		})
		return
	}

	// 2. 设置默认值
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}
	if req.SortBy == "" {
		req.SortBy = "created_at"
	}
	if req.SortOrder == "" {
		req.SortOrder = "desc"
	}

	// 3. 构建 Domain Input（Filter）
	filter := repository.NewTaskFilter()
	filter.Page = req.Page
	filter.Limit = req.Limit
	filter.SortBy = req.SortBy
	filter.SortOrder = req.SortOrder

	if req.Status != "" {
		status := model.TaskStatus(req.Status)
		filter.Status = &status
	}
	if req.Priority != "" {
		priority := model.Priority(req.Priority)
		filter.Priority = &priority
	}
	if req.Tag != "" {
		filter.Tag = &req.Tag
	}
	if req.DueDateFrom != "" {
		filter.DueDateFrom = &req.DueDateFrom
	}
	if req.DueDateTo != "" {
		filter.DueDateTo = &req.DueDateTo
	}
	if req.Keyword != "" {
		filter.Keyword = &req.Keyword
	}

	// 4. 调用 Domain Service
	output, err := deps.taskService.ListTasks(ctx, service.ListTasksInput{
		Filter: *filter, // 解引用指针
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 5. 转换为 HTTP 响应
	taskItems := make([]dto.TaskItem, 0, len(output.Tasks))
	for _, task := range output.Tasks {
		item := dto.TaskItem{
			TaskID:    task.ID,
			Title:     task.Title,
			Status:    string(task.Status),
			Priority:  string(task.Priority),
			CreatedAt: task.CreatedAt.Format(time.RFC3339),
		}

		// 处理可选字段
		if task.DueDate != nil {
			dueDate := task.DueDate.Format(time.RFC3339)
			item.DueDate = &dueDate
		}

		// 转换标签
		tags := make([]string, len(task.Tags))
		for i, tag := range task.Tags {
			tags[i] = tag.Name
		}
		item.Tags = tags

		taskItems = append(taskItems, item)
	}

	// 6. 返回响应
	c.JSON(200, dto.ListTasksResponse{
		Tasks:      taskItems,
		TotalCount: output.TotalCount,
		Page:       output.Page,
		Limit:      output.Limit,
		HasMore:    output.HasMore,
	})
}
