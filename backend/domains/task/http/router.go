package http

import (
	"github.com/cloudwego/hertz/pkg/route"
	"github.com/erweixin/go-genai-stack/domains/task/handlers"
)

// RegisterRoutes 注册任务领域的路由
//
// 将 HTTP 路由映射到 handler 方法。
// 遵循 RESTful 风格。
//
// 路由列表：
//   - POST   /api/tasks          - 创建任务
//   - GET    /api/tasks          - 列出任务
//   - GET    /api/tasks/:id      - 获取任务详情
//   - PUT    /api/tasks/:id      - 更新任务
//   - DELETE /api/tasks/:id      - 删除任务
//   - POST   /api/tasks/:id/complete - 完成任务
func RegisterRoutes(r *route.RouterGroup, handlerService *handlers.HandlerService) {
	tasks := r.Group("/tasks")
	{
		// 创建任务
		tasks.POST("", handlerService.CreateTaskHandler)

		// 列出任务
		tasks.GET("", handlerService.ListTasksHandler)

		// 获取任务详情
		tasks.GET("/:id", handlerService.GetTaskHandler)

		// 更新任务
		tasks.PUT("/:id", handlerService.UpdateTaskHandler)

		// 删除任务
		tasks.DELETE("/:id", handlerService.DeleteTaskHandler)

		// 完成任务
		tasks.POST("/:id/complete", handlerService.CompleteTaskHandler)
	}
}

