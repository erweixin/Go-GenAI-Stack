package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

// Config PostgreSQL 连接配置
type Config struct {
	Host            string
	Port            int
	User            string
	Password        string
	Database        string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// Connection PostgreSQL 连接管理器
type Connection struct {
	db     *sql.DB
	config *Config
}

// NewConnection 创建新的数据库连接
//
// Example:
//
//	config := &Config{
//	    Host:            "localhost",
//	    Port:            5432,
//	    User:            "postgres",
//	    Password:        "password",
//	    Database:        "go_genai_stack",
//	    SSLMode:         "disable",
//	    MaxOpenConns:    25,
//	    MaxIdleConns:    25,
//	    ConnMaxLifetime: time.Hour,
//	    ConnMaxIdleTime: 10 * time.Minute,
//	}
//	conn, err := NewConnection(context.Background(), config)
func NewConnection(ctx context.Context, config *Config) (*Connection, error) {
	// 构建 DSN
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		config.Host,
		config.Port,
		config.User,
		config.Password,
		config.Database,
		config.SSLMode,
	)

	// 打开数据库连接
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// 配置连接池
	db.SetMaxOpenConns(config.MaxOpenConns)
	db.SetMaxIdleConns(config.MaxIdleConns)
	db.SetConnMaxLifetime(config.ConnMaxLifetime)
	db.SetConnMaxIdleTime(config.ConnMaxIdleTime)

	// 验证连接
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Connection{
		db:     db,
		config: config,
	}, nil
}

// DB 返回底层的 *sql.DB 实例
func (c *Connection) DB() *sql.DB {
	return c.db
}

// Close 关闭数据库连接
func (c *Connection) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}

// HealthCheck 健康检查
//
// 返回错误如果数据库不可用
func (c *Connection) HealthCheck(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := c.db.PingContext(ctx); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	return nil
}

// Stats 返回连接池统计信息
func (c *Connection) Stats() sql.DBStats {
	return c.db.Stats()
}

// Reconnect 重新连接数据库
//
// 在连接丢失时可以尝试重新连接
func (c *Connection) Reconnect(ctx context.Context) error {
	// 关闭旧连接
	if err := c.Close(); err != nil {
		return fmt.Errorf("failed to close old connection: %w", err)
	}

	// 创建新连接
	newConn, err := NewConnection(ctx, c.config)
	if err != nil {
		return fmt.Errorf("failed to reconnect: %w", err)
	}

	// 替换连接
	c.db = newConn.db

	return nil
}
