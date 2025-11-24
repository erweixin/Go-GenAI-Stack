package http

import (
	"github.com/cloudwego/hertz/pkg/route"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/handlers"
)

// RegisterRoutes 注册 Auth 领域的路由
//
// 参数：
//   - r: 路由分组
//   - deps: Handler 依赖容器
//
// 路由列表：
//   - POST   /auth/register   - 用户注册（无需认证）
//   - POST   /auth/login      - 用户登录（无需认证）
//   - POST   /auth/refresh    - 刷新 Token（无需认证）
func RegisterRoutes(
	r *route.RouterGroup,
	deps *handlers.HandlerDependencies,
) {
	// Auth API 分组（无需认证）
	authGroup := r.Group("/auth")
	{
		// 用户注册
		authGroup.POST("/register", deps.RegisterHandler)

		// 用户登录
		authGroup.POST("/login", deps.LoginHandler)

		// 刷新 Token
		authGroup.POST("/refresh", deps.RefreshTokenHandler)
	}
}

