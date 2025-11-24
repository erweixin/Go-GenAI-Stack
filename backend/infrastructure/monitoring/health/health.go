package health

import (
	"context"
	"database/sql"
	"time"

	"github.com/erweixin/go-genai-stack/infrastructure/config"
	"github.com/redis/go-redis/v9"
)

// Status 健康状态
type Status string

const (
	StatusUp   Status = "up"   // 健康
	StatusDown Status = "down" // 不健康
)

// HealthCheck 健康检查结果
type HealthCheck struct {
	Status    Status               `json:"status"`    // 总体状态
	Timestamp time.Time            `json:"timestamp"` // 检查时间
	Uptime    time.Duration        `json:"uptime"`    // 运行时长
	Version   string               `json:"version"`   // 版本号
	Checks    map[string]CheckItem `json:"checks"`    // 各组件状态
}

// CheckItem 单个检查项
type CheckItem struct {
	Status  Status        `json:"status"`            // 状态
	Message string        `json:"message,omitempty"` // 消息
	Latency time.Duration `json:"latency,omitempty"` // 延迟
}

// Checker 健康检查器
type Checker struct {
	startTime time.Time
	version   string
	db        *sql.DB
	redis     *redis.Client
	enabled   bool
}

// NewChecker 创建健康检查器
//
// Example:
//
//	checker := health.NewChecker(cfg, db, redisClient)
//	result := checker.Check(ctx)
func NewChecker(cfg config.MonitoringConfig, db *sql.DB, redisClient *redis.Client) *Checker {
	return &Checker{
		startTime: time.Now(),
		version:   "1.0.0",
		db:        db,
		redis:     redisClient,
		enabled:   cfg.HealthEnabled,
	}
}

// Check 执行健康检查
//
// 检查项：
//   - 数据库连接
//   - Redis 连接
//   - 系统运行时间
func (c *Checker) Check(ctx context.Context) HealthCheck {
	if !c.enabled {
		return HealthCheck{
			Status:    StatusUp,
			Timestamp: time.Now(),
			Uptime:    time.Since(c.startTime),
			Version:   c.version,
			Checks:    make(map[string]CheckItem),
		}
	}

	checks := make(map[string]CheckItem)
	overallStatus := StatusUp

	// 1. 检查数据库
	if c.db != nil {
		dbCheck := c.checkDatabase(ctx)
		checks["database"] = dbCheck
		if dbCheck.Status == StatusDown {
			overallStatus = StatusDown
		}
	}

	// 2. 检查 Redis
	if c.redis != nil {
		redisCheck := c.checkRedis(ctx)
		checks["redis"] = redisCheck
		if redisCheck.Status == StatusDown {
			overallStatus = StatusDown
		}
	}

	return HealthCheck{
		Status:    overallStatus,
		Timestamp: time.Now(),
		Uptime:    time.Since(c.startTime),
		Version:   c.version,
		Checks:    checks,
	}
}

// checkDatabase 检查数据库连接
func (c *Checker) checkDatabase(ctx context.Context) CheckItem {
	start := time.Now()

	// Ping 数据库
	err := c.db.PingContext(ctx)
	latency := time.Since(start)

	if err != nil {
		return CheckItem{
			Status:  StatusDown,
			Message: err.Error(),
			Latency: latency,
		}
	}

	return CheckItem{
		Status:  StatusUp,
		Message: "ok",
		Latency: latency,
	}
}

// checkRedis 检查 Redis 连接
func (c *Checker) checkRedis(ctx context.Context) CheckItem {
	start := time.Now()

	// Ping Redis
	err := c.redis.Ping(ctx).Err()
	latency := time.Since(start)

	if err != nil {
		return CheckItem{
			Status:  StatusDown,
			Message: err.Error(),
			Latency: latency,
		}
	}

	return CheckItem{
		Status:  StatusUp,
		Message: "ok",
		Latency: latency,
	}
}

// IsHealthy 检查是否健康
func (c *Checker) IsHealthy(ctx context.Context) bool {
	result := c.Check(ctx)
	return result.Status == StatusUp
}

// --- 全局 Checker 实例 ---

var globalChecker *Checker

// InitGlobalChecker 初始化全局健康检查器
func InitGlobalChecker(cfg config.MonitoringConfig, db *sql.DB, redisClient *redis.Client) {
	globalChecker = NewChecker(cfg, db, redisClient)
}

// GetGlobalChecker 获取全局健康检查器
func GetGlobalChecker() *Checker {
	return globalChecker
}

// Check 全局健康检查
func Check(ctx context.Context) HealthCheck {
	if globalChecker != nil {
		return globalChecker.Check(ctx)
	}

	// 默认返回 up
	return HealthCheck{
		Status:    StatusUp,
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Checks:    make(map[string]CheckItem),
	}
}
