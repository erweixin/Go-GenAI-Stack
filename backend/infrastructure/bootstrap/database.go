package bootstrap

import (
	"context"
	"fmt"
	"log"

	"github.com/erweixin/go-genai-stack/backend/infrastructure/config"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/persistence"

	// 导入数据库提供者（自动注册）
	_ "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/mysql"
	_ "github.com/erweixin/go-genai-stack/backend/infrastructure/persistence/postgres"
)

// InitDatabase 初始化数据库连接
//
// 根据配置自动选择对应的数据库提供者（PostgreSQL、MySQL 等）。
// 用户只需在配置中指定 database.type 即可切换数据库。
//
// 支持的数据库：
//   - postgres: PostgreSQL
//   - mysql: MySQL/MariaDB
//   - sqlite: SQLite（待实现）
//
// Example:
//
//	provider, err := InitDatabase(ctx, cfg)
//	db := provider.DB()  // 获取标准 *sql.DB
func InitDatabase(ctx context.Context, cfg *config.Config) (persistence.DatabaseProvider, error) {
	// 构建数据库配置
	providerConfig := &persistence.Config{
		Type:            cfg.Database.Type,
		Host:            cfg.Database.Host,
		Port:            cfg.Database.Port,
		User:            cfg.Database.User,
		Password:        cfg.Database.Password,
		Database:        cfg.Database.Database,
		MaxOpenConns:    cfg.Database.MaxOpenConns,
		MaxIdleConns:    cfg.Database.MaxIdleConns,
		ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
		ConnMaxIdleTime: cfg.Database.ConnMaxIdleTime,
		Options:         cfg.Database.Options,
	}

	// 添加数据库特定选项
	if providerConfig.Options == nil {
		providerConfig.Options = make(map[string]string)
	}

	// PostgreSQL 特定选项
	if cfg.Database.Type == "postgres" && cfg.Database.SSLMode != "" {
		providerConfig.Options["sslmode"] = cfg.Database.SSLMode
	}

	// 创建数据库提供者
	log.Printf("   Using database type: %s", providerConfig.Type)
	provider, err := persistence.NewProvider(providerConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create database provider: %w", err)
	}

	// 连接数据库
	if err := provider.Connect(ctx); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return provider, nil
}
