package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/erweixin/go-genai-stack/backend/infrastructure/persistence"
	_ "github.com/lib/pq"
)

// Provider PostgreSQL 数据库提供者
type Provider struct {
	db     *sql.DB
	config *persistence.Config
}

// NewProvider 创建 PostgreSQL 提供者
//
// 实现 persistence.DatabaseProvider 接口。
//
// Example:
//
//	config := &persistence.Config{
//	    Type:            "postgres",
//	    Host:            "localhost",
//	    Port:            5432,
//	    User:            "genai",
//	    Password:        "genai_password",
//	    Database:        "go_genai_stack",
//	    MaxOpenConns:    25,
//	    MaxIdleConns:    5,
//	    ConnMaxLifetime: time.Hour,
//	}
//	provider, err := postgres.NewProvider(config)
func NewProvider(config *persistence.Config) (persistence.DatabaseProvider, error) {
	return &Provider{
		config: config,
	}, nil
}

// Connect 连接到 PostgreSQL 数据库
func (p *Provider) Connect(ctx context.Context) error {
	// 构建 DSN
	dsn := p.buildDSN()

	// 打开数据库连接
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to open postgres connection: %w", err)
	}

	// 配置连接池
	db.SetMaxOpenConns(p.config.MaxOpenConns)
	db.SetMaxIdleConns(p.config.MaxIdleConns)
	db.SetConnMaxLifetime(p.config.ConnMaxLifetime)
	db.SetConnMaxIdleTime(p.config.ConnMaxIdleTime)

	// 验证连接
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return fmt.Errorf("failed to ping postgres: %w", err)
	}

	p.db = db
	return nil
}

// DB 返回底层的 *sql.DB 实例
func (p *Provider) DB() *sql.DB {
	return p.db
}

// Close 关闭数据库连接
func (p *Provider) Close() error {
	if p.db != nil {
		return p.db.Close()
	}
	return nil
}

// HealthCheck 健康检查
func (p *Provider) HealthCheck(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if p.db == nil {
		return fmt.Errorf("database connection not initialized")
	}

	if err := p.db.PingContext(ctx); err != nil {
		return fmt.Errorf("postgres health check failed: %w", err)
	}

	return nil
}

// Stats 返回连接池统计信息
func (p *Provider) Stats() sql.DBStats {
	if p.db == nil {
		return sql.DBStats{}
	}
	return p.db.Stats()
}

// Type 返回数据库类型
func (p *Provider) Type() string {
	return "postgres"
}

// Dialect 返回 PostgreSQL SQL 方言
func (p *Provider) Dialect() persistence.SQLDialect {
	return &PostgresDialect{}
}

// buildDSN 构建 PostgreSQL DSN
func (p *Provider) buildDSN() string {
	// 基础 DSN
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s",
		p.config.Host,
		p.config.Port,
		p.config.User,
		p.config.Password,
		p.config.Database,
	)

	// 添加选项
	for key, value := range p.config.Options {
		dsn += fmt.Sprintf(" %s=%s", key, value)
	}

	// 默认选项
	if _, hasSSL := p.config.Options["sslmode"]; !hasSSL {
		dsn += " sslmode=disable"
	}

	return dsn
}

// PostgresDialect PostgreSQL SQL 方言
type PostgresDialect struct{}

// Placeholder 返回 PostgreSQL 占位符 ($1, $2, ...)
func (d *PostgresDialect) Placeholder(n int) string {
	return fmt.Sprintf("$%d", n)
}

// QuoteIdentifier 引用标识符
func (d *PostgresDialect) QuoteIdentifier(name string) string {
	return fmt.Sprintf(`"%s"`, name)
}

// CurrentTimestamp 返回当前时间戳函数
func (d *PostgresDialect) CurrentTimestamp() string {
	return "CURRENT_TIMESTAMP"
}

// AutoIncrement 返回自增语法
func (d *PostgresDialect) AutoIncrement() string {
	return "SERIAL PRIMARY KEY"
}

// JSONType 返回 JSON 列类型
func (d *PostgresDialect) JSONType() string {
	return "JSONB"
}
