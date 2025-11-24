package mysql

import (
	"github.com/erweixin/go-genai-stack/backend/infrastructure/persistence"
)

// init 自动注册 MySQL 提供者到全局工厂
func init() {
	persistence.DefaultFactory.Register("mysql", NewProvider)
}
