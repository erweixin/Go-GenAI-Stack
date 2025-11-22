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
	// 1. 设置默认配置
	config := DefaultConfig()

	// 2. 加载配置文件（如果指定）
	if configPath != "" {
		l.viper.SetConfigFile(configPath)
		if err := l.viper.ReadInConfig(); err != nil {
			// 配置文件不存在不算错误
			if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
				return nil, fmt.Errorf("failed to read config file: %w", err)
			}
		}
	}

	// 3. 从环境变量读取（覆盖配置文件）
	l.setupEnvBindings()

	// 4. 解析配置到结构体
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

	// 手动绑定关键配置（确保环境变量生效）
	envBindings := []string{
		"server.host",
		"server.port",
		"database.host",
		"database.port",
		"database.user",
		"database.password",
		"database.database",
		"redis.host",
		"redis.port",
		"redis.password",
		"llm.default_model",
		"llm.default_provider",
	}

	for _, binding := range envBindings {
		_ = l.viper.BindEnv(binding)
	}
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

