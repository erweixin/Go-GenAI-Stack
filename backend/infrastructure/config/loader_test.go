package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad_WithDefaults(t *testing.T) {
	// 清理环境变量
	os.Clearenv()

	// 加载配置（应使用默认值）
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() failed: %v", err)
	}

	// 验证默认值
	if cfg.Server.Host != "0.0.0.0" {
		t.Errorf("Expected server.host = 0.0.0.0, got %s", cfg.Server.Host)
	}
	if cfg.Server.Port != 8080 {
		t.Errorf("Expected server.port = 8080, got %d", cfg.Server.Port)
	}
	if cfg.Database.Type != "postgres" {
		t.Errorf("Expected database.type = postgres, got %s", cfg.Database.Type)
	}
	if cfg.Database.Host != "localhost" {
		t.Errorf("Expected database.host = localhost, got %s", cfg.Database.Host)
	}
}

func TestLoad_WithEnvironmentVariables(t *testing.T) {
	// 设置环境变量
	os.Setenv("APP_SERVER_HOST", "127.0.0.1")
	os.Setenv("APP_SERVER_PORT", "9090")
	os.Setenv("APP_DATABASE_HOST", "db.example.com")
	os.Setenv("APP_DATABASE_PORT", "5433")
	os.Setenv("APP_REDIS_HOST", "redis.example.com")
	defer func() {
		os.Unsetenv("APP_SERVER_HOST")
		os.Unsetenv("APP_SERVER_PORT")
		os.Unsetenv("APP_DATABASE_HOST")
		os.Unsetenv("APP_DATABASE_PORT")
		os.Unsetenv("APP_REDIS_HOST")
	}()

	// 加载配置
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() failed: %v", err)
	}

	// 验证环境变量覆盖了默认值
	if cfg.Server.Host != "127.0.0.1" {
		t.Errorf("Expected server.host = 127.0.0.1, got %s", cfg.Server.Host)
	}
	if cfg.Server.Port != 9090 {
		t.Errorf("Expected server.port = 9090, got %d", cfg.Server.Port)
	}
	if cfg.Database.Host != "db.example.com" {
		t.Errorf("Expected database.host = db.example.com, got %s", cfg.Database.Host)
	}
	if cfg.Database.Port != 5433 {
		t.Errorf("Expected database.port = 5433, got %d", cfg.Database.Port)
	}
	if cfg.Redis.Host != "redis.example.com" {
		t.Errorf("Expected redis.host = redis.example.com, got %s", cfg.Redis.Host)
	}
}

func TestLoad_WithDurationValues(t *testing.T) {
	// 设置时间相关的环境变量
	os.Setenv("APP_SERVER_READ_TIMEOUT", "30s")
	os.Setenv("APP_DATABASE_CONN_MAX_LIFETIME", "2h")
	defer func() {
		os.Unsetenv("APP_SERVER_READ_TIMEOUT")
		os.Unsetenv("APP_DATABASE_CONN_MAX_LIFETIME")
	}()

	// 加载配置
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() failed: %v", err)
	}

	// 验证时间值解析正确
	if cfg.Server.ReadTimeout != 30*time.Second {
		t.Errorf("Expected server.read_timeout = 30s, got %v", cfg.Server.ReadTimeout)
	}
	if cfg.Database.ConnMaxLifetime != 2*time.Hour {
		t.Errorf("Expected database.conn_max_lifetime = 2h, got %v", cfg.Database.ConnMaxLifetime)
	}
}

