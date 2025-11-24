package dto

// GetUserProfileResponse 获取用户资料响应
type GetUserProfileResponse struct {
	UserID        string  `json:"user_id"`
	Email         string  `json:"email"`
	Username      string  `json:"username,omitempty"`
	FullName      string  `json:"full_name,omitempty"`
	AvatarURL     string  `json:"avatar_url,omitempty"`
	Status        string  `json:"status"`
	EmailVerified bool    `json:"email_verified"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
	LastLoginAt   *string `json:"last_login_at,omitempty"`
}

// UpdateUserProfileRequest 更新用户资料请求
type UpdateUserProfileRequest struct {
	Username  string `json:"username,omitempty" binding:"omitempty,min=3,max=30,alphanum"`
	FullName  string `json:"full_name,omitempty" binding:"omitempty,max=100"`
	AvatarURL string `json:"avatar_url,omitempty" binding:"omitempty,url"`
}

// UpdateUserProfileResponse 更新用户资料响应
type UpdateUserProfileResponse struct {
	UserID    string `json:"user_id"`
	Username  string `json:"username,omitempty"`
	FullName  string `json:"full_name,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
	UpdatedAt string `json:"updated_at"`
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required,min=8"`
	NewPassword string `json:"new_password" binding:"required,min=8,max=128"`
}

// ChangePasswordResponse 修改密码响应
type ChangePasswordResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
