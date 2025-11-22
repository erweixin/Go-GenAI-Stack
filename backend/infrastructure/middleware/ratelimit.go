// Package middleware 提供 HTTP 中间件
//
// RateLimit 中间件使用 Redis 实现分布式限流，保护 API 免受过度调用。
// 支持基于用户、IP、或自定义 key 的限流策略。
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
// 使用 Redis + 滑动窗口计数算法实现分布式限流。
//
// # 核心特性
//
//   - 分布式限流（基于 Redis）
//   - 灵活的限流策略（用户、IP、自定义）
//   - 标准的 HTTP 响应头（X-RateLimit-*）
//   - 容错设计（Redis 故障时不阻塞请求）
//
// # 快速开始
//
// 基础用法：
//
//	// 创建 Redis 客户端
//	redisClient := redis.NewClient(&redis.Options{
//	    Addr: "localhost:6379",
//	})
//
//	// 创建限流中间件（每分钟60次请求）
//	rateLimitMW := middleware.NewRateLimitMiddleware(
//	    redisClient,
//	    60,                           // 每分钟最多60次请求
//	    time.Minute,                  // 时间窗口
//	    middleware.UserBasedKeyFunc,  // 按用户限流
//	)
//
//	// 应用到路由
//	router.Use(rateLimitMW.Handle())
//
// # 限流策略
//
// 1. 基于用户ID（推荐，需要认证中间件）：
//
//	middleware.UserBasedKeyFunc
//
// 2. 基于IP地址（适用于公开API）：
//
//	middleware.IPBasedKeyFunc
//
// 3. 组合策略（登录用户按用户限流，未登录按IP）：
//
//	middleware.CombinedKeyFunc
//
// 4. 自定义策略：
//
//	func CustomKeyFunc(c *app.RequestContext) string {
//	    // 根据业务需求生成限流key
//	    return fmt.Sprintf("ratelimit:custom:%s", someID)
//	}
//
// # 分级限流示例
//
// 为不同的用户等级设置不同的限额：
//
//	func TierBasedKeyFunc(c *app.RequestContext) string {
//	    userID, _ := middleware.GetUserID(c)
//	    tier := getUserTier(userID) // "free" or "premium"
//
//	    limit := 60  // 默认
//	    if tier == "premium" {
//	        limit = 600  // VIP用户10倍配额
//	    }
//
//	    return fmt.Sprintf("ratelimit:%s:%s", tier, userID)
//	}
//
// # 响应头
//
// 限流中间件会自动设置以下响应头：
//
//	X-RateLimit-Limit: 60        # 每个时间窗口的限额
//	X-RateLimit-Remaining: 45    # 剩余配额
//	X-RateLimit-Reset: 1700000000 # 配额重置时间（Unix时间戳）
//
// # 限流触发响应
//
// 当超过限额时返回 HTTP 429 和以下 JSON：
//
//	{
//	    "error": "rate limit exceeded",
//	    "message": "too many requests, please try again later",
//	    "retry_after": 60
//	}
//
// # 容错设计
//
// 如果 Redis 不可用，中间件会放行请求而不是阻塞服务，确保限流组件不会成为单点故障。
type RateLimitMiddleware struct {
	client  redis.UniversalClient
	limit   int           // 每个时间窗口允许的请求数
	window  time.Duration // 时间窗口
	keyFunc KeyFunc       // 生成限流 key 的函数
}

// KeyFunc 生成限流 key 的函数类型
//
// KeyFunc 决定了限流的粒度：
//   - 返回相同 key 的请求共享限流配额
//   - 返回不同 key 的请求有独立的限流配额
//
// 示例：
//   - "ratelimit:user:123" - 用户级别限流
//   - "ratelimit:ip:1.2.3.4" - IP级别限流
//   - "ratelimit:api:/api/chat" - API级别限流
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
				"error":       "rate limit exceeded",
				"message":     fmt.Sprintf("too many requests, please try again later"),
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
//
// 适用场景：
//   - 公开 API（无需认证）
//   - 防止单个 IP 过度请求
//   - 匿名用户的限流
//
// 注意：同一局域网的用户会共享配额
func IPBasedKeyFunc(c *app.RequestContext) string {
	return fmt.Sprintf("ratelimit:ip:%s", c.ClientIP())
}

// UserBasedKeyFunc 基于用户 ID 的限流 key 函数
//
// 适用场景：
//   - 需要认证的 API
//   - 个性化限流配额
//   - 更精确的限流控制
//
// 要求：必须先经过 AuthMiddleware 设置 user_id
// 如果获取不到 user_id，返回空字符串（会回退到 IP 限流）
func UserBasedKeyFunc(c *app.RequestContext) string {
	userID, exists := GetUserID(c)
	if !exists {
		return ""
	}
	return fmt.Sprintf("ratelimit:user:%s", userID)
}

// CombinedKeyFunc 组合限流 key 函数（优先用户，回退到 IP）
//
// 适用场景：
//   - 同时支持登录和未登录用户的 API
//   - 希望对登录用户更精确限流
//   - 对未登录用户按 IP 限流
//
// 逻辑：
//   - 如果有 user_id -> 按用户限流
//   - 如果无 user_id -> 按 IP 限流
func CombinedKeyFunc(c *app.RequestContext) string {
	userID, exists := GetUserID(c)
	if exists {
		return fmt.Sprintf("ratelimit:user:%s", userID)
	}
	return fmt.Sprintf("ratelimit:ip:%s", c.ClientIP())
}
