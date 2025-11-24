package middleware

import (
	"context"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/service"
)

// AuthMiddleware 认证中间件
//
// 验证请求中的 Bearer Token
//
// 使用 JWT Service 验证 Token 的有效性
type AuthMiddleware struct {
	jwtService *service.JWTService
}

// NewAuthMiddleware 创建认证中间件
//
// 参数：
//   - jwtService: JWT 服务（用于验证 Token）
//
// 返回：
//   - *AuthMiddleware: 认证中间件实例
func NewAuthMiddleware(jwtService *service.JWTService) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
	}
}

// Handle 处理认证
//
// 验证 JWT Token 并提取用户 ID
//
// Example:
//
//	authMW := NewAuthMiddleware(jwtService)
//	router.Use(authMW.Handle())
func (m *AuthMiddleware) Handle() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		// 1. 从 Header 中获取 Token
		authHeader := string(c.GetHeader("Authorization"))

		if authHeader == "" {
			c.JSON(401, utils.H{
				"error":   "UNAUTHORIZED",
				"message": "缺少 Authorization 请求头",
			})
			c.Abort()
			return
		}

		// 2. 解析 Bearer Token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == authHeader {
			c.JSON(401, utils.H{
				"error":   "UNAUTHORIZED",
				"message": "Authorization 格式无效（应为 Bearer <token>）",
			})
			c.Abort()
			return
		}

		// 3. 验证 JWT Token
		claims, err := m.jwtService.VerifyAccessToken(token)
		if err != nil {
			c.JSON(401, utils.H{
				"error":   "INVALID_TOKEN",
				"message": "Token 无效或已过期",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// 4. 提取用户 ID 并存储到上下文
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)

		c.Next(ctx)
	}
}

// OptionalAuth 可选认证中间件
//
// 如果有 Token 则验证，没有 Token 则放行
//
// 用途：支持匿名访问的接口，但可以识别已登录用户
func (m *AuthMiddleware) OptionalAuth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		authHeader := string(c.GetHeader("Authorization"))

		if authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token != authHeader {
				// 验证 JWT Token
				claims, err := m.jwtService.VerifyAccessToken(token)
				if err == nil {
					// Token 有效，提取用户信息
					c.Set("user_id", claims.UserID)
					c.Set("email", claims.Email)
				}
				// Token 无效时，不阻止请求，继续放行
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
