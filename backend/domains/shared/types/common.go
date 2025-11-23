package types

import (
	"time"
)

// Pagination 分页参数
type Pagination struct {
	Limit  int `json:"limit" query:"limit"`
	Offset int `json:"offset" query:"offset"`
}

// Validate 验证分页参数
func (p *Pagination) Validate() error {
	if p.Limit <= 0 {
		p.Limit = 20 // 默认每页 20 条
	}
	if p.Limit > 100 {
		p.Limit = 100 // 最多每页 100 条
	}
	if p.Offset < 0 {
		p.Offset = 0
	}
	return nil
}

// PaginatedResponse 分页响应
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	TotalCount int         `json:"total_count"`
	Limit      int         `json:"limit"`
	Offset     int         `json:"offset"`
	HasMore    bool        `json:"has_more"`
}

// NewPaginatedResponse 创建分页响应
func NewPaginatedResponse(data interface{}, totalCount int, pagination Pagination) *PaginatedResponse {
	return &PaginatedResponse{
		Data:       data,
		TotalCount: totalCount,
		Limit:      pagination.Limit,
		Offset:     pagination.Offset,
		HasMore:    pagination.Offset+pagination.Limit < totalCount,
	}
}

// UserContext 用户上下文
//
// 包含当前请求的用户信息
type UserContext struct {
	UserID   string   `json:"user_id"`
	Username string   `json:"username"`
	Email    string   `json:"email"`
	Roles    []string `json:"roles"`
}

// HasRole 检查用户是否有指定角色
func (u *UserContext) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
}

// IsAdmin 检查用户是否是管理员
func (u *UserContext) IsAdmin() bool {
	return u.HasRole("admin")
}

// TimeRange 时间范围
type TimeRange struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

// Validate 验证时间范围
func (t *TimeRange) Validate() error {
	if !t.EndTime.IsZero() && t.EndTime.Before(t.StartTime) {
		return ErrInvalidTimeRange
	}
	return nil
}

// Duration 计算时间范围的持续时间
func (t *TimeRange) Duration() time.Duration {
	if t.EndTime.IsZero() {
		return time.Since(t.StartTime)
	}
	return t.EndTime.Sub(t.StartTime)
}

// RequestMetadata 请求元数据
//
// 包含请求的追踪信息
type RequestMetadata struct {
	RequestID string    `json:"request_id"`
	TraceID   string    `json:"trace_id"`
	UserID    string    `json:"user_id"`
	ClientIP  string    `json:"client_ip"`
	UserAgent string    `json:"user_agent"`
	StartTime time.Time `json:"start_time"`
}

// Duration 计算请求持续时间
func (m *RequestMetadata) Duration() time.Duration {
	return time.Since(m.StartTime)
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// SuccessResponse 成功响应
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// NewSuccessResponse 创建成功响应
func NewSuccessResponse(message string, data interface{}) *SuccessResponse {
	return &SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}

// NewErrorResponse 创建错误响应
func NewErrorResponse(code, message, details string) *ErrorResponse {
	return &ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// 常见错误
var (
	ErrInvalidTimeRange = NewError("INVALID_TIME_RANGE", "end time cannot be before start time")
	ErrUnauthorized     = NewError("UNAUTHORIZED", "unauthorized access")
	ErrForbidden        = NewError("FORBIDDEN", "forbidden access")
	ErrNotFound         = NewError("NOT_FOUND", "resource not found")
	ErrInternalError    = NewError("INTERNAL_ERROR", "internal server error")
)

// Error 自定义错误类型
type Error struct {
	Code    string
	Message string
}

func (e *Error) Error() string {
	return e.Message
}

// NewError 创建新的错误
func NewError(code, message string) *Error {
	return &Error{
		Code:    code,
		Message: message,
	}
}
