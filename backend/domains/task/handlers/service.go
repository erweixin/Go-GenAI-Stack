package handlers

import (
	"github.com/erweixin/go-genai-stack/backend/domains/task/service"
)

// HandlerDependencies Handler 依赖容器
//
// 这是一个依赖注入容器，持有所有 Handler 需要的依赖。
// 与 Domain Service 的区别：
// - HandlerDependencies: 只是容器，不包含业务逻辑
// - Domain Service: 包含领域业务逻辑
//
// Handler 的职责：
// - 解析 HTTP 请求
// - 调用 Domain Service
// - 构造 HTTP 响应
// - 处理错误转换
type HandlerDependencies struct {
	taskService *service.TaskService
	// Extension point: 添加更多依赖
	// eventBus events.EventBus
	// cache    cache.Cache
}

// NewHandlerDependencies 创建新的依赖容器
//
// 参数：
//   - taskService: 任务领域服务
//
// 返回：
//   - *HandlerDependencies: 依赖容器实例
func NewHandlerDependencies(taskService *service.TaskService) *HandlerDependencies {
	return &HandlerDependencies{
		taskService: taskService,
	}
}
