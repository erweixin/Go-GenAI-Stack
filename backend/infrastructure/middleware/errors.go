package middleware

import "fmt"

// 中间件相关错误定义
var (
	ErrUnauthorized = fmt.Errorf("unauthorized")
	ErrForbidden    = fmt.Errorf("forbidden")
	ErrRateLimited  = fmt.Errorf("rate limited")
)

