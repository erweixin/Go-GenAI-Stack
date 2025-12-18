package handlers

import (
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
)

// handleDomainError 将领域错误转换为 HTTP 响应
func handleDomainError(c *app.RequestContext, err error) {
	// 解析错误码和消息
	errorCode, message := parseError(err)

	// 根据错误码确定 HTTP 状态码
	statusCode := getHTTPStatusCode(errorCode)

	c.JSON(statusCode, utils.H{
		"error":   errorCode,
		"message": message,
	})
}

// handleUnauthorized 处理未授权错误
func handleUnauthorized(c *app.RequestContext) {
	c.JSON(401, utils.H{
		"error":   "UNAUTHORIZED",
		"message": "未授权访问",
	})
}

// handleValidationError 处理验证错误
func handleValidationError(c *app.RequestContext, err error) {
	c.JSON(400, utils.H{
		"error":   "VALIDATION_ERROR",
		"message": "请求参数验证失败",
		"details": err.Error(),
	})
}

// parseError 解析领域错误，提取错误码和消息
func parseError(err error) (string, string) {
	errMsg := err.Error()

	// 错误格式：ERROR_CODE: message
	parts := strings.SplitN(errMsg, ":", 2)
	if len(parts) == 2 {
		errorCode := strings.TrimSpace(parts[0])
		message := strings.TrimSpace(parts[1])
		return errorCode, message
	}

	// 如果不是标准格式，返回通用错误
	return "INTERNAL_ERROR", errMsg
}

// getHTTPStatusCode 根据错误码返回 HTTP 状态码
func getHTTPStatusCode(errorCode string) int {
	switch errorCode {
	// 400 Bad Request
	case "INVALID_EMAIL", "INVALID_USERNAME", "WEAK_PASSWORD",
		"PASSWORD_TOO_LONG", "FULL_NAME_TOO_LONG", "INVALID_AVATAR_URL",
		"EMAIL_ALREADY_EXISTS", "USERNAME_ALREADY_EXISTS":
		return 400

	// 401 Unauthorized
	case "INVALID_PASSWORD":
		return 401

	// 403 Forbidden
	case "USER_BANNED":
		return 403

	// 404 Not Found
	case "USER_NOT_FOUND":
		return 404

	// 500 Internal Server Error
	default:
		return 500
	}
}
