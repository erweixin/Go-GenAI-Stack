package handlers

import (
	"github.com/erweixin/go-genai-stack/backend/domains/user/service"
)

// HandlerDependencies User 领域 Handler 的依赖容器
//
// 通过依赖注入模式管理 Handler 的依赖
type HandlerDependencies struct {
	userService *service.UserService
}

// NewHandlerDependencies 创建 Handler 依赖容器
//
// 参数：
//   - userService: 用户领域服务
//
// 返回：
//   - *HandlerDependencies: 依赖容器实例
func NewHandlerDependencies(userService *service.UserService) *HandlerDependencies {
	return &HandlerDependencies{
		userService: userService,
	}
}
