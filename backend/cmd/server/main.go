package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/joho/godotenv"

	"github.com/erweixin/go-genai-stack/backend/infrastructure/bootstrap"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/config"
)

func main() {
	// 创建应用上下文
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. 加载 .env 文件
	fmt.Println("\n📝 步骤 1: 加载 .env 文件")
	if err := godotenv.Load("../docker/.env"); err != nil {
		fmt.Printf("⚠️  无法加载 docker/.env: %v\n", err)
		fmt.Println("   尝试使用现有环境变量...")
	} else {
		fmt.Println("✅ 成功加载 docker/.env")
	}

	// 1. 加载配置
	log.Println("📋 Loading configuration...")
	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	// 显示关键配置（验证环境变量是否生效）
	log.Printf("✅ Configuration loaded:")
	log.Printf("   Environment: %s", getEnv())
	log.Printf("   Server: %s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("   Database: %s@%s:%d/%s", cfg.Database.User, cfg.Database.Host, cfg.Database.Port, cfg.Database.Database)
	log.Printf("   Redis: %s:%d (DB: %d)", cfg.Redis.Host, cfg.Redis.Port, cfg.Redis.DB)

	// 1.5. 初始化可观测性组件（Logger, Metrics, Tracing）
	log.Println("📊 Initializing observability...")
	if err := bootstrap.InitObservability(ctx, cfg); err != nil {
		log.Fatalf("❌ Failed to initialize observability: %v", err)
	}
	defer bootstrap.ShutdownObservability(ctx)
	log.Println("✅ Observability initialized")

	// 2. 初始化数据库连接
	log.Println("🗄️  Connecting to database...")
	dbConn, err := bootstrap.InitDatabase(ctx, cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer dbConn.Close()
	log.Println("✅ Database connected")

	// 3. 初始化 Redis 连接
	log.Println("🔴 Connecting to Redis...")
	redisConn, err := bootstrap.InitRedis(ctx, cfg)
	if err != nil {
		log.Printf("⚠️  Redis connection failed: %v (continuing without cache)", err)
		redisConn = nil
	} else {
		defer redisConn.Close()
		log.Println("✅ Redis connected")
	}

	// 4. 初始化应用依赖（依赖注入容器）
	log.Println("🏗️  Initializing domain services...")
	container := bootstrap.InitDependencies(cfg, dbConn, redisConn)
	log.Println("✅ Domain services initialized")

	// 5. 创建 HTTP 服务器
	log.Println("🚀 Starting HTTP server...")
	h := bootstrap.CreateServer(cfg)

	// 6. 注册中间件
	bootstrap.RegisterMiddleware(h)

	// 7. 注册路由（包括 /metrics 和 /health）
	bootstrap.RegisterRoutes(h, container)

	// 8. 启动优雅关闭处理
	go handleShutdown(cancel, h)

	// 9. 启动服务器
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Printf("🚀 Server started on http://%s", addr)
	log.Printf("📚 API Base: http://%s/api", addr)
	log.Printf("💚 Health Check: http://%s/health", addr)
	if cfg.Monitoring.MetricsEnabled {
		log.Printf("📊 Metrics: http://%s/metrics", addr)
	}
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	h.Spin()
}

// loadConfig 加载配置
func loadConfig() (*config.Config, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}
	return cfg, nil
}

// handleShutdown 处理优雅关闭
//
// 监听 SIGINT 和 SIGTERM 信号，优雅地关闭服务器
func handleShutdown(cancel context.CancelFunc, h *server.Hertz) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// 取消上下文
	cancel()

	// 给服务器 5 秒时间完成正在处理的请求
	ctx, cancelTimeout := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelTimeout()

	if err := h.Shutdown(ctx); err != nil {
		log.Printf("❌ Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited")
}

// getEnv 获取当前环境
func getEnv() string {
	env := os.Getenv("APP_ENV")
	if env == "" {
		return "development"
	}
	return env
}
