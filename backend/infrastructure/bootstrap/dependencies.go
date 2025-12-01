package bootstrap

import (
	"database/sql"

	authhandlers "github.com/erweixin/go-genai-stack/backend/domains/auth/handlers"
	authservice "github.com/erweixin/go-genai-stack/backend/domains/auth/service"
	producthandlers "github.com/erweixin/go-genai-stack/backend/domains/product/handlers"
	productrepo "github.com/erweixin/go-genai-stack/backend/domains/product/repository"
	productservice "github.com/erweixin/go-genai-stack/backend/domains/product/service"
	taskhandlers "github.com/erweixin/go-genai-stack/backend/domains/task/handlers"
	taskrepo "github.com/erweixin/go-genai-stack/backend/domains/task/repository"
	taskservice "github.com/erweixin/go-genai-stack/backend/domains/task/service"
	userhandlers "github.com/erweixin/go-genai-stack/backend/domains/user/handlers"
	userrepo "github.com/erweixin/go-genai-stack/backend/domains/user/repository"
	userservice "github.com/erweixin/go-genai-stack/backend/domains/user/service"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/config"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/health"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/persistence"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/redis"
	redisv9 "github.com/redis/go-redis/v9"

	// 导入数据库提供者（自动注册）
	_ "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/mysql"
	_ "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"
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
	// Auth 领域
	AuthHandlerDeps *authhandlers.HandlerDependencies
	AuthMiddleware  *middleware.AuthMiddleware

	// User 领域
	UserHandlerDeps *userhandlers.HandlerDependencies

	// Task 领域
	TaskHandlerDeps *taskhandlers.HandlerDependencies

	// Product 领域
	ProductHandlerDeps *producthandlers.HandlerDependencies

	// Extension points: 添加更多领域
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
	cfg *config.Config,
	dbProvider persistence.DatabaseProvider,
	redisConn *redis.Connection,
) *AppContainer {
	// 获取底层数据库实例
	db := dbProvider.DB()

	// 初始化健康检查器
	var redisClient *redisv9.Client
	if redisConn != nil {
		// UniversalClient 可能是 *Client 或 *ClusterClient，尝试类型断言
		if client, ok := redisConn.Client().(*redisv9.Client); ok {
			redisClient = client
		}
	}
	health.InitGlobalChecker(cfg.Monitoring, db, redisClient)

	// ============================================
	// Auth 领域依赖注入
	// ============================================

	// 1. JWT Service（用于 Token 生成和验证）
	jwtService := authservice.NewJWTService(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenExpiry,
		cfg.JWT.RefreshTokenExpiry,
		cfg.JWT.Issuer,
	)

	// 2. User Repository（Auth 依赖 User Repository）
	userRepo := userrepo.NewUserRepository(db)

	// 3. Auth Service
	authService := authservice.NewAuthService(userRepo, jwtService)

	// 4. Auth Handler Dependencies
	authHandlerDeps := authhandlers.NewHandlerDependencies(authService)

	// 5. Auth Middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	// ============================================
	// User 领域依赖注入（三层架构）
	// ============================================

	// 1. User Service
	userService := userservice.NewUserService(userRepo)

	// 2. User Handler Dependencies
	userHandlerDeps := userhandlers.NewHandlerDependencies(userService)

	// ============================================
	// Task 领域依赖注入（三层架构）
	// ============================================

	// 1. Repository Layer（基础设施层）
	taskRepo := taskrepo.NewTaskRepository(db)

	// 2. Domain Service Layer（领域层）
	taskService := taskservice.NewTaskService(taskRepo)

	// 3. Handler Dependencies（Handler 层）
	taskHandlerDeps := taskhandlers.NewHandlerDependencies(taskService)

	// ============================================
	// Product 领域依赖注入（三层架构）
	// ============================================

	// 1. Repository Layer（基础设施层）
	productRepo := productrepo.NewProductRepository(db)

	// 2. Domain Service Layer（领域层）
	productService := productservice.NewProductService(productRepo)

	// 3. Handler Dependencies（Handler 层）
	productHandlerDeps := producthandlers.NewHandlerDependencies(productService)

	// ============================================
	// Extension point: 其他领域依赖注入
	// ============================================
	// 示例：添加 LLM 领域
	//
	// llmRepo := llmrepo.NewModelRepository(db)
	// llmService := llmservice.NewLLMService(llmRepo)
	// llmHandlerDeps := llmhandlers.NewHandlerDependencies(llmService)

	return &AppContainer{
		AuthHandlerDeps:    authHandlerDeps,
		AuthMiddleware:     authMiddleware,
		UserHandlerDeps:    userHandlerDeps,
		TaskHandlerDeps:    taskHandlerDeps,
		ProductHandlerDeps: productHandlerDeps,
	}
}

// InitDependenciesFromDB 从 *sql.DB 初始化依赖（用于测试）
//
// 这个变体接受 *sql.DB 而不是 DatabaseProvider，方便在测试中使用。
// 保持与 InitDependencies 相同的三层架构。
func InitDependenciesFromDB(db *sql.DB, redisConn *redis.Connection, cfg *config.Config) *AppContainer {
	// JWT Service
	jwtService := authservice.NewJWTService(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenExpiry,
		cfg.JWT.RefreshTokenExpiry,
		cfg.JWT.Issuer,
	)

	// User 领域
	userRepo := userrepo.NewUserRepository(db)
	userService := userservice.NewUserService(userRepo)
	userHandlerDeps := userhandlers.NewHandlerDependencies(userService)

	// Auth 领域
	authService := authservice.NewAuthService(userRepo, jwtService)
	authHandlerDeps := authhandlers.NewHandlerDependencies(authService)
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	// Task 领域（三层架构）
	taskRepo := taskrepo.NewTaskRepository(db)
	taskService := taskservice.NewTaskService(taskRepo)
	taskHandlerDeps := taskhandlers.NewHandlerDependencies(taskService)

	// Product 领域（三层架构）
	productRepo := productrepo.NewProductRepository(db)
	productService := productservice.NewProductService(productRepo)
	productHandlerDeps := producthandlers.NewHandlerDependencies(productService)

	return &AppContainer{
		AuthHandlerDeps:    authHandlerDeps,
		AuthMiddleware:     authMiddleware,
		UserHandlerDeps:    userHandlerDeps,
		TaskHandlerDeps:    taskHandlerDeps,
		ProductHandlerDeps: productHandlerDeps,
	}
}
