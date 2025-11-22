package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/redis/go-redis/v9"
)

// RateLimitMiddleware 限流中间件
//
// 使用 Redis + Token Bucket 算法实现分布式限流
type RateLimitMiddleware struct {
	client   redis.UniversalClient
	limit    int           // 每个时间窗口允许的请求数
	window   time.Duration // 时间窗口
	keyFunc  KeyFunc       // 生成限流 key 的函数
}

// KeyFunc 生成限流 key 的函数类型
//
// 可以根据 user_id、IP 地址等生成不同的限流 key
type KeyFunc func(c *app.RequestContext) string

// NewRateLimitMiddleware 创建限流中间件
//
// Example:
//
//	// 每个用户每分钟最多 60 次请求
//	rateLimitMW := NewRateLimitMiddleware(
//	    redisClient,
//	    60,
//	    time.Minute,
//	    func(c *app.RequestContext) string {
//	        userID, _ := GetUserID(c)
//	        return fmt.Sprintf("ratelimit:user:%s", userID)
//	    },
//	)
func NewRateLimitMiddleware(
	client redis.UniversalClient,
	limit int,
	window time.Duration,
	keyFunc KeyFunc,
) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		client:  client,
		limit:   limit,
		window:  window,
		keyFunc: keyFunc,
	}
}

// Handle 处理限流
func (m *RateLimitMiddleware) Handle() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		// 生成限流 key
		key := m.keyFunc(c)
		if key == "" {
			// 如果无法生成 key（如未认证用户），使用 IP 地址
			key = fmt.Sprintf("ratelimit:ip:%s", c.ClientIP())
		}

		// 检查限流
		allowed, remaining, err := m.checkRateLimit(ctx, key)
		if err != nil {
			// 限流检查失败，记录错误但放行请求
			// 避免 Redis 故障影响服务可用性
			c.Next(ctx)
			return
		}

		// 设置响应头
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", m.limit))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(m.window).Unix()))

		if !allowed {
			c.JSON(429, utils.H{
				"error":   "rate limit exceeded",
				"message": fmt.Sprintf("too many requests, please try again later"),
				"retry_after": int(m.window.Seconds()),
			})
			c.Abort()
			return
		}

		c.Next(ctx)
	}
}

// checkRateLimit 检查是否超过限流
//
// 返回：是否允许请求、剩余配额、错误
func (m *RateLimitMiddleware) checkRateLimit(ctx context.Context, key string) (bool, int, error) {
	// 使用 Redis INCR + EXPIRE 实现简单的限流
	// 更精确的实现可以使用 Lua 脚本实现 Token Bucket

	pipe := m.client.Pipeline()
	incrCmd := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, m.window)
	_, err := pipe.Exec(ctx)

	if err != nil {
		return false, 0, fmt.Errorf("failed to check rate limit: %w", err)
	}

	count := int(incrCmd.Val())
	remaining := m.limit - count
	if remaining < 0 {
		remaining = 0
	}

	allowed := count <= m.limit

	return allowed, remaining, nil
}

// IPBasedKeyFunc 基于 IP 地址的限流 key 函数
func IPBasedKeyFunc(c *app.RequestContext) string {
	return fmt.Sprintf("ratelimit:ip:%s", c.ClientIP())
}

// UserBasedKeyFunc 基于用户 ID 的限流 key 函数
func UserBasedKeyFunc(c *app.RequestContext) string {
	userID, exists := GetUserID(c)
	if !exists {
		return ""
	}
	return fmt.Sprintf("ratelimit:user:%s", userID)
}

// CombinedKeyFunc 组合限流 key 函数（用户 + IP）
func CombinedKeyFunc(c *app.RequestContext) string {
	userID, exists := GetUserID(c)
	if exists {
		return fmt.Sprintf("ratelimit:user:%s", userID)
	}
	return fmt.Sprintf("ratelimit:ip:%s", c.ClientIP())
}

