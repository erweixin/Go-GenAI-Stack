package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// GetUserProfileHandler 获取用户资料 Handler
//
// 对应用例：GetUserProfile
// HTTP Method: GET
// HTTP Path: /api/users/me
// 认证：必需
//
// Handler 职责（瘦层）：
//   - 从 JWT Token 中获取用户 ID
//   - 转换 DTO（使用转换层）
//   - 调用 Domain Service
//   - 转换响应（使用转换层）
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

	// 2. 转换为 Domain Input（使用转换层）
	input := toGetUserProfileInput(userID)

	// 3. 调用 Domain Service
	output, err := deps.userService.GetUserProfile(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 4. 转换为 HTTP 响应（使用转换层）
	c.JSON(200, toGetUserProfileResponse(output))
}

