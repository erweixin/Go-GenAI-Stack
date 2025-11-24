package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
)

// DeleteTaskHandler 删除任务（HTTP 适配层）
//
// 用例：DeleteTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: DELETE
//   - Path: /api/tasks/:id
//
// Handler 职责：
//  1. 解析 HTTP 请求
//  2. 调用 Domain Service
//  3. 返回 HTTP 响应
//
// 业务逻辑在 service.TaskService.DeleteTask() 中实现
func (deps *HandlerDependencies) DeleteTaskHandler(ctx context.Context, c *app.RequestContext) {
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
	err := deps.taskService.DeleteTask(ctx, taskID)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 返回成功响应
	c.JSON(200, dto.DeleteTaskResponse{
		Success:   true,
		DeletedAt: time.Now().Format(time.RFC3339),
	})
}
