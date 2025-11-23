package persistence

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// DatabaseProvider 数据库提供者接口
//
// 抽象不同数据库的连接管理，支持 PostgreSQL、MySQL、SQLite 等。
// 所有提供者都返回标准的 *sql.DB，Repository 层无需感知具体数据库类型。
type DatabaseProvider interface {
	// Connect 连接数据库
	Connect(ctx context.Context) error

	// DB 获取底层的 *sql.DB 实例
	DB() *sql.DB

	// Close 关闭数据库连接
	Close() error

	// HealthCheck 健康检查
	HealthCheck(ctx context.Context) error

	// Stats 获取连接池统计信息
	Stats() sql.DBStats

	// Type 返回数据库类型（postgres, mysql, sqlite）
	Type() string

	// Dialect 返回 SQL 方言（用于生成 SQL）
	Dialect() SQLDialect
}

// SQLDialect SQL 方言接口
//
// 不同数据库的 SQL 语法有细微差异，通过方言接口统一。
type SQLDialect interface {
	// Placeholder 返回占位符（PostgreSQL: $1, MySQL: ?, SQLite: ?）
	Placeholder(n int) string

	// QuoteIdentifier 引用标识符（PostgreSQL: "name", MySQL: `name`, SQLite: "name"）
	QuoteIdentifier(name string) string

	// CurrentTimestamp 返回当前时间戳函数
	CurrentTimestamp() string

	// AutoIncrement 返回自增语法
	AutoIncrement() string

	// JSONType 返回 JSON 列类型
	JSONType() string
}

// Config 通用数据库配置
type Config struct {
	// 数据库类型：postgres, mysql, sqlite
	Type string `mapstructure:"type"`

	// 连接信息
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Database string `mapstructure:"database"`

	// 连接池配置
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `mapstructure:"conn_max_idle_time"`

	// 特定数据库选项
	Options map[string]string `mapstructure:"options"`
}

// ProviderFactory 数据库提供者工厂
type ProviderFactory struct {
	constructors map[string]ProviderConstructor
}

// ProviderConstructor 提供者构造函数类型
type ProviderConstructor func(config *Config) (DatabaseProvider, error)

// NewProviderFactory 创建提供者工厂
func NewProviderFactory() *ProviderFactory {
	return &ProviderFactory{
		constructors: make(map[string]ProviderConstructor),
	}
}

// Register 注册数据库提供者
//
// 允许用户注册自定义数据库提供者。
//
// Example:
//
//	factory.Register("postgres", postgres.NewProvider)
//	factory.Register("mysql", mysql.NewProvider)
//	factory.Register("custom", myCustomProvider)
func (f *ProviderFactory) Register(dbType string, constructor ProviderConstructor) {
	f.constructors[dbType] = constructor
}

// Create 创建数据库提供者
//
// 根据配置自动选择对应的数据库提供者。
//
// Example:
//
//	config := &Config{
//	    Type:     "postgres",
//	    Host:     "localhost",
//	    Port:     5432,
//	    User:     "genai",
//	    Password: "genai_password",
//	    Database: "go_genai_stack",
//	}
//	provider, err := factory.Create(config)
func (f *ProviderFactory) Create(config *Config) (DatabaseProvider, error) {
	constructor, exists := f.constructors[config.Type]
	if !exists {
		return nil, fmt.Errorf("unsupported database type: %s (available: %v)", 
			config.Type, f.availableTypes())
	}

	return constructor(config)
}

// availableTypes 返回已注册的数据库类型
func (f *ProviderFactory) availableTypes() []string {
	types := make([]string, 0, len(f.constructors))
	for t := range f.constructors {
		types = append(types, t)
	}
	return types
}

// DefaultFactory 全局默认工厂（已注册内置数据库）
var DefaultFactory *ProviderFactory

// init 初始化默认工厂
func init() {
	DefaultFactory = NewProviderFactory()
	// 内置数据库会自动注册
	// DefaultFactory.Register("postgres", postgres.NewProvider)
	// DefaultFactory.Register("mysql", mysql.NewProvider)
	// DefaultFactory.Register("sqlite", sqlite.NewProvider)
}

// NewProvider 创建数据库提供者（使用全局工厂）
//
// 快捷方法，使用默认工厂创建提供者。
func NewProvider(config *Config) (DatabaseProvider, error) {
	return DefaultFactory.Create(config)
}

