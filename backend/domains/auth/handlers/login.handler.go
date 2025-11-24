package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/service"
)

// LoginHandler 用户登录 Handler
//
// 对应用例：Login
// HTTP Method: POST
// HTTP Path: /api/auth/login
// 认证：不需要
//
// 职责：
//   - 解析 HTTP 请求
//   - 调用 Domain Service 验证用户并登录
//   - 返回 HTTP 响应
func (deps *HandlerDependencies) LoginHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 解析请求
	var req dto.LoginRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 2. 调用 Domain Service
	output, err := deps.authService.Login(ctx, service.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 返回响应
	response := dto.LoginResponse{
		UserID:       output.UserID,
		Email:        output.Email,
		AccessToken:  output.AccessToken,
		RefreshToken: output.RefreshToken,
		ExpiresIn:    output.ExpiresIn,
	}

	c.JSON(200, response)
}

