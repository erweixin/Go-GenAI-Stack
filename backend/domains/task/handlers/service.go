package handlers

import (
	"github.com/erweixin/go-genai-stack/domains/task/repository"
)

// HandlerService 处理器服务
//
// 依赖注入容器，持有所有 Handler 需要的依赖。
// 遵循依赖注入原则，所有依赖通过构造函数注入。
type HandlerService struct {
	taskRepo repository.TaskRepository
	// Extension point: 添加更多依赖
	// eventBus events.EventBus
	// cache cache.Cache
}

// NewHandlerService 创建新的处理器服务
//
// 参数：
//   - taskRepo: 任务仓储
//
// 返回：
//   - *HandlerService: 处理器服务实例
func NewHandlerService(taskRepo repository.TaskRepository) *HandlerService {
	return &HandlerService{
		taskRepo: taskRepo,
	}
}
