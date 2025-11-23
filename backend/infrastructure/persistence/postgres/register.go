package postgres

import (
	"github.com/erweixin/go-genai-stack/infrastructure/persistence"
)

// init 自动注册 PostgreSQL 提供者到全局工厂
func init() {
	persistence.DefaultFactory.Register("postgres", NewProvider)
}
