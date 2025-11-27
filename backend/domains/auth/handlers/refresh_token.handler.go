package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/http/dto"
)

// RefreshTokenHandler 刷新 Token Handler
//
// 对应用例：RefreshToken
// HTTP Method: POST
// HTTP Path: /api/auth/refresh
// 认证：不需要
//
// Handler 职责（瘦层）：
//   - 解析 HTTP 请求
//   - 转换 DTO（使用转换层）
//   - 调用 Domain Service
//   - 转换响应（使用转换层）
func (deps *HandlerDependencies) RefreshTokenHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 解析请求
	var req dto.RefreshTokenRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 2. 转换为 Domain Input（使用转换层）
	input := toRefreshTokenInput(req)

	// 3. 调用 Domain Service
	output, err := deps.authService.RefreshToken(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 4. 转换为 HTTP 响应（使用转换层）
	c.JSON(200, toRefreshTokenResponse(output))
}
