package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/user/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/user/service"
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

	// 3. 调用 Domain Service
	output, err := deps.userService.ChangePassword(ctx, service.ChangePasswordInput{
		UserID:      userID,
		OldPassword: req.OldPassword,
		NewPassword: req.NewPassword,
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 4. 返回响应
	response := dto.ChangePasswordResponse{
		Success: output.Success,
		Message: output.Message,
	}

	c.JSON(200, response)
}
