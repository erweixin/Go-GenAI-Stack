package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/user/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/user/service"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// UpdateUserProfileHandler 更新用户资料 Handler
//
// 对应用例：UpdateUserProfile
// HTTP Method: PUT
// HTTP Path: /api/users/me
// 认证：必需
//
// 职责：
//   - 解析 HTTP 请求
//   - 从 JWT Token 中获取用户 ID
//   - 调用 Domain Service 更新用户资料
//   - 返回 HTTP 响应
func (deps *HandlerDependencies) UpdateUserProfileHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 获取用户 ID
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		handleUnauthorized(c)
		return
	}

	// 2. 解析请求
	var req dto.UpdateUserProfileRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 3. 调用 Domain Service
	output, err := deps.userService.UpdateUserProfile(ctx, service.UpdateUserProfileInput{
		UserID:    userID,
		Username:  req.Username,
		FullName:  req.FullName,
		AvatarURL: req.AvatarURL,
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 4. 返回响应
	user := output.User
	response := dto.UpdateUserProfileResponse{
		UserID:    user.ID,
		Username:  user.Username,
		FullName:  user.FullName,
		AvatarURL: user.AvatarURL,
		UpdatedAt: user.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(200, response)
}

