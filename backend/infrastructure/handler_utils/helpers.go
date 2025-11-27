package handler_utils

import (
	"fmt"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/shared/errors"
)

// ErrorResponse HTTP 错误响应格式
type ErrorResponse struct {
	Error   string `json:"error"`             // 错误码
	Message string `json:"message"`           // 错误消息
	Details string `json:"details,omitempty"` // 详细信息（可选）
}

// HandleDomainError 统一处理领域错误，转换为 HTTP 响应
//
// 这是所有 Handler 层的核心辅助函数之一：将领域错误适配为 HTTP 响应。
//
// 支持两种错误格式：
// 1. shared/errors.DomainError - 结构化错误（推荐）
// 2. "ERROR_CODE: message" - 字符串格式错误（兼容现有代码）
//
// 使用示例：
//
//	output, err := service.CreateTask(ctx, input)
//	if err != nil {
//	    handler_utils.HandleDomainError(c, err)
//	    return
//	}
func HandleDomainError(c *app.RequestContext, err error) {
	if err == nil {
		return
	}

	// 1. 尝试解析为 DomainError
	if domainErr, ok := err.(*errors.DomainError); ok {
		response := ErrorResponse{
			Error:   domainErr.Code,
			Message: domainErr.Message,
		}
		c.JSON(domainErr.HTTPStatus, response)
		return
	}

	// 2. 尝试解析字符串格式错误 "ERROR_CODE: message"
	errMsg := err.Error()
	code := extractErrorCode(errMsg)
	message := extractErrorMessage(errMsg)
	statusCode := getHTTPStatusCode(code)

	response := ErrorResponse{
		Error:   code,
		Message: message,
	}
	c.JSON(statusCode, response)
}

// GetUserIDFromContext 从上下文中提取用户 ID
//
// 从 JWT 中间件注入的上下文中获取 user_id
//
// 使用示例：
//
//	userID, err := handler_utils.GetUserIDFromContext(c)
//	if err != nil {
//	    handler_utils.HandleDomainError(c, err)
//	    return
//	}
func GetUserIDFromContext(c *app.RequestContext) (string, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", errors.ErrUnauthorized
	}

	userIDStr, ok := userID.(string)
	if !ok {
		return "", errors.New("INTERNAL_ERROR", "用户 ID 类型错误", 500)
	}

	return userIDStr, nil
}

// GetRequiredPathParam 获取必需的路径参数
//
// 如果参数不存在或为空，返回错误
//
// 使用示例：
//
//	taskID, err := handler_utils.GetRequiredPathParam(c, "id")
//	if err != nil {
//	    handler_utils.HandleDomainError(c, err)
//	    return
//	}
func GetRequiredPathParam(c *app.RequestContext, paramName string) (string, error) {
	value := c.Param(paramName)
	if value == "" {
		return "", errors.New("INVALID_INPUT", fmt.Sprintf("参数 %s 不能为空", paramName), 400)
	}
	return value, nil
}

// ============================================
// 私有辅助函数
// ============================================

// extractErrorCode 从错误消息中提取错误码
//
// 支持格式：
// - "ERROR_CODE: message" → 返回 "ERROR_CODE"
// - "wrapper: ERROR_CODE: message" → 返回 "ERROR_CODE"（递归提取）
// - "message" → 返回 "UNKNOWN_ERROR"
func extractErrorCode(errMsg string) string {
	// 递归查找所有的冒号分隔的部分，找到第一个符合错误码格式的
	parts := strings.Split(errMsg, ":")
	for _, part := range parts {
		code := strings.TrimSpace(part)
		// 验证是否是大写下划线格式（错误码规范）
		if isUpperSnakeCase(code) && len(code) > 3 {
			return code
		}
	}

	return "UNKNOWN_ERROR"
}

// extractErrorMessage 从错误消息中提取用户友好的消息
func extractErrorMessage(errMsg string) string {
	// 查找最后一个冒号后的内容作为消息
	if idx := strings.LastIndex(errMsg, ":"); idx > 0 && idx < len(errMsg)-1 {
		return strings.TrimSpace(errMsg[idx+1:])
	}
	return errMsg
}

// getHTTPStatusCode 根据错误码确定 HTTP 状态码
//
// 这个映射基于常见的错误码命名规范
func getHTTPStatusCode(code string) int {
	// 根据错误码前缀或关键词判断
	switch {
	// 400 Bad Request
	case strings.Contains(code, "INVALID_"),
		strings.Contains(code, "EMPTY"),
		strings.Contains(code, "TOO_LONG"),
		strings.Contains(code, "TOO_MANY"),
		strings.Contains(code, "DUPLICATE"),
		strings.Contains(code, "ALREADY_"),
		code == "VALIDATION_ERROR",
		code == "WEAK_PASSWORD":
		return 400

	// 401 Unauthorized
	case strings.Contains(code, "UNAUTHORIZED"),
		strings.Contains(code, "INVALID_CREDENTIALS"),
		strings.Contains(code, "INVALID_TOKEN"),
		strings.Contains(code, "EXPIRED_"):
		return 401

	// 403 Forbidden
	case strings.Contains(code, "FORBIDDEN"),
		strings.Contains(code, "ACCESS"),
		code == "USER_BANNED":
		return 403

	// 404 Not Found
	case strings.Contains(code, "_NOT_FOUND"):
		return 404

	// 409 Conflict
	case strings.Contains(code, "_EXISTS"),
		code == "CONFLICT":
		return 409

	// 429 Too Many Requests
	case strings.Contains(code, "RATE_LIMIT"),
		strings.Contains(code, "TOO_FREQUENT"):
		return 429

	// 500 Internal Server Error
	case strings.Contains(code, "_FAILED"),
		code == "INTERNAL_ERROR",
		code == "DATABASE_ERROR",
		code == "SERVICE_ERROR":
		return 500

	// 502 Bad Gateway
	case strings.Contains(code, "EXTERNAL_"):
		return 502

	// 503 Service Unavailable
	case strings.Contains(code, "UNAVAILABLE"):
		return 503

	// 默认 500
	default:
		return 500
	}
}

// isUpperSnakeCase 检查字符串是否是大写下划线格式（ERROR_CODE）
func isUpperSnakeCase(s string) bool {
	if len(s) == 0 {
		return false
	}

	for _, c := range s {
		if !((c >= 'A' && c <= 'Z') || c == '_' || (c >= '0' && c <= '9')) {
			return false
		}
	}

	return true
}
