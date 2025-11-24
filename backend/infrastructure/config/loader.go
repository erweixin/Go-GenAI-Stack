package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Load 加载配置
//
// 从环境变量加载配置，环境变量前缀为 APP_。
// 如果环境变量未设置，使用 DefaultConfig() 中定义的默认值。
//
// 环境变量命名规则：
//   - APP_SERVER_PORT → Config.Server.Port
//   - APP_DATABASE_HOST → Config.Database.Host
//   - APP_REDIS_PASSWORD → Config.Redis.Password
//
// Example:
//
//	cfg, err := config.Load()
//	if err != nil {
//	    log.Fatal(err)
//	}
func Load() (*Config, error) {
	// 从默认配置开始
	cfg := DefaultConfig()

	// 加载 Server 配置
	if err := loadServerConfig(&cfg.Server); err != nil {
		return nil, fmt.Errorf("failed to load server config: %w", err)
	}

	// 加载 Database 配置
	if err := loadDatabaseConfig(&cfg.Database); err != nil {
		return nil, fmt.Errorf("failed to load database config: %w", err)
	}

	// 加载 Redis 配置
	if err := loadRedisConfig(&cfg.Redis); err != nil {
		return nil, fmt.Errorf("failed to load redis config: %w", err)
	}

	// 加载 LLM 配置
	if err := loadLLMConfig(&cfg.LLM); err != nil {
		return nil, fmt.Errorf("failed to load llm config: %w", err)
	}

	// 加载 Logging 配置
	if err := loadLoggingConfig(&cfg.Logging); err != nil {
		return nil, fmt.Errorf("failed to load logging config: %w", err)
	}

	// 加载 Monitoring 配置
	if err := loadMonitoringConfig(&cfg.Monitoring); err != nil {
		return nil, fmt.Errorf("failed to load monitoring config: %w", err)
	}

	// 验证配置
	if err := ValidateConfig(cfg); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return cfg, nil
}

// loadServerConfig 加载服务器配置
func loadServerConfig(cfg *ServerConfig) error {
	cfg.Host = getEnvString("APP_SERVER_HOST", cfg.Host)

	if port, err := getEnvInt("APP_SERVER_PORT", cfg.Port); err != nil {
		return fmt.Errorf("invalid APP_SERVER_PORT: %w", err)
	} else {
		cfg.Port = port
	}

	if timeout, err := getEnvDuration("APP_SERVER_READ_TIMEOUT", cfg.ReadTimeout); err != nil {
		return fmt.Errorf("invalid APP_SERVER_READ_TIMEOUT: %w", err)
	} else {
		cfg.ReadTimeout = timeout
	}

	if timeout, err := getEnvDuration("APP_SERVER_WRITE_TIMEOUT", cfg.WriteTimeout); err != nil {
		return fmt.Errorf("invalid APP_SERVER_WRITE_TIMEOUT: %w", err)
	} else {
		cfg.WriteTimeout = timeout
	}

	if timeout, err := getEnvDuration("APP_SERVER_IDLE_TIMEOUT", cfg.IdleTimeout); err != nil {
		return fmt.Errorf("invalid APP_SERVER_IDLE_TIMEOUT: %w", err)
	} else {
		cfg.IdleTimeout = timeout
	}

	if size, err := getEnvInt64("APP_SERVER_MAX_BODY_SIZE", cfg.MaxBodySize); err != nil {
		return fmt.Errorf("invalid APP_SERVER_MAX_BODY_SIZE: %w", err)
	} else {
		cfg.MaxBodySize = size
	}

	return nil
}

