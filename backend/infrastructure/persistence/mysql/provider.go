package mysql

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/erweixin/go-genai-stack/infrastructure/persistence"
	_ "github.com/go-sql-driver/mysql"
)

// Provider MySQL 数据库提供者
type Provider struct {
	db     *sql.DB
	config *persistence.Config
}

// NewProvider 创建 MySQL 提供者
//
// 实现 persistence.DatabaseProvider 接口。
//
// Example:
//
//	config := &persistence.Config{
//	    Type:            "mysql",
//	    Host:            "localhost",
//	    Port:            3306,
//	    User:            "genai",
//	    Password:        "genai_password",
//	    Database:        "go_genai_stack",
//	    MaxOpenConns:    25,
//	    MaxIdleConns:    5,
//	    ConnMaxLifetime: time.Hour,
//	    Options: map[string]string{
//	        "charset":   "utf8mb4",
//	        "parseTime": "True",
//	        "loc":       "Local",
//	    },
//	}
//	provider, err := mysql.NewProvider(config)
func NewProvider(config *persistence.Config) (persistence.DatabaseProvider, error) {
	return &Provider{
		config: config,
	}, nil
}

// Connect 连接到 MySQL 数据库
func (p *Provider) Connect(ctx context.Context) error {
	// 构建 DSN
	dsn := p.buildDSN()

	// 打开数据库连接
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("failed to open mysql connection: %w", err)
	}

	// 配置连接池
	db.SetMaxOpenConns(p.config.MaxOpenConns)
	db.SetMaxIdleConns(p.config.MaxIdleConns)
	db.SetConnMaxLifetime(p.config.ConnMaxLifetime)
	db.SetConnMaxIdleTime(p.config.ConnMaxIdleTime)

	// 验证连接
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return fmt.Errorf("failed to ping mysql: %w", err)
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
		return fmt.Errorf("mysql health check failed: %w", err)
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
	return "mysql"
}

// Dialect 返回 MySQL SQL 方言
func (p *Provider) Dialect() persistence.SQLDialect {
	return &MySQLDialect{}
}

// buildDSN 构建 MySQL DSN
func (p *Provider) buildDSN() string {
	// 基础 DSN: user:password@tcp(host:port)/database
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s",
		p.config.User,
		p.config.Password,
		p.config.Host,
		p.config.Port,
		p.config.Database,
	)

	// 添加选项
	if len(p.config.Options) > 0 {
		dsn += "?"
		first := true
		for key, value := range p.config.Options {
			if !first {
				dsn += "&"
			}
			dsn += fmt.Sprintf("%s=%s", key, value)
			first = false
		}
	} else {
		// 默认选项
		dsn += "?charset=utf8mb4&parseTime=True&loc=Local"
	}

	return dsn
}

// MySQLDialect MySQL SQL 方言
type MySQLDialect struct{}

// Placeholder 返回 MySQL 占位符 (?)
func (d *MySQLDialect) Placeholder(n int) string {
	return "?"
}

// QuoteIdentifier 引用标识符
func (d *MySQLDialect) QuoteIdentifier(name string) string {
	return fmt.Sprintf("`%s`", name)
}

// CurrentTimestamp 返回当前时间戳函数
func (d *MySQLDialect) CurrentTimestamp() string {
	return "CURRENT_TIMESTAMP"
}

// AutoIncrement 返回自增语法
func (d *MySQLDialect) AutoIncrement() string {
	return "INT AUTO_INCREMENT PRIMARY KEY"
}

// JSONType 返回 JSON 列类型
func (d *MySQLDialect) JSONType() string {
	return "JSON"
}
