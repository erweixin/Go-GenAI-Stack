package config

import (
	"fmt"
	"strings"
)

// Validator 配置验证器
type Validator struct {
	errors []string
}

// NewValidator 创建新的配置验证器
func NewValidator() *Validator {
	return &Validator{
		errors: make([]string, 0),
	}
}

// Validate 验证配置
//
// Example:
//
//	validator := NewValidator()
//	if err := validator.Validate(config); err != nil {
//	    log.Fatal(err)
//	}
func (v *Validator) Validate(config *Config) error {
	// 验证服务器配置
	v.validateServer(&config.Server)

	// 验证数据库配置
	v.validateDatabase(&config.Database)

	// 验证 Redis 配置
	v.validateRedis(&config.Redis)

	// 验证 LLM 配置
	v.validateLLM(&config.LLM)

	// 验证日志配置
	v.validateLogging(&config.Logging)

	// 验证监控配置
	v.validateMonitoring(&config.Monitoring)

	// 返回错误
	if len(v.errors) > 0 {
		return fmt.Errorf("configuration validation failed:\n  - %s", strings.Join(v.errors, "\n  - "))
	}

	return nil
}

// validateServer 验证服务器配置
func (v *Validator) validateServer(config *ServerConfig) {
	if config.Port <= 0 || config.Port > 65535 {
		v.addError("server.port must be between 1 and 65535")
	}

	if config.ReadTimeout <= 0 {
		v.addError("server.read_timeout must be positive")
	}

	if config.WriteTimeout <= 0 {
		v.addError("server.write_timeout must be positive")
	}

	if config.MaxBodySize <= 0 {
		v.addError("server.max_body_size must be positive")
	}
}

// validateDatabase 验证数据库配置
func (v *Validator) validateDatabase(config *DatabaseConfig) {
	if config.Host == "" {
		v.addError("database.host is required")
	}

	if config.Port <= 0 || config.Port > 65535 {
		v.addError("database.port must be between 1 and 65535")
	}

	if config.User == "" {
		v.addError("database.user is required")
	}

	if config.Database == "" {
		v.addError("database.database is required")
	}

	if config.MaxOpenConns <= 0 {
		v.addError("database.max_open_conns must be positive")
	}

	if config.MaxIdleConns <= 0 {
		v.addError("database.max_idle_conns must be positive")
	}

	if config.MaxIdleConns > config.MaxOpenConns {
		v.addError("database.max_idle_conns cannot exceed max_open_conns")
	}
}

// validateRedis 验证 Redis 配置
func (v *Validator) validateRedis(config *RedisConfig) {
	if config.Host == "" {
		v.addError("redis.host is required")
	}

	if config.Port <= 0 || config.Port > 65535 {
		v.addError("redis.port must be between 1 and 65535")
	}

	if config.PoolSize <= 0 {
		v.addError("redis.pool_size must be positive")
	}

	if config.MinIdleConns < 0 {
		v.addError("redis.min_idle_conns cannot be negative")
	}

	if config.MinIdleConns > config.PoolSize {
		v.addError("redis.min_idle_conns cannot exceed pool_size")
	}
}

// validateLLM 验证 LLM 配置
func (v *Validator) validateLLM(config *LLMConfig) {
	if config.DefaultModel == "" {
		v.addError("llm.default_model is required")
	}

	if config.DefaultProvider == "" {
		v.addError("llm.default_provider is required")
	}

	if config.Timeout <= 0 {
		v.addError("llm.timeout must be positive")
	}

	if config.MaxRetries < 0 {
		v.addError("llm.max_retries cannot be negative")
	}
}

// validateLogging 验证日志配置
func (v *Validator) validateLogging(config *LoggingConfig) {
	validLevels := map[string]bool{
		"debug": true,
		"info":  true,
		"warn":  true,
		"error": true,
	}

	if !validLevels[config.Level] {
		v.addError("logging.level must be one of: debug, info, warn, error")
	}

	validFormats := map[string]bool{
		"json":    true,
		"console": true,
	}

	if !validFormats[config.Format] {
		v.addError("logging.format must be one of: json, console")
	}

	validOutputs := map[string]bool{
		"stdout": true,
		"stderr": true,
		"file":   true,
	}

	if !validOutputs[config.Output] {
		v.addError("logging.output must be one of: stdout, stderr, file")
	}

	if config.Output == "file" && config.OutputPath == "" {
		v.addError("logging.output_path is required when output is 'file'")
	}
}

// validateMonitoring 验证监控配置
func (v *Validator) validateMonitoring(config *MonitoringConfig) {
	if config.SampleRate < 0 || config.SampleRate > 1 {
		v.addError("monitoring.sample_rate must be between 0 and 1")
	}

	if config.TraceRetention <= 0 {
		v.addError("monitoring.trace_retention must be positive")
	}

	if config.MetricInterval <= 0 {
		v.addError("monitoring.metric_interval must be positive")
	}
}

// addError 添加验证错误
func (v *Validator) addError(message string) {
	v.errors = append(v.errors, message)
}

// ValidateConfig 验证配置（便捷函数）
func ValidateConfig(config *Config) error {
	validator := NewValidator()
	return validator.Validate(config)
}
