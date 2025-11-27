package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
)

// CreateTaskHandler 创建任务（HTTP 适配层）
//
// 用例：CreateTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: POST
//   - Path: /api/tasks
//
// Handler 职责（瘦层）：
//  1. 解析 HTTP 请求
//  2. 转换 DTO（使用转换层）
//  3. 调用 Domain Service
//  4. 转换响应（使用转换层）
//  5. 处理错误
//
// 业务逻辑在 service.TaskService.CreateTask() 中实现
func (deps *HandlerDependencies) CreateTaskHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 获取用户 ID
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

	// 3. 转换为 Domain Input（使用转换层）
	input, err := toCreateTaskInput(userIDStr, req)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 4. 调用 Domain Service
	output, err := deps.taskService.CreateTask(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 5. 转换为 HTTP 响应（使用转换层）
	c.JSON(200, toCreateTaskResponse(output))
}