// loadDatabaseConfig 加载数据库配置
func loadDatabaseConfig(cfg *DatabaseConfig) error {
	cfg.Type = getEnvString("APP_DATABASE_TYPE", cfg.Type)
	cfg.Host = getEnvString("APP_DATABASE_HOST", cfg.Host)
	cfg.User = getEnvString("APP_DATABASE_USER", cfg.User)
	cfg.Password = getEnvString("APP_DATABASE_PASSWORD", cfg.Password)
	cfg.Database = getEnvString("APP_DATABASE_DATABASE", cfg.Database)
	cfg.SSLMode = getEnvString("APP_DATABASE_SSL_MODE", cfg.SSLMode)

	if port, err := getEnvInt("APP_DATABASE_PORT", cfg.Port); err != nil {
		return fmt.Errorf("invalid APP_DATABASE_PORT: %w", err)
	} else {
		cfg.Port = port
	}

	if conns, err := getEnvInt("APP_DATABASE_MAX_OPEN_CONNS", cfg.MaxOpenConns); err != nil {
		return fmt.Errorf("invalid APP_DATABASE_MAX_OPEN_CONNS: %w", err)
	} else {
		cfg.MaxOpenConns = conns
	}

	if conns, err := getEnvInt("APP_DATABASE_MAX_IDLE_CONNS", cfg.MaxIdleConns); err != nil {
		return fmt.Errorf("invalid APP_DATABASE_MAX_IDLE_CONNS: %w", err)
	} else {
		cfg.MaxIdleConns = conns
	}

	if lifetime, err := getEnvDuration("APP_DATABASE_CONN_MAX_LIFETIME", cfg.ConnMaxLifetime); err != nil {
		return fmt.Errorf("invalid APP_DATABASE_CONN_MAX_LIFETIME: %w", err)
	} else {
		cfg.ConnMaxLifetime = lifetime
	}

	if idleTime, err := getEnvDuration("APP_DATABASE_CONN_MAX_IDLE_TIME", cfg.ConnMaxIdleTime); err != nil {
		return fmt.Errorf("invalid APP_DATABASE_CONN_MAX_IDLE_TIME: %w", err)
	} else {
		cfg.ConnMaxIdleTime = idleTime
	}

	return nil
}

// loadRedisConfig 加载 Redis 配置
func loadRedisConfig(cfg *RedisConfig) error {
	cfg.Host = getEnvString("APP_REDIS_HOST", cfg.Host)
	cfg.Password = getEnvString("APP_REDIS_PASSWORD", cfg.Password)

	if port, err := getEnvInt("APP_REDIS_PORT", cfg.Port); err != nil {
		return fmt.Errorf("invalid APP_REDIS_PORT: %w", err)
	} else {
		cfg.Port = port
	}

	if db, err := getEnvInt("APP_REDIS_DB", cfg.DB); err != nil {
		return fmt.Errorf("invalid APP_REDIS_DB: %w", err)
	} else {
		cfg.DB = db
	}

	if size, err := getEnvInt("APP_REDIS_POOL_SIZE", cfg.PoolSize); err != nil {
		return fmt.Errorf("invalid APP_REDIS_POOL_SIZE: %w", err)
	} else {
		cfg.PoolSize = size
	}

	if conns, err := getEnvInt("APP_REDIS_MIN_IDLE_CONNS", cfg.MinIdleConns); err != nil {
		return fmt.Errorf("invalid APP_REDIS_MIN_IDLE_CONNS: %w", err)
	} else {
		cfg.MinIdleConns = conns
	}

	if retries, err := getEnvInt("APP_REDIS_MAX_RETRIES", cfg.MaxRetries); err != nil {
		return fmt.Errorf("invalid APP_REDIS_MAX_RETRIES: %w", err)
	} else {
		cfg.MaxRetries = retries
	}

	if timeout, err := getEnvDuration("APP_REDIS_DIAL_TIMEOUT", cfg.DialTimeout); err != nil {
		return fmt.Errorf("invalid APP_REDIS_DIAL_TIMEOUT: %w", err)
	} else {
		cfg.DialTimeout = timeout
	}

	if timeout, err := getEnvDuration("APP_REDIS_READ_TIMEOUT", cfg.ReadTimeout); err != nil {
		return fmt.Errorf("invalid APP_REDIS_READ_TIMEOUT: %w", err)
	} else {
		cfg.ReadTimeout = timeout
	}

	if timeout, err := getEnvDuration("APP_REDIS_WRITE_TIMEOUT", cfg.WriteTimeout); err != nil {
		return fmt.Errorf("invalid APP_REDIS_WRITE_TIMEOUT: %w", err)
	} else {
		cfg.WriteTimeout = timeout
	}

	return nil
}

