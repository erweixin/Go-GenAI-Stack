package config

import (
	"time"
)

// Config 应用配置
//
// 环境变量命名规则（前缀：APP_）：
//   - APP_SERVER_HOST → Config.Server.Host
//   - APP_DATABASE_PORT → Config.Database.Port
//   - APP_REDIS_POOL_SIZE → Config.Redis.PoolSize
type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	Redis      RedisConfig
	LLM        LLMConfig
	Logging    LoggingConfig
	Monitoring MonitoringConfig
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host         string
	Port         int
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
	MaxBodySize  int64
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Type            string // postgres, mysql, sqlite
	Host            string
	Port            int
	User            string
	Password        string
	Database        string
	SSLMode         string // PostgreSQL 专用：disable, require, verify-ca, verify-full
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
	Options         map[string]string // 数据库特定选项
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host         string
	Port         int
	Password     string
	DB           int
	PoolSize     int
	MinIdleConns int
	MaxRetries   int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// LLMConfig LLM 配置
type LLMConfig struct {
	DefaultModel    string
	DefaultProvider string
	Timeout         time.Duration
	MaxRetries      int
	Providers       map[string]string // provider -> API key
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Enabled    bool   // 是否启用结构化日志（false 时使用标准 log）
	Level      string // debug, info, warn, error
	Format     string // json, console
	Output     string // stdout, stderr, file
	OutputPath string // 日志文件路径（当 output=file 时）
	MaxSize    int    // 日志文件最大大小（MB）
	MaxBackups int    // 保留的旧日志文件数量
	MaxAge     int    // 保留旧日志文件的最大天数
	Compress   bool   // 是否压缩旧日志
}

// MonitoringConfig 监控配置
type MonitoringConfig struct {
	// Metrics 配置
	MetricsEnabled bool   // 是否启用 Prometheus Metrics
	MetricsPath    string // Metrics 暴露路径（默认 /metrics）
	MetricsPort    int    // Metrics 端口（默认与 Server.Port 相同）

	// Tracing 配置
	TracingEnabled  bool    // 是否启用 OpenTelemetry Tracing
	TracingEndpoint string  // OTLP Exporter 端点（如 localhost:4317）
	TracingType     string  // 导出器类型：otlp, jaeger, stdout
	SampleRate      float64 // 采样率 (0.0-1.0)

	// Health Check 配置
	HealthEnabled bool   // 是否启用健康检查端点
	HealthPath    string // 健康检查路径（默认 /health）
}

// DefaultConfig 返回默认配置
//
// 当环境变量未设置时，Load() 会使用这些默认值。
func DefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         "0.0.0.0",
			Port:         8080,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
			MaxBodySize:  10 * 1024 * 1024,
		},
		Database: DatabaseConfig{
			Type:            "postgres",
			Host:            "localhost",
			Port:            5432,
			User:            "genai",
			Password:        "genai_password",
			Database:        "go_genai_stack",
			SSLMode:         "disable",
			MaxOpenConns:    25,
			MaxIdleConns:    5,
			ConnMaxLifetime: time.Hour,
			ConnMaxIdleTime: 10 * time.Minute,
			Options:         make(map[string]string),
		},
		Redis: RedisConfig{
			Host:         "localhost",
			Port:         6379,
			Password:     "",
			DB:           0,
			PoolSize:     10,
			MinIdleConns: 5,
			MaxRetries:   3,
			DialTimeout:  5 * time.Second,
			ReadTimeout:  3 * time.Second,
			WriteTimeout: 3 * time.Second,
		},
		LLM: LLMConfig{
			DefaultModel:    "gpt-4o",
			DefaultProvider: "openai",
			Timeout:         30 * time.Second,
			MaxRetries:      3,
			Providers:       make(map[string]string),
		},
		Logging: LoggingConfig{
			Enabled:    true,
			Level:      "info",
			Format:     "json",
			Output:     "stdout",
			OutputPath: "./logs/app.log",
			MaxSize:    100, // 100MB
			MaxBackups: 3,
			MaxAge:     7, // 7 days
			Compress:   true,
		},
		Monitoring: MonitoringConfig{
			// Metrics
			MetricsEnabled: true,
			MetricsPath:    "/metrics",
			MetricsPort:    0, // 0 表示与 Server.Port 相同

			// Tracing
			TracingEnabled:  false, // 默认关闭，避免强依赖外部服务
			TracingEndpoint: "localhost:4317",
			TracingType:     "otlp", // otlp, jaeger, stdout
			SampleRate:      0.1,

			// Health
			HealthEnabled: true,
			HealthPath:    "/health",
		},
	}
}