func TestLoad_ValidationFails(t *testing.T) {
	// 设置无效的环境变量
	os.Setenv("APP_SERVER_PORT", "99999") // 超出端口范围
	defer os.Unsetenv("APP_SERVER_PORT")

	// 加载配置应失败（验证失败）
	_, err := Load()
	if err == nil {
		t.Error("Expected Load() to fail with invalid port, but it succeeded")
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	// 验证所有默认值
	if cfg.Server.Port != 8080 {
		t.Errorf("Expected default server.port = 8080, got %d", cfg.Server.Port)
	}
	if cfg.Database.Type != "postgres" {
		t.Errorf("Expected default database.type = postgres, got %s", cfg.Database.Type)
	}
	if cfg.Redis.Port != 6379 {
		t.Errorf("Expected default redis.port = 6379, got %d", cfg.Redis.Port)
	}
	if cfg.LLM.DefaultModel != "gpt-4o" {
		t.Errorf("Expected default llm.default_model = gpt-4o, got %s", cfg.LLM.DefaultModel)
	}

	// 验证 Logging 默认值
	if !cfg.Logging.Enabled {
		t.Error("Expected default logging.enabled = true, got false")
	}
	if cfg.Logging.Level != "info" {
		t.Errorf("Expected default logging.level = info, got %s", cfg.Logging.Level)
	}
	if cfg.Logging.Format != "json" {
		t.Errorf("Expected default logging.format = json, got %s", cfg.Logging.Format)
	}
	if cfg.Logging.MaxSize != 100 {
		t.Errorf("Expected default logging.max_size = 100, got %d", cfg.Logging.MaxSize)
	}

	// 验证 Monitoring 默认值
	if !cfg.Monitoring.MetricsEnabled {
		t.Error("Expected default monitoring.metrics_enabled = true, got false")
	}
	if cfg.Monitoring.TracingEnabled {
		t.Error("Expected default monitoring.tracing_enabled = false, got true")
	}
	if cfg.Monitoring.SampleRate != 0.1 {
		t.Errorf("Expected default monitoring.sample_rate = 0.1, got %f", cfg.Monitoring.SampleRate)
	}
}

func TestLoad_LoggingConfig(t *testing.T) {
	// 设置 Logging 相关环境变量
	os.Setenv("APP_LOGGING_ENABLED", "true")
	os.Setenv("APP_LOGGING_LEVEL", "debug")
	os.Setenv("APP_LOGGING_FORMAT", "console")
	os.Setenv("APP_LOGGING_OUTPUT", "file")
	os.Setenv("APP_LOGGING_OUTPUT_PATH", "/var/log/app.log")
	os.Setenv("APP_LOGGING_MAX_SIZE", "200")
	os.Setenv("APP_LOGGING_MAX_BACKUPS", "5")
	os.Setenv("APP_LOGGING_MAX_AGE", "14")
	os.Setenv("APP_LOGGING_COMPRESS", "false")
	defer func() {
		os.Unsetenv("APP_LOGGING_ENABLED")
		os.Unsetenv("APP_LOGGING_LEVEL")
		os.Unsetenv("APP_LOGGING_FORMAT")
		os.Unsetenv("APP_LOGGING_OUTPUT")
		os.Unsetenv("APP_LOGGING_OUTPUT_PATH")
		os.Unsetenv("APP_LOGGING_MAX_SIZE")
		os.Unsetenv("APP_LOGGING_MAX_BACKUPS")
		os.Unsetenv("APP_LOGGING_MAX_AGE")
		os.Unsetenv("APP_LOGGING_COMPRESS")
	}()

	// 加载配置
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() failed: %v", err)
	}

	// 验证 Logging 配置
	if !cfg.Logging.Enabled {
		t.Error("Expected logging.enabled = true")
	}
	if cfg.Logging.Level != "debug" {
		t.Errorf("Expected logging.level = debug, got %s", cfg.Logging.Level)
	}
	if cfg.Logging.Format != "console" {
		t.Errorf("Expected logging.format = console, got %s", cfg.Logging.Format)
	}
	if cfg.Logging.Output != "file" {
		t.Errorf("Expected logging.output = file, got %s", cfg.Logging.Output)
	}
	if cfg.Logging.OutputPath != "/var/log/app.log" {
		t.Errorf("Expected logging.output_path = /var/log/app.log, got %s", cfg.Logging.OutputPath)
	}
	if cfg.Logging.MaxSize != 200 {
		t.Errorf("Expected logging.max_size = 200, got %d", cfg.Logging.MaxSize)
	}
	if cfg.Logging.MaxBackups != 5 {
		t.Errorf("Expected logging.max_backups = 5, got %d", cfg.Logging.MaxBackups)
	}
	if cfg.Logging.MaxAge != 14 {
		t.Errorf("Expected logging.max_age = 14, got %d", cfg.Logging.MaxAge)
	}
	if cfg.Logging.Compress {
		t.Error("Expected logging.compress = false, got true")
	}
}

