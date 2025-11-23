package bootstrap

import (
	"database/sql"

	taskhandlers "github.com/erweixin/go-genai-stack/domains/task/handlers"
	taskrepo "github.com/erweixin/go-genai-stack/domains/task/repository"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence/redis"

	// 导入数据库提供者（自动注册）
	_ "github.com/erweixin/go-genai-stack/infrastructure/persistence/mysql"
	_ "github.com/erweixin/go-genai-stack/infrastructure/persistence/postgres"
)

// AppContainer 应用依赖容器
//
// 包含所有领域服务的实例，提供给 HTTP 层使用
type AppContainer struct {
	// Task 领域
	TaskHandlerService *taskhandlers.HandlerService

	// Extension points: 添加更多领域服务
	// UserHandlerService *userhandlers.HandlerService
	// LLMHandlerService *llmhandlers.HandlerService
	// MonitoringService *monitoring.Service
}

// InitDependencies 初始化应用依赖
//
// 负责依赖注入的组装工作：
// 1. 创建 repositories（基础设施层）
// 2. 创建 domain services（领域层）
// 3. 创建 handler services（应用层）
//
// 遵循依赖注入原则，从外层向内层注入
func InitDependencies(
	dbProvider persistence.DatabaseProvider,
	redisConn *redis.Connection,
) *AppContainer {
	// 获取底层数据库实例
	db := dbProvider.DB()

	// ============================================
	// Task 领域依赖注入
	// ============================================
	
	// 1. 初始化 Task repository（数据访问层）
	taskRepo := taskrepo.NewTaskRepository(db)

	// 2. 初始化 Task handler service（应用层）
	taskHandlerService := taskhandlers.NewHandlerService(taskRepo)

	// ============================================
	// Extension point: 其他领域依赖注入
	// ============================================
	// userRepo := userrepo.NewUserRepository(db)
	// userHandlerService := userhandlers.NewHandlerService(userRepo)
	//
	// llmRepo := llmrepo.NewModelRepository(db)
	// llmHandlerService := llmhandlers.NewHandlerService(llmRepo)

	return &AppContainer{
		TaskHandlerService: taskHandlerService,
	}
}

// InitDependenciesFromDB 从 *sql.DB 初始化依赖（用于测试）
//
// 这个变体接受 *sql.DB 而不是 Connection，方便在测试中使用
func InitDependenciesFromDB(db *sql.DB, redisConn *redis.Connection) *AppContainer {
	// Task 领域
	taskRepo := taskrepo.NewTaskRepository(db)
	taskHandlerService := taskhandlers.NewHandlerService(taskRepo)

	return &AppContainer{
		TaskHandlerService: taskHandlerService,
	}
}

