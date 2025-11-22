package ratelimiter

import (
	"context"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// MemoryRateLimiter 基于内存的限流器
//
// 使用 golang.org/x/time/rate 包实现令牌桶算法
// 适合单机场景或开发环境
type MemoryRateLimiter struct {
	config   *Config
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	cleaner  *time.Ticker
}

// NewMemoryRateLimiter 创建内存限流器
//
// Example:
//
//	limiter := ratelimiter.NewMemoryRateLimiter(&ratelimiter.Config{
//	    Rate:  100,  // 每秒 100 个请求
//	    Burst: 200,  // 突发容量 200
//	})
func NewMemoryRateLimiter(config *Config) *MemoryRateLimiter {
	if config == nil {
		config = DefaultConfig()
	}

	limiter := &MemoryRateLimiter{
		config:   config,
		limiters: make(map[string]*rate.Limiter),
		cleaner:  time.NewTicker(time.Minute),
	}

	// 启动清理器（定期清理过期的限流器）
	go limiter.cleanExpired()

	return limiter
}

// getLimiter 获取或创建限流器
func (m *MemoryRateLimiter) getLimiter(key string) *rate.Limiter {
	m.mu.RLock()
	limiter, exists := m.limiters[key]
	m.mu.RUnlock()

	if exists {
		return limiter
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// 双重检查
	if limiter, exists := m.limiters[key]; exists {
		return limiter
	}

	// 创建新的限流器
	limiter = rate.NewLimiter(rate.Limit(m.config.Rate), m.config.Burst)
	m.limiters[key] = limiter

	return limiter
}

// Allow 判断是否允许请求通过
func (m *MemoryRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	if key == "" {
		return false, ErrInvalidKey
	}

	limiter := m.getLimiter(key)
	return limiter.Allow(), nil
}

// AllowN 判断是否允许 n 个请求通过
func (m *MemoryRateLimiter) AllowN(ctx context.Context, key string, n int) (bool, error) {
	if key == "" {
		return false, ErrInvalidKey
	}

	limiter := m.getLimiter(key)
	return limiter.AllowN(time.Now(), n), nil
}

// Wait 等待直到可以通过（阻塞式）
func (m *MemoryRateLimiter) Wait(ctx context.Context, key string) error {
	if key == "" {
		return ErrInvalidKey
	}

	limiter := m.getLimiter(key)
	return limiter.Wait(ctx)
}

// Reset 重置限流器状态
func (m *MemoryRateLimiter) Reset(ctx context.Context, key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.limiters, key)
	return nil
}

// cleanExpired 清理过期的限流器
func (m *MemoryRateLimiter) cleanExpired() {
	for range m.cleaner.C {
		m.mu.Lock()
		// 简单实现：清空所有限流器
		// 实际应用中可以记录最后访问时间，只清理长时间未使用的
		if len(m.limiters) > 10000 { // 超过 1 万个键才清理
			m.limiters = make(map[string]*rate.Limiter)
		}
		m.mu.Unlock()
	}
}

// Stop 停止限流器
func (m *MemoryRateLimiter) Stop() {
	m.cleaner.Stop()
}

