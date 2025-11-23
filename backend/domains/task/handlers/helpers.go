package handlers

import (
	"log"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
)

// handleDomainError 统一处理领域错误，转换为 HTTP 响应
//
// 根据错误类型返回合适的 HTTP 状态码和错误消息。
// 这是 Handler 层的核心职责之一：将领域错误适配为 HTTP 响应。
func handleDomainError(c *app.RequestContext, err error) {
	if err == nil {
		return
	}

	errMsg := err.Error()
	code := extractErrorCode(errMsg)

	// 根据错误码确定 HTTP 状态码
	statusCode := getHTTPStatusCode(code, err)

	// 构造错误响应
	response := dto.ErrorResponse{
		Error:   code,
		Message: extractErrorMessage(errMsg),
	}

	c.JSON(statusCode, response)

	// 记录 500 级别的错误
	if statusCode >= 500 {
		log.Printf("Internal error: %v", err)
	}
}

// extractErrorCode 从错误消息中提取错误码
//
// 支持格式：
// - "ERROR_CODE: message" → 返回 "ERROR_CODE"
// - "wrapper: ERROR_CODE: message" → 返回 "ERROR_CODE"（递归提取）
// - "message" → 通过匹配已知错误返回对应错误码
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
	// 格式：ERROR_CODE: message
	if idx := strings.Index(errMsg, ":"); idx > 0 {
		return strings.TrimSpace(errMsg[idx+1:])
	}
	return errMsg
}

// getHTTPStatusCode 根据错误码和错误类型确定 HTTP 状态码
func getHTTPStatusCode(code string, err error) int {
	// 已知的业务错误（400）
	businessErrors := map[string]bool{
		"TASK_TITLE_EMPTY":          true,
		"TASK_DESCRIPTION_TOO_LONG": true,
		"TASK_ALREADY_COMPLETED":    true,
		"INVALID_DUE_DATE":          true,
		"INVALID_PRIORITY":          true,
		"TOO_MANY_TAGS":             true,
		"TAG_NAME_EMPTY":            true,
		"DUPLICATE_TAG":             true,
		"INVALID_INPUT":             true,
		"INVALID_QUERY":             true,
		"INVALID_FILTER":            true,
		"INVALID_PAGINATION":        true,
	}

	// 资源不存在错误（404）
	notFoundErrors := map[string]bool{
		"TASK_NOT_FOUND": true,
	}

	if businessErrors[code] {
		return 400
	}

	if notFoundErrors[code] {
		return 404
	}

	// 系统错误（500）
	if strings.HasSuffix(code, "_FAILED") {
		return 500
	}

	// 包含 INVALID 的错误通常是业务验证错误（400）
	if strings.Contains(code, "INVALID") {
		return 400
	}

	// 默认 500
	return 500
}

// isUpperSnakeCase 判断字符串是否是大写下划线格式
func isUpperSnakeCase(s string) bool {
	if s == "" {
		return false
	}
	for _, c := range s {
		if !(c >= 'A' && c <= 'Z' || c == '_' || c >= '0' && c <= '9') {
			return false
		}
	}
	return true
}
