package bootstrap

import (
	"context"

	"github.com/erweixin/go-genai-stack/infrastructure/config"
	"github.com/erweixin/go-genai-stack/infrastructure/persistence/postgres"
)

// InitDatabase 初始化数据库连接
//
// 负责将配置转换为数据库连接实例
func InitDatabase(ctx context.Context, cfg *config.Config) (*postgres.Connection, error) {
	pgConfig := &postgres.Config{
		Host:            cfg.Database.Host,
		Port:            cfg.Database.Port,
		User:            cfg.Database.User,
		Password:        cfg.Database.Password,
		Database:        cfg.Database.Database,
		SSLMode:         cfg.Database.SSLMode,
		MaxOpenConns:    cfg.Database.MaxOpenConns,
		MaxIdleConns:    cfg.Database.MaxIdleConns,
		ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
		ConnMaxIdleTime: cfg.Database.ConnMaxIdleTime,
	}

	return postgres.NewConnection(ctx, pgConfig)
}
