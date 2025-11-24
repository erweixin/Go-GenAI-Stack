package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/service"
)

// RegisterHandler 用户注册 Handler
//
// 对应用例：Register
// HTTP Method: POST
// HTTP Path: /api/auth/register
// 认证：不需要
//
// 职责：
//   - 解析 HTTP 请求
//   - 调用 Domain Service 注册用户
//   - 返回 HTTP 响应
func (deps *HandlerDependencies) RegisterHandler(ctx context.Context, c *app.RequestContext) {
	// 1. 解析请求
	var req dto.RegisterRequest
	if err := c.BindAndValidate(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// 2. 调用 Domain Service
	output, err := deps.authService.Register(ctx, service.RegisterInput{
		Email:    req.Email,
		Password: req.Password,
		Username: req.Username,
		FullName: req.FullName,
	})
	if err != nil {
		handleDomainError(c, err)
		return
	}

	// 3. 返回响应
	response := dto.RegisterResponse{
		UserID:       output.UserID,
		Email:        output.Email,
		AccessToken:  output.AccessToken,
		RefreshToken: output.RefreshToken,
		ExpiresIn:    output.ExpiresIn,
	}

	c.JSON(201, response)
}

