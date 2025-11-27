package handlers

import (
	"github.com/erweixin/go-genai-stack/backend/domains/auth/service"
)

// HandlerDependencies Auth 领域 Handler 的依赖容器
//
// 通过依赖注入模式管理 Handler 的依赖
type HandlerDependencies struct {
	authService *service.AuthService
}

// NewHandlerDependencies 创建 Handler 依赖容器
//
// 参数：
//   - authService: 认证领域服务
//
// 返回：
//   - *HandlerDependencies: 依赖容器实例
func NewHandlerDependencies(authService *service.AuthService) *HandlerDependencies {
	return &HandlerDependencies{
		authService: authService,
	}
}
