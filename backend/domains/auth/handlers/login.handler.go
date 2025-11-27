package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/http/dto"
)

// LoginHandler 用户登录 Handler
//
// 对应用例：Login
// HTTP Method: POST
// HTTP Path: /api/auth/login
// 认证：不需要
//
// Handler 职责（瘦层）：
//   - 解析 HTTP 请求
//   - 转换 DTO（使用转换层）
//   - 调用 Domain Service
//   - 转换响应（使用转换层）
func (deps *HandlerDependencies) LoginHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 解析请求
	var req dto.LoginRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 2. 转换为 Domain Input（使用转换层）
	input := toLoginInput(req)

	// 3. 调用 Domain Service
	output, err := deps.authService.Login(ctx, input)
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 4. 转换为 HTTP 响应（使用转换层）
	c.JSON(200, toLoginResponse(output))
}
