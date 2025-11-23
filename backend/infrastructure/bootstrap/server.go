package bootstrap

import (
	"fmt"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/erweixin/go-genai-stack/infrastructure/config"
	"github.com/erweixin/go-genai-stack/infrastructure/middleware"
)

// CreateServer 创建并配置 Hertz 服务器
//
// 根据配置创建服务器实例，设置超时、body 大小等参数
func CreateServer(cfg *config.Config) *server.Hertz {
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	return server.Default(
		server.WithHostPorts(addr),
		server.WithReadTimeout(cfg.Server.ReadTimeout),
		server.WithWriteTimeout(cfg.Server.WriteTimeout),
		server.WithIdleTimeout(cfg.Server.IdleTimeout),
		server.WithMaxRequestBodySize(int(cfg.Server.MaxBodySize)),
	)
}

// RegisterMiddleware 注册全局中间件
//
// 按照特定顺序注册中间件，确保正确的请求处理流程
func RegisterMiddleware(h *server.Hertz) {
	h.Use(middleware.CORS())
	h.Use(middleware.Logger())
	h.Use(middleware.Recovery())
	h.Use(middleware.ErrorHandler())

	// Extension point: 添加更多中间件
	// h.Use(middleware.Auth())
	// h.Use(middleware.RateLimit())
	// h.Use(middleware.Tracing())
}
