package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/joho/godotenv"

	"github.com/erweixin/go-genai-stack/infrastructure/bootstrap"
	"github.com/erweixin/go-genai-stack/infrastructure/config"
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
	container := bootstrap.InitDependencies(dbConn, redisConn)
	log.Println("✅ Domain services initialized")

	// 5. 创建 HTTP 服务器
	log.Println("🚀 Starting HTTP server...")
	h := bootstrap.CreateServer(cfg)

	// 6. 注册中间件
	bootstrap.RegisterMiddleware(h)

	// 7. 注册路由
	bootstrap.RegisterRoutes(h, container)

	// 8. 注册健康检查端点
	registerHealthCheck(h, dbConn, redisConn)

	// 9. 启动优雅关闭处理
	go handleShutdown(cancel, h)

	// 10. 启动服务器
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Printf("🚀 Server started on http://%s", addr)
	log.Printf("📚 API Base: http://%s/api", addr)
	log.Printf("💚 Health Check: http://%s/health", addr)
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

// registerHealthCheck 注册健康检查端点
//
// 健康检查端点在 main.go 中定义，因为它需要访问连接实例
func registerHealthCheck(h *server.Hertz, dbConn interface{ HealthCheck(context.Context) error }, redisConn interface{ HealthCheck(context.Context) error }) {
	h.GET("/health", func(ctx context.Context, c *app.RequestContext) {
		// 检查数据库健康
		dbHealthy := true
		if err := dbConn.HealthCheck(ctx); err != nil {
			dbHealthy = false
		}

		// 检查 Redis 健康
		redisHealthy := true
		if redisConn != nil {
			if err := redisConn.HealthCheck(ctx); err != nil {
				redisHealthy = false
			}
		}

		// 确定整体状态
		status := "healthy"
		if !dbHealthy || !redisHealthy {
			status = "degraded"
		}

		c.JSON(200, map[string]interface{}{
			"status":   status,
			"service":  "go-genai-stack",
			"database": dbHealthy,
			"redis":    redisHealthy,
			"version":  "0.1.0",
		})
	})
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
