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
// 架构说明：
// - handlers.HandlerDependencies 包含 Domain Service
// - 每个 Handler 是一个薄适配层（HTTP → Domain → HTTP）
//
// 路由列表：
//   - POST   /api/tasks          - 创建任务
//   - GET    /api/tasks          - 列出任务
//   - GET    /api/tasks/:id      - 获取任务详情
//   - PUT    /api/tasks/:id      - 更新任务
//   - DELETE /api/tasks/:id      - 删除任务
//   - POST   /api/tasks/:id/complete - 完成任务
func RegisterRoutes(r *route.RouterGroup, deps *handlers.HandlerDependencies) {
	tasks := r.Group("/tasks")
	{
		// 创建任务
		tasks.POST("", deps.CreateTaskHandler)

		// 列出任务
		tasks.GET("", deps.ListTasksHandler)

		// 获取任务详情
		tasks.GET("/:id", deps.GetTaskHandler)

		// 更新任务
		tasks.PUT("/:id", deps.UpdateTaskHandler)

		// 删除任务
		tasks.DELETE("/:id", deps.DeleteTaskHandler)

		// 完成任务
		tasks.POST("/:id/complete", deps.CompleteTaskHandler)
	}
}