// loadLLMConfig 加载 LLM 配置
func loadLLMConfig(cfg *LLMConfig) error {
	cfg.DefaultModel = getEnvString("APP_LLM_DEFAULT_MODEL", cfg.DefaultModel)
	cfg.DefaultProvider = getEnvString("APP_LLM_DEFAULT_PROVIDER", cfg.DefaultProvider)

	if timeout, err := getEnvDuration("APP_LLM_TIMEOUT", cfg.Timeout); err != nil {
		return fmt.Errorf("invalid APP_LLM_TIMEOUT: %w", err)
	} else {
		cfg.Timeout = timeout
	}

	if retries, err := getEnvInt("APP_LLM_MAX_RETRIES", cfg.MaxRetries); err != nil {
		return fmt.Errorf("invalid APP_LLM_MAX_RETRIES: %w", err)
	} else {
		cfg.MaxRetries = retries
	}

	return nil
}

// loadLoggingConfig 加载日志配置
func loadLoggingConfig(cfg *LoggingConfig) error {
	// 是否启用结构化日志
	if enabled, err := getEnvBool("APP_LOGGING_ENABLED", cfg.Enabled); err != nil {
		return fmt.Errorf("invalid APP_LOGGING_ENABLED: %w", err)
	} else {
		cfg.Enabled = enabled
	}

	// 日志级别和格式
	cfg.Level = getEnvString("APP_LOGGING_LEVEL", cfg.Level)
	cfg.Format = getEnvString("APP_LOGGING_FORMAT", cfg.Format)
	cfg.Output = getEnvString("APP_LOGGING_OUTPUT", cfg.Output)
	cfg.OutputPath = getEnvString("APP_LOGGING_OUTPUT_PATH", cfg.OutputPath)

	// 日志轮转配置
	if maxSize, err := getEnvInt("APP_LOGGING_MAX_SIZE", cfg.MaxSize); err != nil {
		return fmt.Errorf("invalid APP_LOGGING_MAX_SIZE: %w", err)
	} else {
		cfg.MaxSize = maxSize
	}

	if maxBackups, err := getEnvInt("APP_LOGGING_MAX_BACKUPS", cfg.MaxBackups); err != nil {
		return fmt.Errorf("invalid APP_LOGGING_MAX_BACKUPS: %w", err)
	} else {
		cfg.MaxBackups = maxBackups
	}

	if maxAge, err := getEnvInt("APP_LOGGING_MAX_AGE", cfg.MaxAge); err != nil {
		return fmt.Errorf("invalid APP_LOGGING_MAX_AGE: %w", err)
	} else {
		cfg.MaxAge = maxAge
	}

	if compress, err := getEnvBool("APP_LOGGING_COMPRESS", cfg.Compress); err != nil {
		return fmt.Errorf("invalid APP_LOGGING_COMPRESS: %w", err)
	} else {
		cfg.Compress = compress
	}

	return nil
}

