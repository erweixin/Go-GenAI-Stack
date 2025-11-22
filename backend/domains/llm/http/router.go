package http

import (
	"github.com/cloudwego/hertz/pkg/route"
	"github.com/erweixin/go-genai-stack/domains/llm/handlers"
)

// RegisterRoutes 注册 LLM 领域的路由
func RegisterRoutes(r *route.RouterGroup) {
	llm := r.Group("/llm")
	{
		// 模型管理
		llm.GET("/models", handlers.ListModelsHandler)

		// 生成
		llm.POST("/generate", handlers.GenerateHandler)
		llm.POST("/structured", handlers.StructuredGenerateHandler)

		// 模型选择（路由）
		llm.POST("/select-model", handlers.SelectModelHandler)
	}
}
