package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	chatpo "github.com/erweixin/go-genai-stack/backend/domains/chat/internal/po"
)

// 注意：本文件为兼容性保留
// 推荐使用新的 infrastructure/persistence/postgres 包
// 该包提供了更完善的连接管理、事务处理等功能

// Config 数据库配置
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// DefaultConfig 默认配置（用于开发）
func DefaultConfig() *Config {
	return &Config{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "postgres",
		DBName:   "go_genai_stack",
		SSLMode:  "disable",
	}
}

// NewDB 创建数据库连接
func NewDB(config *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		config.Host,
		config.Port,
		config.User,
		config.Password,
		config.DBName,
		config.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	log.Println("✅ Database connected successfully")
	return db, nil
}

// AutoMigrate 自动迁移表结构
func AutoMigrate(db *gorm.DB) error {
	log.Println("🔄 Running database migrations...")

	// Chat Domain 表
	err := db.AutoMigrate(
		&chatpo.ConversationPO{},
		&chatpo.MessagePO{},
	)

	if err != nil {
		return fmt.Errorf("failed to migrate: %w", err)
	}

	log.Println("✅ Database migrations completed")
	return nil
}

// InitDB 初始化数据库（开发环境使用）
func InitDB() (*gorm.DB, error) {
	config := DefaultConfig()
	db, err := NewDB(config)
	if err != nil {
		return nil, err
	}

	// 自动迁移表结构
	err = AutoMigrate(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}