func TestLoad_MonitoringConfig(t *testing.T) {
	// 设置 Monitoring 相关环境变量
	os.Setenv("APP_MONITORING_METRICS_ENABLED", "true")
	os.Setenv("APP_MONITORING_METRICS_PATH", "/custom/metrics")
	os.Setenv("APP_MONITORING_METRICS_PORT", "9090")
	os.Setenv("APP_MONITORING_TRACING_ENABLED", "true")
	os.Setenv("APP_MONITORING_TRACING_TYPE", "jaeger")
	os.Setenv("APP_MONITORING_TRACING_ENDPOINT", "jaeger:4317")
	os.Setenv("APP_MONITORING_SAMPLE_RATE", "0.5")
	os.Setenv("APP_MONITORING_HEALTH_ENABLED", "true")
	os.Setenv("APP_MONITORING_HEALTH_PATH", "/custom/health")
	defer func() {
		os.Unsetenv("APP_MONITORING_METRICS_ENABLED")
		os.Unsetenv("APP_MONITORING_METRICS_PATH")
		os.Unsetenv("APP_MONITORING_METRICS_PORT")
		os.Unsetenv("APP_MONITORING_TRACING_ENABLED")
		os.Unsetenv("APP_MONITORING_TRACING_TYPE")
		os.Unsetenv("APP_MONITORING_TRACING_ENDPOINT")
		os.Unsetenv("APP_MONITORING_SAMPLE_RATE")
		os.Unsetenv("APP_MONITORING_HEALTH_ENABLED")
		os.Unsetenv("APP_MONITORING_HEALTH_PATH")
	}()

	// 加载配置
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() failed: %v", err)
	}

	// 验证 Metrics 配置
	if !cfg.Monitoring.MetricsEnabled {
		t.Error("Expected monitoring.metrics_enabled = true")
	}
	if cfg.Monitoring.MetricsPath != "/custom/metrics" {
		t.Errorf("Expected monitoring.metrics_path = /custom/metrics, got %s", cfg.Monitoring.MetricsPath)
	}
	if cfg.Monitoring.MetricsPort != 9090 {
		t.Errorf("Expected monitoring.metrics_port = 9090, got %d", cfg.Monitoring.MetricsPort)
	}

	// 验证 Tracing 配置
	if !cfg.Monitoring.TracingEnabled {
		t.Error("Expected monitoring.tracing_enabled = true")
	}
	if cfg.Monitoring.TracingType != "jaeger" {
		t.Errorf("Expected monitoring.tracing_type = jaeger, got %s", cfg.Monitoring.TracingType)
	}
	if cfg.Monitoring.TracingEndpoint != "jaeger:4317" {
		t.Errorf("Expected monitoring.tracing_endpoint = jaeger:4317, got %s", cfg.Monitoring.TracingEndpoint)
	}
	if cfg.Monitoring.SampleRate != 0.5 {
		t.Errorf("Expected monitoring.sample_rate = 0.5, got %f", cfg.Monitoring.SampleRate)
	}

	// 验证 Health 配置
	if !cfg.Monitoring.HealthEnabled {
		t.Error("Expected monitoring.health_enabled = true")
	}
	if cfg.Monitoring.HealthPath != "/custom/health" {
		t.Errorf("Expected monitoring.health_path = /custom/health, got %s", cfg.Monitoring.HealthPath)
	}
}

func TestLoad_InvalidLoggingConfig(t *testing.T) {
	tests := []struct {
		name   string
		envKey string
		envVal string
	}{
		{"invalid_enabled", "APP_LOGGING_ENABLED", "invalid"},
		{"invalid_max_size", "APP_LOGGING_MAX_SIZE", "abc"},
		{"invalid_max_backups", "APP_LOGGING_MAX_BACKUPS", "-1"},
		{"invalid_compress", "APP_LOGGING_COMPRESS", "yes"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			os.Setenv(tt.envKey, tt.envVal)
			defer os.Unsetenv(tt.envKey)

			_, err := Load()
			if err == nil {
				t.Errorf("Expected Load() to fail with invalid %s=%s", tt.envKey, tt.envVal)
			}
		})
	}
}

func TestLoad_InvalidMonitoringConfig(t *testing.T) {
	tests := []struct {
		name   string
		envKey string
		envVal string
	}{
		{"invalid_metrics_enabled", "APP_MONITORING_METRICS_ENABLED", "invalid"},
		{"invalid_tracing_enabled", "APP_MONITORING_TRACING_ENABLED", "invalid"},
		{"invalid_sample_rate", "APP_MONITORING_SAMPLE_RATE", "abc"},
		{"invalid_metrics_port", "APP_MONITORING_METRICS_PORT", "99999"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			os.Setenv(tt.envKey, tt.envVal)
			defer os.Unsetenv(tt.envKey)

			_, err := Load()
			if err == nil {
				t.Errorf("Expected Load() to fail with invalid %s=%s", tt.envKey, tt.envVal)
			}
		})
	}
}
