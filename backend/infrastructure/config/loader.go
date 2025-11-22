package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

// Loader 配置加载器
type Loader struct {
	viper *viper.Viper
}

// NewLoader 创建新的配置加载器
//
// Example:
//
//	loader := NewLoader()
//	config, err := loader.Load("config.yaml")
func NewLoader() *Loader {
	return &Loader{
		viper: viper.New(),
	}
}

// Load 加载配置
//
// 配置加载顺序：
//  1. 默认配置
//  2. 配置文件（如果指定）
//  3. 环境变量（覆盖配置文件）
//
// 环境变量命名规则：
//   - APP_SERVER_PORT -> server.port
//   - APP_DATABASE_HOST -> database.host
func (l *Loader) Load(configPath string) (*Config, error) {
	// 1. 设置环境变量绑定（必须在任何读取之前）
	l.setupEnvBindings()

	// 2. 设置默认值（让 viper 知道配置结构）
	l.setDefaults()

	// 3. 加载配置文件（如果指定）
	if configPath != "" {
		l.viper.SetConfigFile(configPath)
		if err := l.viper.ReadInConfig(); err != nil {
			// 配置文件不存在不算错误
			if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
				return nil, fmt.Errorf("failed to read config file: %w", err)
			}
		}
	}

	// 4. 创建配置结构体
	config := &Config{}

	// 5. 解析配置到结构体（环境变量会自动覆盖）
	if err := l.viper.Unmarshal(config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return config, nil
}

// LoadFromEnv 仅从环境变量加载配置
//
// Example:
//
//	loader := NewLoader()
//	config, err := loader.LoadFromEnv()
func (l *Loader) LoadFromEnv() (*Config, error) {
	return l.Load("")
}

// setupEnvBindings 设置环境变量绑定
func (l *Loader) setupEnvBindings() {
	// 设置环境变量前缀
	l.viper.SetEnvPrefix("APP")

	// 自动绑定环境变量
	l.viper.AutomaticEnv()

	// 替换分隔符（. -> _）
	l.viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
}

// setDefaults 设置默认值
//
// 这一步很重要：让 viper 知道配置的结构，
// 这样环境变量才能正确映射到嵌套的配置对象
func (l *Loader) setDefaults() {
	defaults := DefaultConfig()

	// Server 配置
	l.viper.SetDefault("server.host", defaults.Server.Host)
	l.viper.SetDefault("server.port", defaults.Server.Port)
	l.viper.SetDefault("server.read_timeout", defaults.Server.ReadTimeout)
	l.viper.SetDefault("server.write_timeout", defaults.Server.WriteTimeout)
	l.viper.SetDefault("server.idle_timeout", defaults.Server.IdleTimeout)
	l.viper.SetDefault("server.max_body_size", defaults.Server.MaxBodySize)

	// Database 配置
	l.viper.SetDefault("database.host", defaults.Database.Host)
	l.viper.SetDefault("database.port", defaults.Database.Port)
	l.viper.SetDefault("database.user", defaults.Database.User)
	l.viper.SetDefault("database.password", defaults.Database.Password)
	l.viper.SetDefault("database.database", defaults.Database.Database)
	l.viper.SetDefault("database.ssl_mode", defaults.Database.SSLMode)
	l.viper.SetDefault("database.max_open_conns", defaults.Database.MaxOpenConns)
	l.viper.SetDefault("database.max_idle_conns", defaults.Database.MaxIdleConns)
	l.viper.SetDefault("database.conn_max_lifetime", defaults.Database.ConnMaxLifetime)
	l.viper.SetDefault("database.conn_max_idle_time", defaults.Database.ConnMaxIdleTime)

	// Redis 配置
	l.viper.SetDefault("redis.host", defaults.Redis.Host)
	l.viper.SetDefault("redis.port", defaults.Redis.Port)
	l.viper.SetDefault("redis.password", defaults.Redis.Password)
	l.viper.SetDefault("redis.db", defaults.Redis.DB)
	l.viper.SetDefault("redis.pool_size", defaults.Redis.PoolSize)
	l.viper.SetDefault("redis.min_idle_conns", defaults.Redis.MinIdleConns)
	l.viper.SetDefault("redis.max_retries", defaults.Redis.MaxRetries)
	l.viper.SetDefault("redis.dial_timeout", defaults.Redis.DialTimeout)
	l.viper.SetDefault("redis.read_timeout", defaults.Redis.ReadTimeout)
	l.viper.SetDefault("redis.write_timeout", defaults.Redis.WriteTimeout)

	// LLM 配置
	l.viper.SetDefault("llm.default_model", defaults.LLM.DefaultModel)
	l.viper.SetDefault("llm.default_provider", defaults.LLM.DefaultProvider)
	l.viper.SetDefault("llm.timeout", defaults.LLM.Timeout)
	l.viper.SetDefault("llm.max_retries", defaults.LLM.MaxRetries)

	// Logging 配置
	l.viper.SetDefault("logging.level", defaults.Logging.Level)
	l.viper.SetDefault("logging.format", defaults.Logging.Format)
	l.viper.SetDefault("logging.output", defaults.Logging.Output)
	l.viper.SetDefault("logging.output_path", defaults.Logging.OutputPath)

	// Monitoring 配置
	l.viper.SetDefault("monitoring.enabled", defaults.Monitoring.Enabled)
	l.viper.SetDefault("monitoring.sample_rate", defaults.Monitoring.SampleRate)
	l.viper.SetDefault("monitoring.trace_retention", defaults.Monitoring.TraceRetention)
	l.viper.SetDefault("monitoring.metric_interval", defaults.Monitoring.MetricInterval)
}

// LoadFromFile 从指定文件加载配置
//
// Example:
//
//	config, err := LoadFromFile("config.yaml")
func LoadFromFile(configPath string) (*Config, error) {
	loader := NewLoader()
	return loader.Load(configPath)
}

// LoadFromEnvOrFile 优先从环境变量加载，如果未设置则从文件加载
//
// Example:
//
//	config, err := LoadFromEnvOrFile("config.yaml")
func LoadFromEnvOrFile(configPath string) (*Config, error) {
	loader := NewLoader()

	// 检查是否通过环境变量指定了配置文件
	if envConfigPath := os.Getenv("APP_CONFIG_FILE"); envConfigPath != "" {
		configPath = envConfigPath
	}

	return loader.Load(configPath)
}
