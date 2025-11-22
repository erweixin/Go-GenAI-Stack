package bootstrap

import (
	"database/sql"

	chathandlers "github.com/erweixin/go-genai-stack/domains/chat/handlers"
	chatrepo "github.com/erweixin/go-genai-stack/domains/chat/repository"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence/postgres"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence/redis"
)

// AppContainer 应用依赖容器
//
// 包含所有领域服务的实例，提供给 HTTP 层使用
type AppContainer struct {
	// Chat 领域
	ChatHandlerService *chathandlers.HandlerService

	// Extension points: 添加更多领域服务
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
	dbConn *postgres.Connection,
	redisConn *redis.Connection,
) *AppContainer {
	// 获取底层数据库实例
	db := dbConn.DB()

	// ============================================
	// Chat 领域依赖注入
	// ============================================
	
	// 1. 初始化 Chat repositories（数据访问层）
	messageRepo := chatrepo.NewMessageRepository(db)
	conversationRepo := chatrepo.NewConversationRepository(db)

	// 2. 初始化 Chat handler service（应用层）
	chatHandlerService := chathandlers.NewHandlerService(messageRepo, conversationRepo)

	// ============================================
	// Extension point: 其他领域依赖注入
	// ============================================
	// llmRepo := llmrepo.NewModelRepository(db)
	// llmHandlerService := llmhandlers.NewHandlerService(llmRepo)

	return &AppContainer{
		ChatHandlerService: chatHandlerService,
	}
}

// InitDependenciesFromDB 从 *sql.DB 初始化依赖（用于测试）
//
// 这个变体接受 *sql.DB 而不是 Connection，方便在测试中使用
func InitDependenciesFromDB(db *sql.DB, redisConn *redis.Connection) *AppContainer {
	// Chat 领域
	messageRepo := chatrepo.NewMessageRepository(db)
	conversationRepo := chatrepo.NewConversationRepository(db)
	chatHandlerService := chathandlers.NewHandlerService(messageRepo, conversationRepo)

	return &AppContainer{
		ChatHandlerService: chatHandlerService,
	}
}

