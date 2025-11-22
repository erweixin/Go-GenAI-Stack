package bootstrap

import (
	"github.com/cloudwego/hertz/pkg/app/server"
	chathttp "github.com/erweixin/go-genai-stack/domains/chat/http"
)

// RegisterRoutes 注册所有路由
//
// 负责将各个领域的路由注册到服务器上
func RegisterRoutes(h *server.Hertz, container *AppContainer) {
	api := h.Group("/api")
	{
		// 注册 Chat 领域路由
		chathttp.RegisterRoutes(api, container.ChatHandlerService)

		// Extension point: 注册其他领域路由
		// llmhttp.RegisterRoutes(api, container.LLMHandlerService)
		// monitoringhttp.RegisterRoutes(api, container.MonitoringService)
	}
}

