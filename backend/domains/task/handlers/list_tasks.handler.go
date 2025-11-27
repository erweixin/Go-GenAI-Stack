package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
)

// ListTasksHandler 列出任务（HTTP 适配层）
//
// 用例：ListTasks（参考 usecases.yaml）
//
// HTTP:
//   - Method: GET
//   - Path: /api/tasks
//
// Handler 职责（瘦层）：
//  1. 解析 HTTP 查询参数
//  2. 转换 DTO（使用转换层）
//  3. 调用 Domain Service
//  4. 转换响应（使用转换层）
//
// 业务逻辑在 service.TaskService.ListTasks() 中实现
func (deps *HandlerDependencies) ListTasksHandler(ctx context.Context, c *app.RequestContext) {
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

	// 2. 解析查询参数
	var req dto.ListTasksRequest
	if err := c.BindQuery(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_QUERY",
			Message: "查询参数无效",
			Details: err.Error(),
		})
		return
	}

	// 3. 设置默认值
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

	// 4. 转换为 Domain Input（使用转换层）
	input := toListTasksInput(userIDStr, req)

	// 5. 调用 Domain Service
	output, err := deps.taskService.ListTasks(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 6. 转换为 HTTP 响应（使用转换层）
	c.JSON(200, toListTasksResponse(output))
}
