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
	if cfg.Logging.Level != "info" {
		t.Errorf("Expected default logging.level = info, got %s", cfg.Logging.Level)
	}
	if !cfg.Monitoring.Enabled {
		t.Error("Expected default monitoring.enabled = true, got false")
	}
}
