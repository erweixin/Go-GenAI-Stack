package bootstrap

import (
	"github.com/cloudwego/hertz/pkg/app/server"
	taskhttp "github.com/erweixin/go-genai-stack/domains/task/http"
)

// RegisterRoutes 注册所有路由
//
// 负责将各个领域的路由注册到服务器上。
// 每个领域的 HTTP 路由接收对应的 HandlerDependencies。
func RegisterRoutes(h *server.Hertz, container *AppContainer) {
	api := h.Group("/api")
	{
		// 注册 Task 领域路由
		taskhttp.RegisterRoutes(api, container.TaskHandlerDeps)

		// Extension point: 注册其他领域路由
		// userhttp.RegisterRoutes(api, container.UserHandlerDeps)
		// llmhttp.RegisterRoutes(api, container.LLMHandlerDeps)
		// monitoringhttp.RegisterRoutes(api, container.MonitoringDeps)
	}
}
