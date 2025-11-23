package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
)

// CompleteTaskHandler 完成任务（HTTP 适配层）
//
// 用例：CompleteTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: POST
//   - Path: /api/tasks/:id/complete
//
// Handler 职责：
//  1. 解析 HTTP 请求
//  2. 调用 Domain Service
//  3. 转换 Domain Output → HTTP 响应
//
// 业务逻辑在 service.TaskService.CompleteTask() 中实现
func (deps *HandlerDependencies) CompleteTaskHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 获取路径参数
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

	// 2. 调用 Domain Service
	task, err := deps.taskService.CompleteTask(ctx, taskID)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 转换为 HTTP 响应
	c.JSON(200, dto.CompleteTaskResponse{
		TaskID:      task.ID,
		Status:      string(task.Status),
		CompletedAt: task.CompletedAt.Format(time.RFC3339),
	})
}
