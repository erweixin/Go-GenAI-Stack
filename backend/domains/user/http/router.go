package http

import (
	"github.com/cloudwego/hertz/pkg/route"
	"github.com/erweixin/go-genai-stack/backend/domains/user/handlers"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// RegisterRoutes 注册 User 领域的路由
//
// 参数：
//   - r: 路由分组
//   - deps: Handler 依赖容器
//   - authMiddleware: 认证中间件
//
// 路由列表：
//   - GET    /users/me                   - 获取当前用户资料（需要认证）
//   - PUT    /users/me                   - 更新当前用户资料（需要认证）
//   - POST   /users/me/change-password   - 修改密码（需要认证）
func RegisterRoutes(
	r *route.RouterGroup,
	deps *handlers.HandlerDependencies,
	authMiddleware *middleware.AuthMiddleware,
) {
	// User API 分组（需要认证）
	userGroup := r.Group("/users")
	userGroup.Use(authMiddleware.Handle())
	{
		// 获取当前用户资料
		userGroup.GET("/me", deps.GetUserProfileHandler)

		// 更新当前用户资料
		userGroup.PUT("/me", deps.UpdateUserProfileHandler)

		// 修改密码
		userGroup.POST("/me/change-password", deps.ChangePasswordHandler)
	}
}
