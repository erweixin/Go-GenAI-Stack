package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/model"
	"github.com/erweixin/go-genai-stack/domains/task/service"
)

// UpdateTaskHandler 更新任务（HTTP 适配层）
//
// 用例：UpdateTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: PUT
//   - Path: /api/tasks/:id
//
// Handler 职责：
//  1. 解析 HTTP 请求 → Domain Input
//  2. 调用 Domain Service
//  3. 转换 Domain Output → HTTP 响应
//
// 业务逻辑在 service.TaskService.UpdateTask() 中实现
func (deps *HandlerDependencies) UpdateTaskHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 获取路径参数
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

	// 2. 解析请求体
	var req dto.UpdateTaskRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "请求参数无效",
			Details: err.Error(),
		})
		return
	}

	// 3. 转换为 Domain Input
	input := service.UpdateTaskInput{
		TaskID:      taskID,
		Title:       stringPtr(req.Title),
		Description: stringPtr(req.Description),
		Tags:        req.Tags,
	}

	// 转换优先级
	if req.Priority != "" {
		priority := model.Priority(req.Priority)
		input.Priority = &priority
	}

	// 解析截止日期
	if req.DueDate != "" {
		dueDate, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			c.JSON(400, dto.ErrorResponse{
				Error:   "INVALID_DUE_DATE",
				Message: "截止日期格式无效",
				Details: err.Error(),
			})
			return
		}
		input.DueDate = &dueDate
	}

	// 4. 调用 Domain Service
	output, err := deps.taskService.UpdateTask(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 5. 转换为 HTTP 响应
	task := output.Task
	c.JSON(200, dto.UpdateTaskResponse{
		TaskID:    task.ID,
		Title:     task.Title,
		Status:    string(task.Status),
		UpdatedAt: task.UpdatedAt.Format(time.RFC3339),
	})
}

// stringPtr 辅助函数：将字符串转为指针
func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
