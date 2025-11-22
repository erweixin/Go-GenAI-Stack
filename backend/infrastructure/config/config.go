package config

import (
	"time"
)

// Config 应用配置
type Config struct {
	Server    ServerConfig    `mapstructure:"server"`
	Database  DatabaseConfig  `mapstructure:"database"`
	Redis     RedisConfig     `mapstructure:"redis"`
	LLM       LLMConfig       `mapstructure:"llm"`
	Queue     QueueConfig     `mapstructure:"queue"`
	Logging   LoggingConfig   `mapstructure:"logging"`
	Monitoring MonitoringConfig `mapstructure:"monitoring"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
	IdleTimeout  time.Duration `mapstructure:"idle_timeout"`
	MaxBodySize  int64         `mapstructure:"max_body_size"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	User            string        `mapstructure:"user"`
	Password        string        `mapstructure:"password"`
	Database        string        `mapstructure:"database"`
	SSLMode         string        `mapstructure:"ssl_mode"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `mapstructure:"conn_max_idle_time"`
}

// RedisConfig Redis 配置
type RedisConfig struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	Password     string        `mapstructure:"password"`
	DB           int           `mapstructure:"db"`
	PoolSize     int           `mapstructure:"pool_size"`
	MinIdleConns int           `mapstructure:"min_idle_conns"`
	MaxRetries   int           `mapstructure:"max_retries"`
	DialTimeout  time.Duration `mapstructure:"dial_timeout"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
}

// LLMConfig LLM 配置
type LLMConfig struct {
	DefaultModel    string            `mapstructure:"default_model"`
	DefaultProvider string            `mapstructure:"default_provider"`
	Timeout         time.Duration     `mapstructure:"timeout"`
	MaxRetries      int               `mapstructure:"max_retries"`
	Providers       map[string]string `mapstructure:"providers"` // provider -> API key
}

// QueueConfig 队列配置
type QueueConfig struct {
	RedisAddr     string `mapstructure:"redis_addr"`
	RedisPassword string `mapstructure:"redis_password"`
	RedisDB       int    `mapstructure:"redis_db"`
	Concurrency   int    `mapstructure:"concurrency"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level      string `mapstructure:"level"`       // debug, info, warn, error
	Format     string `mapstructure:"format"`      // json, console
	Output     string `mapstructure:"output"`      // stdout, stderr, file
	OutputPath string `mapstructure:"output_path"` // 日志文件路径
}

// MonitoringConfig 监控配置
type MonitoringConfig struct {
	Enabled        bool          `mapstructure:"enabled"`
	SampleRate     float64       `mapstructure:"sample_rate"`      // 采样率 (0.0-1.0)
	TraceRetention time.Duration `mapstructure:"trace_retention"`  // Trace 保留时间
	MetricInterval time.Duration `mapstructure:"metric_interval"`  // 指标聚合间隔
}

// DefaultConfig 返回默认配置
func DefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         "0.0.0.0",
			Port:         8080,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
			MaxBodySize:  10 * 1024 * 1024, // 10MB
		},
		Database: DatabaseConfig{
			Host:            "localhost",
			Port:            5432,
			User:            "postgres",
			Password:        "postgres",
			Database:        "go_genai_stack",
			SSLMode:         "disable",
			MaxOpenConns:    25,
			MaxIdleConns:    25,
			ConnMaxLifetime: time.Hour,
			ConnMaxIdleTime: 10 * time.Minute,
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
		Queue: QueueConfig{
			RedisAddr:   "localhost:6379",
			Concurrency: 10,
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "json",
			Output: "stdout",
		},
		Monitoring: MonitoringConfig{
			Enabled:        true,
			SampleRate:     0.1, // 10%
			TraceRetention: 7 * 24 * time.Hour,
			MetricInterval: time.Minute,
		},
	}
}

