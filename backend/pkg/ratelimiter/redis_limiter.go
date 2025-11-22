package ratelimiter

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisRateLimiter 基于 Redis 的限流器
//
// 使用 Redis 实现分布式限流，支持多种算法
// 适合分布式系统和生产环境
type RedisRateLimiter struct {
	client *redis.Client
	config *Config
}

// NewRedisRateLimiter 创建 Redis 限流器
//
// Example:
//
//	limiter := ratelimiter.NewRedisRateLimiter(redisClient, &ratelimiter.Config{
//	    Rate:      100,
//	    Burst:     200,
//	    TTL:       time.Minute,
//	    Algorithm: "token_bucket",
//	})
func NewRedisRateLimiter(client *redis.Client, config *Config) *RedisRateLimiter {
	if config == nil {
		config = DefaultConfig()
	}

	return &RedisRateLimiter{
		client: client,
		config: config,
	}
}

// Allow 判断是否允许请求通过
func (r *RedisRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	return r.AllowN(ctx, key, 1)
}

// AllowN 判断是否允许 n 个请求通过
func (r *RedisRateLimiter) AllowN(ctx context.Context, key string, n int) (bool, error) {
	if key == "" {
		return false, ErrInvalidKey
	}

	switch Algorithm(r.config.Algorithm) {
	case TokenBucket, "":
		return r.allowTokenBucket(ctx, key, n)
	case SlidingWindow:
		return r.allowSlidingWindow(ctx, key, n)
	case FixedWindow:
		return r.allowFixedWindow(ctx, key, n)
	default:
		return r.allowTokenBucket(ctx, key, n)
	}
}

// allowTokenBucket 令牌桶算法实现
func (r *RedisRateLimiter) allowTokenBucket(ctx context.Context, key string, n int) (bool, error) {
	redisKey := fmt.Sprintf("ratelimit:token_bucket:%s", key)

	// Lua 脚本实现令牌桶算法
	script := redis.NewScript(`
		local key = KEYS[1]
		local rate = tonumber(ARGV[1])
		local burst = tonumber(ARGV[2])
		local now = tonumber(ARGV[3])
		local requested = tonumber(ARGV[4])
		local ttl = tonumber(ARGV[5])

		-- 获取当前令牌数和最后更新时间
		local tokens = redis.call('HGET', key, 'tokens')
		local last_time = redis.call('HGET', key, 'last_time')

		if tokens == false then
			tokens = burst
			last_time = now
		else
			tokens = tonumber(tokens)
			last_time = tonumber(last_time)
		end

		-- 计算新增令牌数
		local elapsed = now - last_time
		local new_tokens = tokens + elapsed * rate

		-- 限制在突发容量内
		if new_tokens > burst then
			new_tokens = burst
		end

		-- 检查是否有足够的令牌
		if new_tokens >= requested then
			new_tokens = new_tokens - requested
			redis.call('HSET', key, 'tokens', new_tokens)
			redis.call('HSET', key, 'last_time', now)
			redis.call('EXPIRE', key, ttl)
			return 1
		else
			redis.call('HSET', key, 'tokens', new_tokens)
			redis.call('HSET', key, 'last_time', now)
			redis.call('EXPIRE', key, ttl)
			return 0
		end
	`)

	now := float64(time.Now().Unix())
	result, err := script.Run(ctx, r.client, []string{redisKey}, r.config.Rate, r.config.Burst, now, n, int(r.config.TTL.Seconds())).Result()
	if err != nil {
		return false, fmt.Errorf("redis rate limiter error: %w", err)
	}

	return result.(int64) == 1, nil
}

// allowSlidingWindow 滑动窗口算法实现
func (r *RedisRateLimiter) allowSlidingWindow(ctx context.Context, key string, n int) (bool, error) {
	redisKey := fmt.Sprintf("ratelimit:sliding_window:%s", key)
	now := time.Now()
	windowStart := now.Add(-time.Second)

	pipe := r.client.Pipeline()

	// 删除窗口外的记录
	pipe.ZRemRangeByScore(ctx, redisKey, "0", fmt.Sprintf("%d", windowStart.UnixNano()))

	// 统计当前窗口内的请求数
	pipe.ZCard(ctx, redisKey)

	// 添加当前请求
	for i := 0; i < n; i++ {
		pipe.ZAdd(ctx, redisKey, redis.Z{
			Score:  float64(now.UnixNano()),
			Member: fmt.Sprintf("%d-%d", now.UnixNano(), i),
		})
	}

	// 设置过期时间
	pipe.Expire(ctx, redisKey, r.config.TTL)

	results, err := pipe.Exec(ctx)
	if err != nil {
		return false, fmt.Errorf("redis rate limiter error: %w", err)
	}

	count := results[1].(*redis.IntCmd).Val()
	return count+int64(n) <= int64(r.config.Rate), nil
}

// allowFixedWindow 固定窗口算法实现
func (r *RedisRateLimiter) allowFixedWindow(ctx context.Context, key string, n int) (bool, error) {
	now := time.Now()
	window := now.Truncate(time.Second).Unix()
	redisKey := fmt.Sprintf("ratelimit:fixed_window:%s:%d", key, window)

	// 增加计数
	count, err := r.client.IncrBy(ctx, redisKey, int64(n)).Result()
	if err != nil {
		return false, fmt.Errorf("redis rate limiter error: %w", err)
	}

	// 设置过期时间（首次设置）
	if count == int64(n) {
		r.client.Expire(ctx, redisKey, r.config.TTL)
	}

	return count <= int64(r.config.Rate), nil
}

// Wait 等待直到可以通过（阻塞式）
func (r *RedisRateLimiter) Wait(ctx context.Context, key string) error {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			allowed, err := r.Allow(ctx, key)
			if err != nil {
				return err
			}
			if allowed {
				return nil
			}
		}
	}
}

// Reset 重置限流器状态
func (r *RedisRateLimiter) Reset(ctx context.Context, key string) error {
	pattern := fmt.Sprintf("ratelimit:*:%s*", key)
	iter := r.client.Scan(ctx, 0, pattern, 0).Iterator()

	for iter.Next(ctx) {
		if err := r.client.Del(ctx, iter.Val()).Err(); err != nil {
			return fmt.Errorf("failed to reset rate limiter: %w", err)
		}
	}

	return iter.Err()
}

