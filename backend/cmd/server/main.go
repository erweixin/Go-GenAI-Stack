package main

import (
	"context"
	"log"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/erweixin/go-genai-stack/shared/middleware"
)

func main() {
	// 创建 Hertz 服务器
	h := server.Default(
		server.WithHostPorts(":8080"),
	)

	// 注册全局中间件
	h.Use(middleware.CORS())
	h.Use(middleware.Logger())
	h.Use(middleware.Recovery())

	// 健康检查
	h.GET("/health", func(ctx context.Context, c *server.RequestContext) {
		c.JSON(200, map[string]string{
			"status":  "ok",
			"service": "go-genai-stack",
		})
	})

	// 注册领域路由
	api := h.Group("/api")
	{
		chathttp.RegisterRoutes(api)
		llmhttp.RegisterRoutes(api)
	}

	// 启动服务器
	log.Println("🚀 Server starting on :8080")
	log.Println("📚 API Docs: http://localhost:8080/api")
	log.Println("💚 Health Check: http://localhost:8080/health")

	h.Spin()
}