// loadMonitoringConfig 加载监控配置
func loadMonitoringConfig(cfg *MonitoringConfig) error {
	// Metrics 配置
	if enabled, err := getEnvBool("APP_MONITORING_METRICS_ENABLED", cfg.MetricsEnabled); err != nil {
		return fmt.Errorf("invalid APP_MONITORING_METRICS_ENABLED: %w", err)
	} else {
		cfg.MetricsEnabled = enabled
	}

	if path := os.Getenv("APP_MONITORING_METRICS_PATH"); path != "" {
		cfg.MetricsPath = path
	}

	if port, err := getEnvInt("APP_MONITORING_METRICS_PORT", cfg.MetricsPort); err != nil {
		return fmt.Errorf("invalid APP_MONITORING_METRICS_PORT: %w", err)
	} else {
		cfg.MetricsPort = port
	}

	// Tracing 配置
	if enabled, err := getEnvBool("APP_MONITORING_TRACING_ENABLED", cfg.TracingEnabled); err != nil {
		return fmt.Errorf("invalid APP_MONITORING_TRACING_ENABLED: %w", err)
	} else {
		cfg.TracingEnabled = enabled
	}

	if endpoint := os.Getenv("APP_MONITORING_TRACING_ENDPOINT"); endpoint != "" {
		cfg.TracingEndpoint = endpoint
	}

	if tracingType := os.Getenv("APP_MONITORING_TRACING_TYPE"); tracingType != "" {
		cfg.TracingType = tracingType
	}

	if rate, err := getEnvFloat64("APP_MONITORING_SAMPLE_RATE", cfg.SampleRate); err != nil {
		return fmt.Errorf("invalid APP_MONITORING_SAMPLE_RATE: %w", err)
	} else {
		cfg.SampleRate = rate
	}

	// Health 配置
	if enabled, err := getEnvBool("APP_MONITORING_HEALTH_ENABLED", cfg.HealthEnabled); err != nil {
		return fmt.Errorf("invalid APP_MONITORING_HEALTH_ENABLED: %w", err)
	} else {
		cfg.HealthEnabled = enabled
	}

	if path := os.Getenv("APP_MONITORING_HEALTH_PATH"); path != "" {
		cfg.HealthPath = path
	}

	return nil
}

// ========== 辅助函数：环境变量读取和类型转换 ==========

// getEnvString 读取字符串环境变量，如果未设置则返回默认值
func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt 读取整数环境变量，如果未设置则返回默认值
func getEnvInt(key string, defaultValue int) (int, error) {
	if value := os.Getenv(key); value != "" {
		intValue, err := strconv.Atoi(value)
		if err != nil {
			return 0, fmt.Errorf("invalid integer value '%s': %w", value, err)
		}
		return intValue, nil
	}
	return defaultValue, nil
}

// getEnvInt64 读取 int64 环境变量，如果未设置则返回默认值
func getEnvInt64(key string, defaultValue int64) (int64, error) {
	if value := os.Getenv(key); value != "" {
		intValue, err := strconv.ParseInt(value, 10, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid int64 value '%s': %w", value, err)
		}
		return intValue, nil
	}
	return defaultValue, nil
}

// getEnvFloat64 读取浮点数环境变量，如果未设置则返回默认值
func getEnvFloat64(key string, defaultValue float64) (float64, error) {
	if value := os.Getenv(key); value != "" {
		floatValue, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid float64 value '%s': %w", value, err)
		}
		return floatValue, nil
	}
	return defaultValue, nil
}

// getEnvBool 读取布尔值环境变量，如果未设置则返回默认值
func getEnvBool(key string, defaultValue bool) (bool, error) {
	if value := os.Getenv(key); value != "" {
		boolValue, err := strconv.ParseBool(value)
		if err != nil {
			return false, fmt.Errorf("invalid boolean value '%s': %w", value, err)
		}
		return boolValue, nil
	}
	return defaultValue, nil
}

// getEnvDuration 读取时间间隔环境变量，如果未设置则返回默认值
func getEnvDuration(key string, defaultValue time.Duration) (time.Duration, error) {
	if value := os.Getenv(key); value != "" {
		duration, err := time.ParseDuration(value)
		if err != nil {
			return 0, fmt.Errorf("invalid duration value '%s': %w", value, err)
		}
		return duration, nil
	}
	return defaultValue, nil
}
