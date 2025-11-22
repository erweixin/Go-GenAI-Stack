package middleware

import (
	"context"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
)

// AuthMiddleware 认证中间件
//
// 验证请求中的 JWT Token
type AuthMiddleware struct {
	// TODO: 添加 JWT 验证逻辑
	// jwtSecret string
}

// NewAuthMiddleware 创建认证中间件
func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{}
}

// Handle 处理认证
//
// Example:
//
//	authMW := NewAuthMiddleware()
//	router.Use(authMW.Handle())
func (m *AuthMiddleware) Handle() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		// 从 Header 中获取 Token
		authHeader := string(c.GetHeader("Authorization"))

		if authHeader == "" {
			c.JSON(401, utils.H{
				"error": "missing authorization header",
			})
			c.Abort()
			return
		}

		// 解析 Bearer Token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(401, utils.H{
				"error": "invalid authorization format",
			})
			c.Abort()
			return
		}

		// TODO: 验证 JWT Token
		// claims, err := validateJWT(token, m.jwtSecret)
		// if err != nil {
		//     c.JSON(401, utils.H{"error": "invalid token"})
		//     c.Abort()
		//     return
		// }

		// 临时实现：直接将 token 作为 user_id
		// 生产环境应该验证 JWT 并提取 claims
		c.Set("user_id", token)

		c.Next(ctx)
	}
}

// OptionalAuth 可选认证中间件
//
// 如果有 Token 则验证，没有 Token 则放行
func (m *AuthMiddleware) OptionalAuth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		authHeader := string(c.GetHeader("Authorization"))

		if authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token != authHeader {
				// TODO: 验证 JWT Token
				c.Set("user_id", token)
			}
		}

		c.Next(ctx)
	}
}

// GetUserID 从上下文中获取用户 ID
func GetUserID(c *app.RequestContext) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}

	userIDStr, ok := userID.(string)
	return userIDStr, ok
}

// RequireUserID 要求用户 ID 存在
func RequireUserID(c *app.RequestContext) (string, error) {
	userID, exists := GetUserID(c)
	if !exists {
		return "", ErrUnauthorized
	}
	return userID, nil
}

