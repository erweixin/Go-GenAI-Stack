package errors

import "fmt"

// DomainError 领域错误
type DomainError struct {
	Code       string
	Message    string
	HTTPStatus int
	Err        error
}

// Error 实现 error 接口
func (e *DomainError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap 实现 errors.Unwrap
func (e *DomainError) Unwrap() error {
	return e.Err
}

// New 创建新的领域错误
func New(code, message string, httpStatus int) *DomainError {
	return &DomainError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
	}
}

// Wrap 包装现有错误
func Wrap(err error, code, message string, httpStatus int) *DomainError {
	return &DomainError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
		Err:        err,
	}
}

// 常见错误
var (
	// 客户端错误 (4xx)
	ErrInvalidRequest       = New("INVALID_REQUEST", "请求参数无效", 400)
	ErrMessageEmpty         = New("MESSAGE_EMPTY", "消息不能为空", 400)
	ErrMessageTooLong       = New("MESSAGE_TOO_LONG", "消息过长，最大 10000 字符", 400)
	ErrUnauthorizedAccess   = New("UNAUTHORIZED_ACCESS", "无权访问此资源", 403)
	ErrConversationNotFound = New("CONVERSATION_NOT_FOUND", "对话不存在", 404)
	ErrMessageNotFound      = New("MESSAGE_NOT_FOUND", "消息不存在", 404)
	ErrResourceNotFound     = New("RESOURCE_NOT_FOUND", "资源不存在", 404)
	ErrRateLimitExceeded    = New("RATE_LIMIT_EXCEEDED", "请求过于频繁，请稍后再试", 429)

	// 服务器错误 (5xx)
	ErrInternalError      = New("INTERNAL_ERROR", "内部服务器错误", 500)
	ErrDatabaseError      = New("DATABASE_ERROR", "数据库错误", 500)
	ErrServiceError       = New("SERVICE_ERROR", "服务错误", 500)
	ErrExternalAPIError   = New("EXTERNAL_API_ERROR", "外部 API 调用失败", 502)
	ErrServiceUnavailable = New("SERVICE_UNAVAILABLE", "服务暂时不可用", 503)
)
