package middleware

import (
	"context"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
)

// AuthMiddleware 认证中间件
//
// 验证请求中的 Bearer Token
//
// Extension point: 集成 JWT 验证
// 示例：使用 github.com/golang-jwt/jwt 库
//
//	type AuthMiddleware struct {
//	    jwtSecret string
//	    issuer    string
//	}
type AuthMiddleware struct {
	// jwtSecret string // JWT 密钥（可选）
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

		// Extension point: JWT Token 验证
		// 示例实现：
		//   claims, err := jwt.ParseWithClaims(token, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		//       return []byte(m.jwtSecret), nil
		//   })
		//   if err != nil || !claims.Valid {
		//       c.JSON(401, utils.H{"error": "invalid token"})
		//       c.Abort()
		//       return
		//   }
		//   c.Set("user_id", claims.UserID)
		//
		// 当前简化实现：直接将 token 作为 user_id（仅用于演示）
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
				// Extension point: JWT Token 验证（同上）
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
