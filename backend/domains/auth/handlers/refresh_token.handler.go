package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/service"
)

// RefreshTokenHandler 刷新 Token Handler
//
// 对应用例：RefreshToken
// HTTP Method: POST
// HTTP Path: /api/auth/refresh
// 认证：不需要
//
// 职责：
//   - 解析 HTTP 请求
//   - 调用 Domain Service 刷新 Token
//   - 返回 HTTP 响应
func (deps *HandlerDependencies) RefreshTokenHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 解析请求
	var req dto.RefreshTokenRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 2. 调用 Domain Service
	output, err := deps.authService.RefreshToken(ctx, service.RefreshTokenInput{
		RefreshToken: req.RefreshToken,
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 返回响应
	response := dto.RefreshTokenResponse{
		AccessToken:  output.AccessToken,
		RefreshToken: output.RefreshToken,
		ExpiresIn:    output.ExpiresIn,
	}

	c.JSON(200, response)
}

