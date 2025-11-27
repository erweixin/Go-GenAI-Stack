package service

import (
	"context"
	"fmt"

	"github.com/erweixin/go-genai-stack/backend/domains/user/model"
	"github.com/erweixin/go-genai-stack/backend/domains/user/repository"
)

// AuthService 认证服务
//
// 职责：
//   - 实现用户注册和登录逻辑
//   - 调用 User Domain 创建和验证用户
//   - 生成和管理 JWT Token
type AuthService struct {
	userRepo   repository.UserRepository
	jwtService *JWTService
}

// NewAuthService 创建认证服务
//
// 参数：
//   - userRepo: 用户仓储
//   - jwtService: JWT 服务
//
// 返回：
//   - *AuthService: 认证服务实例
func NewAuthService(userRepo repository.UserRepository, jwtService *JWTService) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

// RegisterInput 注册输入
type RegisterInput struct {
	Email    string
	Password string
	Username string // 可选
	FullName string // 可选
}

// RegisterOutput 注册输出
type RegisterOutput struct {
	UserID       string
	Email        string
	AccessToken  string
	RefreshToken string
	ExpiresIn    int // 秒
}

// Register 用户注册（用例实现）
//
// 对应 usecases.yaml 中的 Register
//
// 步骤：
//  1. ValidateInput - 验证输入参数
//  2. CheckEmailExists - 检查邮箱是否已被注册
//  3. CheckUsernameExists - 检查用户名是否已被占用（如果提供）
//  4. CreateUser - 创建用户实体
//  5. SaveUser - 保存用户到数据库
//  6. GenerateTokens - 生成 JWT Token
//  7. PublishUserCreatedEvent - 发布用户创建事件（扩展点）
//
// 参数：
//   - ctx: 上下文
//   - input: 输入参数
//
// 返回：
//   - *RegisterOutput: 注册结果
//   - error: 错误信息
func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*RegisterOutput, error) {
	// Step 1: 验证输入（由 Model 层的验证逻辑处理）

	// Step 2: 检查邮箱是否已被注册
	exists, err := s.userRepo.ExistsByEmail(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("检查邮箱失败: %w", err)
	}
	if exists {
		return nil, model.ErrEmailAlreadyExists
	}

	// Step 3: 检查用户名是否已被占用（如果提供）
	if input.Username != "" {
		exists, err := s.userRepo.ExistsByUsername(ctx, input.Username)
		if err != nil {
			return nil, fmt.Errorf("检查用户名失败: %w", err)
		}
		if exists {
			return nil, model.ErrUsernameAlreadyExists
		}
	}

	// Step 4: 创建用户实体（调用 User Domain）
	user, err := model.NewUser(input.Email, input.Password)
	if err != nil {
		return nil, fmt.Errorf("创建用户失败: %w", err)
	}

	// 设置可选字段
	if input.Username != "" || input.FullName != "" {
		err = user.UpdateProfile(input.Username, input.FullName, "")
		if err != nil {
			return nil, fmt.Errorf("设置用户资料失败: %w", err)
		}
	}

	// Step 5: 保存用户到数据库
	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("保存用户失败: %w", err)
	}

	// Step 6: 生成 JWT Token
	accessToken, expiresAt, err := s.jwtService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, fmt.Errorf("生成 Access Token 失败: %w", err)
	}

	refreshToken, _, err := s.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("生成 Refresh Token 失败: %w", err)
	}

	// Step 7: 发布用户创建事件（扩展点）
	// eventBus.Publish(ctx, UserCreatedEvent{...})

	return &RegisterOutput{
		UserID:       user.ID,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(expiresAt.Sub(expiresAt.Add(-s.jwtService.accessTokenExpiry)).Seconds()),
	}, nil
}

// LoginInput 登录输入
type LoginInput struct {
	Email    string
	Password string
}

// LoginOutput 登录输出
type LoginOutput struct {
	UserID       string
	Email        string
	AccessToken  string
	RefreshToken string
	ExpiresIn    int // 秒
}

