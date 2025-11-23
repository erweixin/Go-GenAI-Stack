package bootstrap

import (
	"context"

	"github.com/erweixin/go-genai-stack/infrastructure/config"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence/redis"
)

// InitRedis 初始化 Redis 连接
//
// 负责将配置转换为 Redis 连接实例
func InitRedis(ctx context.Context, cfg *config.Config) (*redis.Connection, error) {
	redisConfig := &redis.Config{
		Host:         cfg.Redis.Host,
		Port:         cfg.Redis.Port,
		Password:     cfg.Redis.Password,
		DB:           cfg.Redis.DB,
		PoolSize:     cfg.Redis.PoolSize,
		MinIdleConns: cfg.Redis.MinIdleConns,
		MaxRetries:   cfg.Redis.MaxRetries,
		DialTimeout:  cfg.Redis.DialTimeout,
		ReadTimeout:  cfg.Redis.ReadTimeout,
		WriteTimeout: cfg.Redis.WriteTimeout,
	}

	return redis.NewConnection(ctx, redisConfig)
}
