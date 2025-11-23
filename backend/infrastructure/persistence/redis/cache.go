package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache Redis 缓存接口实现
type Cache struct {
	client redis.UniversalClient
}

// NewCache 创建新的缓存实例
//
// Example:
//
//	cache := NewCache(redisClient)
//	err := cache.Set(ctx, "user:123", user, 10*time.Minute)
func NewCache(client redis.UniversalClient) *Cache {
	return &Cache{
		client: client,
	}
}

// Set 设置缓存
//
// value 会被自动序列化为 JSON
func (c *Cache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		return fmt.Errorf("failed to set cache: %w", err)
	}

	return nil
}

// Get 获取缓存
//
// dest 必须是指针类型，用于接收反序列化后的值
//
// Example:
//
//	var user User
//	err := cache.Get(ctx, "user:123", &user)
//	if err == ErrCacheMiss {
//	    // 缓存未命中
//	}
func (c *Cache) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := c.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return ErrCacheMiss
	}
	if err != nil {
		return fmt.Errorf("failed to get cache: %w", err)
	}

	if err := json.Unmarshal(data, dest); err != nil {
		return fmt.Errorf("failed to unmarshal value: %w", err)
	}

	return nil
}

// Delete 删除缓存
func (c *Cache) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}

	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		return fmt.Errorf("failed to delete cache: %w", err)
	}

	return nil
}

// Exists 检查键是否存在
func (c *Cache) Exists(ctx context.Context, keys ...string) (int64, error) {
	count, err := c.client.Exists(ctx, keys...).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to check existence: %w", err)
	}

	return count, nil
}

// Expire 设置键的过期时间
func (c *Cache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	if err := c.client.Expire(ctx, key, ttl).Err(); err != nil {
		return fmt.Errorf("failed to set expiration: %w", err)
	}

	return nil
}

// TTL 获取键的剩余过期时间
func (c *Cache) TTL(ctx context.Context, key string) (time.Duration, error) {
	ttl, err := c.client.TTL(ctx, key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get TTL: %w", err)
	}

	return ttl, nil
}

// Increment 增加计数器
//
// Example:
//
//	count, err := cache.Increment(ctx, "api:calls:user:123", 1)
func (c *Cache) Increment(ctx context.Context, key string, value int64) (int64, error) {
	count, err := c.client.IncrBy(ctx, key, value).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to increment: %w", err)
	}

	return count, nil
}

// Decrement 减少计数器
func (c *Cache) Decrement(ctx context.Context, key string, value int64) (int64, error) {
	count, err := c.client.DecrBy(ctx, key, value).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to decrement: %w", err)
	}

	return count, nil
}

// SetNX 仅当键不存在时设置值（分布式锁）
//
// 返回 true 表示设置成功（获取锁成功）
// 返回 false 表示键已存在（获取锁失败）
//
// Example:
//
//	acquired, err := cache.SetNX(ctx, "lock:user:123", "token", 10*time.Second)
//	if acquired {
//	    defer cache.Delete(ctx, "lock:user:123")
//	    // 执行需要加锁的操作
//	}
func (c *Cache) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return false, fmt.Errorf("failed to marshal value: %w", err)
	}

	ok, err := c.client.SetNX(ctx, key, data, ttl).Result()
	if err != nil {
		return false, fmt.Errorf("failed to set NX: %w", err)
	}

	return ok, nil
}

// GetMulti 批量获取缓存
//
// 返回的 map 中，键是 key，值是反序列化后的数据
// 如果某个键不存在，则不会出现在返回的 map 中
func (c *Cache) GetMulti(ctx context.Context, keys []string) (map[string]interface{}, error) {
	if len(keys) == 0 {
		return make(map[string]interface{}), nil
	}

	results, err := c.client.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get multi: %w", err)
	}

	resultMap := make(map[string]interface{})
	for i, result := range results {
		if result == nil {
			continue
		}

		var value interface{}
		if str, ok := result.(string); ok {
			if err := json.Unmarshal([]byte(str), &value); err != nil {
				continue
			}
			resultMap[keys[i]] = value
		}
	}

	return resultMap, nil
}

// ErrCacheMiss 缓存未命中错误
var ErrCacheMiss = fmt.Errorf("cache miss")