// Login 用户登录（用例实现）
//
// 对应 usecases.yaml 中的 Login
//
// 步骤：
//  1. ValidateInput - 验证输入参数
//  2. GetUserByEmail - 根据邮箱获取用户
//  3. VerifyPassword - 验证密码
//  4. CheckUserStatus - 检查用户状态
//  5. GenerateTokens - 生成 JWT Token
//  6. RecordLoginTime - 记录最后登录时间
//  7. PublishLoginSucceededEvent - 发布登录成功事件（扩展点）
//
// 参数：
//   - ctx: 上下文
//   - input: 输入参数
//
// 返回：
//   - *LoginOutput: 登录结果
//   - error: 错误信息
func (s *AuthService) Login(ctx context.Context, input LoginInput) (*LoginOutput, error) {
	// Step 1: 验证输入（由 Model 层的验证逻辑处理）

	// Step 2: 根据邮箱获取用户
	user, err := s.userRepo.GetByEmail(ctx, input.Email)
	if err != nil {
		// 统一返回错误消息，不泄露是邮箱还是密码错误
		return nil, fmt.Errorf("INVALID_CREDENTIALS: 邮箱或密码错误")
	}

	// Step 3: 验证密码
	if !user.VerifyPassword(input.Password) {
		// 统一返回错误消息
		return nil, fmt.Errorf("INVALID_CREDENTIALS: 邮箱或密码错误")
	}

	// Step 4: 检查用户状态
	if err := user.CanLogin(); err != nil {
		return nil, err
	}

	// Step 5: 生成 JWT Token
	accessToken, expiresAt, err := s.jwtService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, fmt.Errorf("生成 Access Token 失败: %w", err)
	}

	refreshToken, _, err := s.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("生成 Refresh Token 失败: %w", err)
	}

	// Step 6: 记录最后登录时间
	user.RecordLogin()
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		// 记录失败不影响登录
		// logger.Warn("更新登录时间失败", zap.Error(err))
	}

	// Step 7: 发布登录成功事件（扩展点）
	// eventBus.Publish(ctx, LoginSucceededEvent{...})

	return &LoginOutput{
		UserID:       user.ID,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(expiresAt.Sub(expiresAt.Add(-s.jwtService.accessTokenExpiry)).Seconds()),
	}, nil
}

// RefreshTokenInput 刷新 Token 输入
type RefreshTokenInput struct {
	RefreshToken string
}

// RefreshTokenOutput 刷新 Token 输出
type RefreshTokenOutput struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int // 秒
}

// RefreshToken 刷新 Token（用例实现）
//
// 对应 usecases.yaml 中的 RefreshToken
//
// 步骤：
//  1. ValidateRefreshToken - 验证 Refresh Token
//  2. GetUserByID - 获取用户信息
//  3. CheckUserStatus - 检查用户状态
//  4. GenerateNewTokens - 生成新的 Access Token 和 Refresh Token
//
// 参数：
//   - ctx: 上下文
//   - input: 输入参数
//
// 返回：
//   - *RefreshTokenOutput: 刷新结果
//   - error: 错误信息
func (s *AuthService) RefreshToken(ctx context.Context, input RefreshTokenInput) (*RefreshTokenOutput, error) {
	// Step 1: 验证 Refresh Token
	claims, err := s.jwtService.VerifyRefreshToken(input.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("INVALID_REFRESH_TOKEN: Refresh Token 无效或已过期")
	}

	// Step 2: 获取用户信息
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("用户不存在: %w", err)
	}

	// Step 3: 检查用户状态
	if err := user.CanLogin(); err != nil {
		return nil, err
	}

	// Step 4: 生成新的 Access Token 和 Refresh Token
	accessToken, expiresAt, err := s.jwtService.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, fmt.Errorf("生成 Access Token 失败: %w", err)
	}

	refreshToken, _, err := s.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("生成 Refresh Token 失败: %w", err)
	}

	return &RefreshTokenOutput{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(expiresAt.Sub(expiresAt.Add(-s.jwtService.accessTokenExpiry)).Seconds()),
	}, nil
}
