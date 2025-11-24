package model

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// UserStatus 定义用户状态
type UserStatus string

const (
	StatusActive   UserStatus = "active"
	StatusInactive UserStatus = "inactive"
	StatusBanned   UserStatus = "banned"
)

// IsValid 检查用户状态是否有效
func (s UserStatus) IsValid() bool {
	switch s {
	case StatusActive, StatusInactive, StatusBanned:
		return true
	}
	return false
}

// User 聚合根
// 包含用户的所有核心属性和业务行为
type User struct {
	ID            string
	Email         string
	Username      string // 可选
	PasswordHash  string
	FullName      string
	AvatarURL     string
	Status        UserStatus
	EmailVerified bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
	LastLoginAt   *time.Time
}

// 领域错误定义
var (
	ErrInvalidEmail         = fmt.Errorf("INVALID_EMAIL: 邮箱格式无效")
	ErrEmailAlreadyExists   = fmt.Errorf("EMAIL_ALREADY_EXISTS: 邮箱已被占用")
	ErrUsernameAlreadyExists = fmt.Errorf("USERNAME_ALREADY_EXISTS: 用户名已被占用")
	ErrInvalidUsername      = fmt.Errorf("INVALID_USERNAME: 用户名格式无效（3-30 字符，仅字母数字下划线）")
	ErrWeakPassword         = fmt.Errorf("WEAK_PASSWORD: 密码强度不足（至少 8 字符）")
	ErrPasswordTooLong      = fmt.Errorf("PASSWORD_TOO_LONG: 密码过长（最多 128 字符）")
	ErrInvalidPassword      = fmt.Errorf("INVALID_PASSWORD: 密码错误")
	ErrUserNotFound         = fmt.Errorf("USER_NOT_FOUND: 用户不存在")
	ErrUserBanned           = fmt.Errorf("USER_BANNED: 用户已被禁用")
	ErrUserInactive         = fmt.Errorf("USER_INACTIVE: 用户未激活")
	ErrFullNameTooLong      = fmt.Errorf("FULL_NAME_TOO_LONG: 全名过长（最多 100 字符）")
	ErrInvalidAvatarURL     = fmt.Errorf("INVALID_AVATAR_URL: 头像 URL 格式无效")
)

// 正则表达式
var (
	emailRegex    = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,30}$`)
)

// NewUser 创建一个新用户
//
// 参数：
//   - email: 邮箱
//   - password: 明文密码
//
// 返回：
//   - *User: 用户实体
//   - error: 错误信息
//
// 业务规则：
//   - 邮箱必须格式有效
//   - 密码至少 8 字符
//   - 密码使用 bcrypt 哈希存储
//   - 初始状态为 Inactive（需要邮箱验证）
func NewUser(email, password string) (*User, error) {
	// 验证邮箱
	email = normalizeEmail(email)
	if !isValidEmail(email) {
		return nil, ErrInvalidEmail
	}

	// 验证密码
	if err := validatePassword(password); err != nil {
		return nil, err
	}

	// 哈希密码
	passwordHash, err := hashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("密码哈希失败: %w", err)
	}

	now := time.Now()
	return &User{
		ID:            uuid.New().String(),
		Email:         email,
		Username:      "", // 可选，用户可以后续设置
		PasswordHash:  passwordHash,
		FullName:      "",
		AvatarURL:     "",
		Status:        StatusInactive, // 初始状态为未激活
		EmailVerified: false,
		CreatedAt:     now,
		UpdatedAt:     now,
		LastLoginAt:   nil,
	}, nil
}

// VerifyPassword 验证密码
//
// 参数：
//   - password: 待验证的明文密码
//
// 返回：
//   - bool: 密码是否正确
func (u *User) VerifyPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// UpdatePassword 更新密码
//
// 参数：
//   - newPassword: 新密码（明文）
//
// 返回：
//   - error: 错误信息
//
// 业务规则：
//   - 新密码必须符合强度要求
func (u *User) UpdatePassword(newPassword string) error {
	// 验证新密码
	if err := validatePassword(newPassword); err != nil {
		return err
	}

	// 哈希新密码
	passwordHash, err := hashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("密码哈希失败: %w", err)
	}

	u.PasswordHash = passwordHash
	u.UpdatedAt = time.Now()
	return nil
}

// UpdateProfile 更新用户资料
//
// 参数：
//   - username: 用户名（可选）
//   - fullName: 全名（可选）
//   - avatarURL: 头像 URL（可选）
//
// 返回：
//   - error: 错误信息
func (u *User) UpdateProfile(username, fullName, avatarURL string) error {
	// 验证用户名（如果提供）
	if username != "" {
		if !isValidUsername(username) {
			return ErrInvalidUsername
		}
		u.Username = username
	}

	// 验证全名
	if fullName != "" {
		if len(fullName) > 100 {
			return ErrFullNameTooLong
		}
		u.FullName = fullName
	}

	// 验证头像 URL（如果提供）
	if avatarURL != "" {
		// 简单的 URL 验证（可以使用 url.Parse 进行更严格的验证）
		if !strings.HasPrefix(avatarURL, "http://") && !strings.HasPrefix(avatarURL, "https://") {
			return ErrInvalidAvatarURL
		}
		u.AvatarURL = avatarURL
	}

	u.UpdatedAt = time.Now()
	return nil
}

// Activate 激活用户
//
// 将用户状态从 Inactive 变为 Active
func (u *User) Activate() error {
	if u.Status == StatusActive {
		return nil // 已经激活，直接返回
	}

	u.Status = StatusActive
	u.EmailVerified = true
	u.UpdatedAt = time.Now()
	return nil
}

// Deactivate 禁用用户
//
// 将用户状态变为 Banned
func (u *User) Deactivate() error {
	if u.Status == StatusBanned {
		return nil // 已经禁用，直接返回
	}

	u.Status = StatusBanned
	u.UpdatedAt = time.Now()
	return nil
}

// RecordLogin 记录登录时间
func (u *User) RecordLogin() {
	now := time.Now()
	u.LastLoginAt = &now
	u.UpdatedAt = now
}

// CanLogin 检查用户是否可以登录
func (u *User) CanLogin() error {
	if u.Status == StatusBanned {
		return ErrUserBanned
	}
	// 注意：我们允许 Inactive 用户登录，但可能限制某些功能
	return nil
}

// --- 辅助函数 ---

// normalizeEmail 规范化邮箱（转为小写、去除空格）
func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// isValidEmail 验证邮箱格式
func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// isValidUsername 验证用户名格式
func isValidUsername(username string) bool {
	return usernameRegex.MatchString(username)
}

// validatePassword 验证密码强度
func validatePassword(password string) error {
	if len(password) < 8 {
		return ErrWeakPassword
	}
	if len(password) > 128 {
		return ErrPasswordTooLong
	}
	return nil
}

// hashPassword 使用 bcrypt 哈希密码
func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

