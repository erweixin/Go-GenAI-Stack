package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/erweixin/go-genai-stack/backend/domains/user/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/user/service"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// GetUserProfileHandler 获取用户资料 Handler
//
// 对应用例：GetUserProfile
// HTTP Method: GET
// HTTP Path: /api/users/me
// 认证：必需
//
// 职责：
//   - 从 JWT Token 中获取用户 ID
//   - 调用 Domain Service 获取用户资料
//   - 转换为 HTTP 响应
func (deps *HandlerDependencies) GetUserProfileHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 从认证中间件获取用户 ID
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		c.JSON(401, utils.H{
			"error": "UNAUTHORIZED",
			"message": "未授权访问",
		})
		return
	}

	// 2. 调用 Domain Service
	output, err := deps.userService.GetUserProfile(ctx, service.GetUserProfileInput{
		UserID: userID,
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 转换为 HTTP 响应
	user := output.User
	response := dto.GetUserProfileResponse{
		UserID:        user.ID,
		Email:         user.Email,
		Username:      user.Username,
		FullName:      user.FullName,
		AvatarURL:     user.AvatarURL,
		Status:        string(user.Status),
		EmailVerified: user.EmailVerified,
		CreatedAt:     user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	// 处理可选字段
	if user.LastLoginAt != nil {
		lastLogin := user.LastLoginAt.Format("2006-01-02T15:04:05Z07:00")
		response.LastLoginAt = &lastLogin
	}

	c.JSON(200, response)
}

