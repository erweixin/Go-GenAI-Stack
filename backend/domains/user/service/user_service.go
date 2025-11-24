package service

import (
	"context"
	"fmt"

	"github.com/erweixin/go-genai-stack/backend/domains/user/model"
	"github.com/erweixin/go-genai-stack/backend/domains/user/repository"
)

// UserService 用户领域服务
//
// 职责：
// - 封装用户领域的业务逻辑
// - 协调用户实体和仓储
// - 实现用户管理的业务流程
type UserService struct {
	userRepo repository.UserRepository
}

// NewUserService 创建用户领域服务
//
// 参数：
//   - userRepo: 用户仓储
//
// 返回：
//   - *UserService: 用户领域服务实例
func NewUserService(userRepo repository.UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// GetUserProfileInput 获取用户资料输入
type GetUserProfileInput struct {
	UserID string
}

// GetUserProfileOutput 获取用户资料输出
type GetUserProfileOutput struct {
	User *model.User
}

// GetUserProfile 获取用户资料（用例实现）
//
// 对应 usecases.yaml 中的 GetUserProfile
//
// 步骤：
//  1. GetUserFromDB - 从数据库获取用户信息
//  2. FormatResponse - 格式化响应数据
//
// 参数：
//   - ctx: 上下文
//   - input: 输入参数
//
// 返回：
//   - *GetUserProfileOutput: 用户资料
//   - error: 错误信息
func (s *UserService) GetUserProfile(ctx context.Context, input GetUserProfileInput) (*GetUserProfileOutput, error) {
	// Step 1: 从数据库获取用户
	user, err := s.userRepo.GetByID(ctx, input.UserID)
	if err != nil {
		return nil, fmt.Errorf("获取用户失败: %w", err)
	}

	// Step 2: 返回用户信息（不包含敏感字段）
	return &GetUserProfileOutput{
		User: user,
	}, nil
}

// UpdateUserProfileInput 更新用户资料输入
type UpdateUserProfileInput struct {
	UserID    string
	Username  string // 可选
	FullName  string // 可选
	AvatarURL string // 可选
}

// UpdateUserProfileOutput 更新用户资料输出
type UpdateUserProfileOutput struct {
	User *model.User
}

// UpdateUserProfile 更新用户资料（用例实现）
//
// 对应 usecases.yaml 中的 UpdateUserProfile
//
// 步骤：
//  1. ValidateInput - 验证输入参数
//  2. GetUser - 获取用户
//  3. CheckUsernameUnique - 检查用户名是否已被占用（如果修改了用户名）
//  4. UpdateUserFields - 更新用户字段
//  5. SaveUser - 保存用户
//  6. PublishUserUpdatedEvent - 发布用户更新事件（扩展点）
//
// 参数：
//   - ctx: 上下文
//   - input: 输入参数
//
// 返回：
//   - *UpdateUserProfileOutput: 更新后的用户资料
//   - error: 错误信息
func (s *UserService) UpdateUserProfile(ctx context.Context, input UpdateUserProfileInput) (*UpdateUserProfileOutput, error) {
	// Step 1: 验证输入（由 Model 层的验证逻辑处理）

	// Step 2: 获取用户
	user, err := s.userRepo.GetByID(ctx, input.UserID)
	if err != nil {
		return nil, fmt.Errorf("获取用户失败: %w", err)
	}

	// Step 3: 检查用户名是否已被占用（如果修改了用户名）
	if input.Username != "" && input.Username != user.Username {
		exists, err := s.userRepo.ExistsByUsername(ctx, input.Username)
		if err != nil {
			return nil, fmt.Errorf("检查用户名失败: %w", err)
		}
		if exists {
			return nil, model.ErrUsernameAlreadyExists
		}
	}

	// Step 4: 更新用户字段
	err = user.UpdateProfile(input.Username, input.FullName, input.AvatarURL)
	if err != nil {
		return nil, fmt.Errorf("更新用户资料失败: %w", err)
	}

	// Step 5: 保存用户
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("保存用户失败: %w", err)
	}

	// Step 6: 发布用户更新事件（扩展点）
	// eventBus.Publish(ctx, UserUpdatedEvent{...})

	return &UpdateUserProfileOutput{
		User: user,
	}, nil
}

// ChangePasswordInput 修改密码输入
type ChangePasswordInput struct {
	UserID      string
	OldPassword string
	NewPassword string
}

// ChangePasswordOutput 修改密码输出
type ChangePasswordOutput struct {
	Success bool
	Message string
}

// ChangePassword 修改密码（用例实现）
//
// 对应 usecases.yaml 中的 ChangePassword
//
// 步骤：
//  1. ValidateInput - 验证输入
//  2. GetUser - 获取用户
//  3. VerifyOldPassword - 验证旧密码
//  4. HashNewPassword - 哈希新密码（由 Model 层处理）
//  5. UpdatePassword - 更新密码
//  6. RevokeAllTokens - 撤销所有 Token（可选，扩展点）
//
// 参数：
//   - ctx: 上下文
//   - input: 输入参数
//
// 返回：
//   - *ChangePasswordOutput: 修改结果
//   - error: 错误信息
func (s *UserService) ChangePassword(ctx context.Context, input ChangePasswordInput) (*ChangePasswordOutput, error) {
	// Step 1: 验证输入（密码强度由 Model 层验证）

	// Step 2: 获取用户
	user, err := s.userRepo.GetByID(ctx, input.UserID)
	if err != nil {
		return nil, fmt.Errorf("获取用户失败: %w", err)
	}

	// Step 3: 验证旧密码
	if !user.VerifyPassword(input.OldPassword) {
		return nil, model.ErrInvalidPassword
	}

	// Step 4 & 5: 更新密码（包含哈希）
	err = user.UpdatePassword(input.NewPassword)
	if err != nil {
		return nil, fmt.Errorf("更新密码失败: %w", err)
	}

	// 保存到数据库
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("保存密码失败: %w", err)
	}

	// Step 6: 撤销所有 Token（扩展点）
	// 可以在 Auth Service 中实现，通过发布 PasswordChanged 事件通知

	return &ChangePasswordOutput{
		Success: true,
		Message: "密码修改成功",
	}, nil
}

