package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Config Redis 连接配置
type Config struct {
	// 单机模式配置
	Host     string
	Port     int
	Password string
	DB       int

	// 连接池配置
	PoolSize     int
	MinIdleConns int
	MaxRetries   int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	// 集群模式配置（可选）
	ClusterAddrs []string
}

// Connection Redis 连接管理器
type Connection struct {
	client redis.UniversalClient
	config *Config
}

// NewConnection 创建新的 Redis 连接
//
// Example:
//
//	config := &Config{
//	    Host:         "localhost",
//	    Port:         6379,
//	    Password:     "",
//	    DB:           0,
//	    PoolSize:     10,
//	    MinIdleConns: 5,
//	    MaxRetries:   3,
//	    DialTimeout:  5 * time.Second,
//	    ReadTimeout:  3 * time.Second,
//	    WriteTimeout: 3 * time.Second,
//	}
//	conn, err := NewConnection(context.Background(), config)
func NewConnection(ctx context.Context, config *Config) (*Connection, error) {
	var client redis.UniversalClient

	// 判断是单机模式还是集群模式
	if len(config.ClusterAddrs) > 0 {
		// 集群模式
		client = redis.NewClusterClient(&redis.ClusterOptions{
			Addrs:        config.ClusterAddrs,
			Password:     config.Password,
			PoolSize:     config.PoolSize,
			MinIdleConns: config.MinIdleConns,
			MaxRetries:   config.MaxRetries,
			DialTimeout:  config.DialTimeout,
			ReadTimeout:  config.ReadTimeout,
			WriteTimeout: config.WriteTimeout,
		})
	} else {
		// 单机模式
		addr := fmt.Sprintf("%s:%d", config.Host, config.Port)
		client = redis.NewClient(&redis.Options{
			Addr:         addr,
			Password:     config.Password,
			DB:           config.DB,
			PoolSize:     config.PoolSize,
			MinIdleConns: config.MinIdleConns,
			MaxRetries:   config.MaxRetries,
			DialTimeout:  config.DialTimeout,
			ReadTimeout:  config.ReadTimeout,
			WriteTimeout: config.WriteTimeout,
		})
	}

	// 验证连接
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping redis: %w", err)
	}

	return &Connection{
		client: client,
		config: config,
	}, nil
}

// Client 返回底层的 redis.UniversalClient 实例
func (c *Connection) Client() redis.UniversalClient {
	return c.client
}

// Close 关闭 Redis 连接
func (c *Connection) Close() error {
	if c.client != nil {
		return c.client.Close()
	}
	return nil
}

// HealthCheck 健康检查
//
// 返回错误如果 Redis 不可用
func (c *Connection) HealthCheck(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := c.client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis health check failed: %w", err)
	}

	return nil
}

// Stats 返回连接池统计信息
func (c *Connection) Stats() *redis.PoolStats {
	return c.client.PoolStats()
}
