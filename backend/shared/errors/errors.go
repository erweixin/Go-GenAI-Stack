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
	ErrMessageEmpty = New("MESSAGE_EMPTY", "消息不能为空", 400)
	ErrMessageTooLong = New("MESSAGE_TOO_LONG", "消息过长，最大 10000 字符", 400)
	ErrConversationNotFound = New("CONVERSATION_NOT_FOUND", "对话不存在", 404)
	ErrUnauthorizedAccess = New("UNAUTHORIZED_ACCESS", "无权访问此对话", 403)
	ErrRateLimitExceeded = New("RATE_LIMIT_EXCEEDED", "请求过于频繁，请稍后再试", 429)
	ErrInternalError = New("INTERNAL_ERROR", "内部服务器错误", 500)
)

