package handlers

import (
	"time"

	"github.com/erweixin/go-genai-stack/backend/domains/user/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/user/service"
)

// DTO 转换层
//
// 职责：
// - HTTP DTO ↔ Domain Input/Output 的转换
// - 时间格式转换
// - 简化 Handler 层逻辑
//
// 命名规范：
// - toXxxInput:    HTTP DTO → Domain Input
// - toXxxResponse: Domain Output → HTTP Response

// ========================================
// GetUserProfile 转换
// ========================================

// toGetUserProfileInput 将用户 ID 转换为 Domain Input
func toGetUserProfileInput(userID string) service.GetUserProfileInput {
	return service.GetUserProfileInput{
		UserID: userID,
	}
}

// toGetUserProfileResponse 将 Domain Output 转换为 HTTP 响应
func toGetUserProfileResponse(output *service.GetUserProfileOutput) dto.GetUserProfileResponse {
	user := output.User

	resp := dto.GetUserProfileResponse{
		UserID:        user.ID,
		Email:         user.Email,
		Username:      user.Username,
		FullName:      user.FullName,
		AvatarURL:     user.AvatarURL,
		Status:        string(user.Status),
		EmailVerified: user.EmailVerified,
		CreatedAt:     user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     user.UpdatedAt.Format(time.RFC3339),
	}

	// 处理可选字段
	if user.LastLoginAt != nil {
		lastLogin := user.LastLoginAt.Format(time.RFC3339)
		resp.LastLoginAt = &lastLogin
	}

	return resp
}

// ========================================
// UpdateUserProfile 转换
// ========================================

// toUpdateUserProfileInput 将 HTTP 请求转换为 Domain Input
func toUpdateUserProfileInput(userID string, req dto.UpdateUserProfileRequest) service.UpdateUserProfileInput {
	return service.UpdateUserProfileInput{
		UserID:    userID,
		Username:  req.Username,
		FullName:  req.FullName,
		AvatarURL: req.AvatarURL,
	}
}

// toUpdateUserProfileResponse 将 Domain Output 转换为 HTTP 响应
func toUpdateUserProfileResponse(output *service.UpdateUserProfileOutput) dto.UpdateUserProfileResponse {
	user := output.User
	return dto.UpdateUserProfileResponse{
		UserID:    user.ID,
		Username:  user.Username,
		FullName:  user.FullName,
		AvatarURL: user.AvatarURL,
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}
}

// ========================================
// ChangePassword 转换
// ========================================

// toChangePasswordInput 将 HTTP 请求转换为 Domain Input
func toChangePasswordInput(userID string, req dto.ChangePasswordRequest) service.ChangePasswordInput {
	return service.ChangePasswordInput{
		UserID:      userID,
		OldPassword: req.OldPassword,
		NewPassword: req.NewPassword,
	}
}

// toChangePasswordResponse 将 Domain Output 转换为 HTTP 响应
func toChangePasswordResponse(output *service.ChangePasswordOutput) dto.ChangePasswordResponse {
	return dto.ChangePasswordResponse{
		Success: output.Success,
		Message: output.Message,
	}
}

