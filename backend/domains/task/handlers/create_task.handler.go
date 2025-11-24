package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
	"github.com/erweixin/go-genai-stack/backend/domains/task/service"
)

// CreateTaskHandler 创建任务（HTTP 适配层）
//
// 用例：CreateTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: POST
//   - Path: /api/tasks
//
// Handler 职责：
//  1. 解析 HTTP 请求 → Domain Input
//  2. 调用 Domain Service
//  3. 转换 Domain Output → HTTP 响应
//  4. 处理错误转换
//
// 业务逻辑在 service.TaskService.CreateTask() 中实现
func (deps *HandlerDependencies) CreateTaskHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 获取用户 ID（从 JWT 中间件注入）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, dto.ErrorResponse{
			Error:   "UNAUTHORIZED",
			Message: "未授权访问",
		})
		return
	}
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(500, dto.ErrorResponse{
			Error:   "INTERNAL_ERROR",
			Message: "用户 ID 类型错误",
		})
		return
	}

	// 2. 解析 HTTP 请求
	var req dto.CreateTaskRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "请求参数无效",
			Details: err.Error(),
		})
		return
	}

	// 3. 转换为 Domain Input
	input := service.CreateTaskInput{
		UserID:      userIDStr,
		Title:       req.Title,
		Description: req.Description,
		Priority:    model.Priority(req.Priority),
		Tags:        req.Tags,
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
	output, err := deps.taskService.CreateTask(ctx, input)
	if err != nil {
		// 错误处理：转换领域错误为 HTTP 响应
		handleDomainError(c, err)
		return
	}

	// 5. 转换为 HTTP 响应
	task := output.Task
	c.JSON(200, dto.CreateTaskResponse{
		TaskID:    task.ID,
		Title:     task.Title,
		Status:    string(task.Status),
		CreatedAt: task.CreatedAt.Format(time.RFC3339),
	})
}
