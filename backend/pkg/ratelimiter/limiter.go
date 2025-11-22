package ratelimiter

import (
	"context"
	"time"
)

// RateLimiter 限流器接口
//
// 提供统一的限流接口，支持多种限流算法
type RateLimiter interface {
	// Allow 判断是否允许请求通过
	// key: 限流的键（如用户ID、IP地址等）
	// 返回: true 允许，false 拒绝
	Allow(ctx context.Context, key string) (bool, error)

	// AllowN 判断是否允许 n 个请求通过
	AllowN(ctx context.Context, key string, n int) (bool, error)

	// Wait 等待直到可以通过（阻塞式）
	Wait(ctx context.Context, key string) error

	// Reset 重置限流器状态
	Reset(ctx context.Context, key string) error
}

// Config 限流器配置
type Config struct {
	// Rate 每秒允许的请求数
	Rate int

	// Burst 突发容量（令牌桶大小）
	Burst int

	// TTL 键的过期时间
	TTL time.Duration

	// Algorithm 限流算法：token_bucket, sliding_window, fixed_window
	Algorithm string
}

// DefaultConfig 默认配置
func DefaultConfig() *Config {
	return &Config{
		Rate:      100,            // 每秒 100 个请求
		Burst:     200,            // 突发容量 200
		TTL:       time.Minute,    // 1 分钟过期
		Algorithm: "token_bucket", // 默认令牌桶算法
	}
}

// Algorithm 限流算法类型
type Algorithm string

const (
	// TokenBucket 令牌桶算法
	// 适合处理突发流量，平滑限流
	TokenBucket Algorithm = "token_bucket"

	// SlidingWindow 滑动窗口算法
	// 更精确，防止窗口边界突发
	SlidingWindow Algorithm = "sliding_window"

	// FixedWindow 固定窗口算法
	// 简单高效，但有窗口边界问题
	FixedWindow Algorithm = "fixed_window"

	// LeakyBucket 漏桶算法
	// 强制匀速处理，适合流量整形
	LeakyBucket Algorithm = "leaky_bucket"
)

// Error 限流错误
type Error string

const (
	// ErrRateLimitExceeded 超过速率限制
	ErrRateLimitExceeded Error = "rate limit exceeded"

	// ErrInvalidKey 无效的键
	ErrInvalidKey Error = "invalid key"

	// ErrConfigInvalid 配置无效
	ErrConfigInvalid Error = "config invalid"
)

func (e Error) Error() string {
	return string(e)
}

// Result 限流结果
type Result struct {
	// Allowed 是否允许
	Allowed bool

	// Remaining 剩余配额
	Remaining int

	// RetryAfter 重试延迟（如果不允许）
	RetryAfter time.Duration

	// ResetAt 配额重置时间
	ResetAt time.Time
}

// Example 使用示例
//
//	// 内存限流器（开发环境）
//	limiter := ratelimiter.NewMemoryRateLimiter(&ratelimiter.Config{
//	    Rate:  100,
//	    Burst: 200,
//	})
//
//	// Redis 限流器（生产环境）
//	limiter := ratelimiter.NewRedisRateLimiter(redisClient, &ratelimiter.Config{
//	    Rate:  100,
//	    Burst: 200,
//	    TTL:   time.Minute,
//	})
//
//	// 使用
//	allowed, err := limiter.Allow(ctx, "user:123")
//	if !allowed {
//	    return errors.New("too many requests")
//	}
func Example() {}

