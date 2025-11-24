package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
)

// GetTaskHandler 获取任务详情（HTTP 适配层）
//
// 用例：GetTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: GET
//   - Path: /api/tasks/:id
//
// Handler 职责：
//  1. 解析 HTTP 请求
//  2. 调用 Domain Service
//  3. 转换 Domain Output → HTTP 响应
//
// 业务逻辑在 service.TaskService.GetTask() 中实现
func (deps *HandlerDependencies) GetTaskHandler(ctx context.Context, c *app.RequestContext) {
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

	// 2. 获取路径参数
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

	// 3. 调用 Domain Service
	task, err := deps.taskService.GetTask(ctx, userIDStr, taskID)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 转换为 HTTP 响应
	resp := dto.GetTaskResponse{
		TaskID:      task.ID,
		Title:       task.Title,
		Description: task.Description,
		Status:      string(task.Status),
		Priority:    string(task.Priority),
		CreatedAt:   task.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   task.UpdatedAt.Format(time.RFC3339),
	}

	// 处理可选字段
	if task.DueDate != nil {
		dueDate := task.DueDate.Format(time.RFC3339)
		resp.DueDate = &dueDate
	}

	if task.CompletedAt != nil {
		completedAt := task.CompletedAt.Format(time.RFC3339)
		resp.CompletedAt = &completedAt
	}

	// 转换标签
	tags := make([]string, len(task.Tags))
	for i, tag := range task.Tags {
		tags[i] = tag.Name
	}
	resp.Tags = tags

	c.JSON(200, resp)
}
