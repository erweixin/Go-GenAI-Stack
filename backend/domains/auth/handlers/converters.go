package handlers

import (
	"github.com/erweixin/go-genai-stack/backend/domains/auth/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/auth/service"
)

// DTO 转换层
//
// 职责：
// - HTTP DTO ↔ Domain Input/Output 的转换
// - 简化 Handler 层逻辑
//
// 命名规范：
// - toXxxInput:    HTTP DTO → Domain Input
// - toXxxResponse: Domain Output → HTTP Response

// ========================================
// Register 转换
// ========================================

// toRegisterInput 将 HTTP 请求转换为 Domain Input
func toRegisterInput(req dto.RegisterRequest) service.RegisterInput {
	return service.RegisterInput{
		Email:    req.Email,
		Password: req.Password,
		Username: req.Username,
		FullName: req.FullName,
	}
}

// toRegisterResponse 将 Domain Output 转换为 HTTP 响应
func toRegisterResponse(output *service.RegisterOutput) dto.RegisterResponse {
	return dto.RegisterResponse{
		UserID:       output.UserID,
		Email:        output.Email,
		AccessToken:  output.AccessToken,
		RefreshToken: output.RefreshToken,
		ExpiresIn:    output.ExpiresIn,
	}
}

// ========================================
// Login 转换
// ========================================

// toLoginInput 将 HTTP 请求转换为 Domain Input
func toLoginInput(req dto.LoginRequest) service.LoginInput {
	return service.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	}
}

// toLoginResponse 将 Domain Output 转换为 HTTP 响应
func toLoginResponse(output *service.LoginOutput) dto.LoginResponse {
	return dto.LoginResponse{
		UserID:       output.UserID,
		Email:        output.Email,
		AccessToken:  output.AccessToken,
		RefreshToken: output.RefreshToken,
		ExpiresIn:    output.ExpiresIn,
	}
}

// ========================================
// RefreshToken 转换
// ========================================

// toRefreshTokenInput 将 HTTP 请求转换为 Domain Input
func toRefreshTokenInput(req dto.RefreshTokenRequest) service.RefreshTokenInput {
	return service.RefreshTokenInput{
		RefreshToken: req.RefreshToken,
	}
}

// toRefreshTokenResponse 将 Domain Output 转换为 HTTP 响应
func toRefreshTokenResponse(output *service.RefreshTokenOutput) dto.RefreshTokenResponse {
	return dto.RefreshTokenResponse{
		AccessToken:  output.AccessToken,
		RefreshToken: output.RefreshToken,
		ExpiresIn:    output.ExpiresIn,
	}
}
