package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/user/http/dto"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// ChangePasswordHandler 修改密码 Handler
//
// 对应用例：ChangePassword
// HTTP Method: POST
// HTTP Path: /api/users/me/change-password
// 认证：必需
//
// 职责：
//   - 解析 HTTP 请求
//   - 从 JWT Token 中获取用户 ID
//   - 调用 Domain Service 修改密码
//   - 返回 HTTP 响应
func (deps *HandlerDependencies) ChangePasswordHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 获取用户 ID
	userID, err := middleware.RequireUserID(c)
	if err != nil {
		handleUnauthorized(c)
		return
	}

	// 2. 解析请求
	var req dto.ChangePasswordRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 3. 转换为 Domain Input（使用转换层）
	input := toChangePasswordInput(userID, req)

	// 4. 调用 Domain Service
	output, err := deps.userService.ChangePassword(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 5. 转换为 HTTP 响应（使用转换层）
	c.JSON(200, toChangePasswordResponse(output))
}
