package bootstrap

import (
	"database/sql"

	taskhandlers "github.com/erweixin/go-genai-stack/domains/task/handlers"
	taskrepo "github.com/erweixin/go-genai-stack/domains/task/repository"
	taskservice "github.com/erweixin/go-genai-stack/domains/task/service"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence/redis"

	// 导入数据库提供者（自动注册）
	_ "github.com/erweixin/go-genai-stack/infrastructure/persistence/mysql"
	_ "github.com/erweixin/go-genai-stack/infrastructure/persistence/postgres"
)

// AppContainer 应用依赖容器
//
// 包含所有 Handler 依赖的实例，提供给 HTTP 层使用。
//
// 架构说明：
// - Repository  → 数据访问层（基础设施层）
// - Service     → 业务逻辑层（领域层）
// - Dependencies → HTTP 适配器依赖容器（Handler 层）
type AppContainer struct {
	// Task 领域
	TaskHandlerDeps *taskhandlers.HandlerDependencies

	// Extension points: 添加更多领域
	// UserHandlerDeps *userhandlers.HandlerDependencies
	// LLMHandlerDeps  *llmhandlers.HandlerDependencies
	// MonitoringDeps  *monitoring.HandlerDependencies
}

// InitDependencies 初始化应用依赖（DDD 三层架构）
//
// 依赖注入顺序（从内到外）：
// 1. Repository Layer（基础设施层）：数据访问
// 2. Domain Service Layer（领域层）：业务逻辑
// 3. Handler Dependencies（Handler 层）：HTTP 适配
//
// 遵循依赖注入原则：外层依赖内层，内层不依赖外层
func InitDependencies(
	dbProvider persistence.DatabaseProvider,
	redisConn *redis.Connection,
) *AppContainer {
	// 获取底层数据库实例
	db := dbProvider.DB()

	// ============================================
	// Task 领域依赖注入（三层架构）
	// ============================================

	// 1. Repository Layer（基础设施层）
	//    职责：数据访问
	taskRepo := taskrepo.NewTaskRepository(db)

	// 2. Domain Service Layer（领域层）
	//    职责：业务逻辑实现
	//    依赖：Repository
	taskService := taskservice.NewTaskService(taskRepo)

	// 3. Handler Dependencies（Handler 层）
	//    职责：HTTP 适配（请求/响应转换）
	//    依赖：Domain Service
	taskHandlerDeps := taskhandlers.NewHandlerDependencies(taskService)

	// ============================================
	// Extension point: 其他领域依赖注入
	// ============================================
	// 示例：添加 User 领域
	//
	// userRepo := userrepo.NewUserRepository(db)
	// userService := userservice.NewUserService(userRepo)
	// userHandlerDeps := userhandlers.NewHandlerDependencies(userService)
	//
	// 示例：添加 LLM 领域
	//
	// llmRepo := llmrepo.NewModelRepository(db)
	// llmService := llmservice.NewLLMService(llmRepo)
	// llmHandlerDeps := llmhandlers.NewHandlerDependencies(llmService)

	return &AppContainer{
		TaskHandlerDeps: taskHandlerDeps,
	}
}

// InitDependenciesFromDB 从 *sql.DB 初始化依赖（用于测试）
//
// 这个变体接受 *sql.DB 而不是 DatabaseProvider，方便在测试中使用。
// 保持与 InitDependencies 相同的三层架构。
func InitDependenciesFromDB(db *sql.DB, redisConn *redis.Connection) *AppContainer {
	// Task 领域（三层架构）
	taskRepo := taskrepo.NewTaskRepository(db)
	taskService := taskservice.NewTaskService(taskRepo)
	taskHandlerDeps := taskhandlers.NewHandlerDependencies(taskService)

	return &AppContainer{
		TaskHandlerDeps: taskHandlerDeps,
	}
}
