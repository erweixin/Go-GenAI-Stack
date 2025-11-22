package middleware

import (
	"context"
	"log"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/shared/errors"
)

// ErrorResponse 统一错误响应格式
type ErrorResponse struct {
	Error   string `json:"error"`            // 错误码
	Message string `json:"message"`          // 错误消息
	Details string `json:"details,omitempty"` // 详细信息（可选）
}

// ErrorHandler 统一错误处理中间件
//
// 捕获所有 handler 中抛出的 panic 和错误，转换为标准的 JSON 响应
func ErrorHandler() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("ERROR: Panic recovered: %v", r)
				
				// 尝试转换为 DomainError
				if err, ok := r.(error); ok {
					if domainErr, ok := err.(*errors.DomainError); ok {
						sendErrorResponse(c, domainErr)
						return
					}
				}

				// 默认返回 500 错误
				c.JSON(consts.StatusInternalServerError, ErrorResponse{
					Error:   "INTERNAL_ERROR",
					Message: "内部服务器错误",
				})
			}
		}()

		c.Next(ctx)
	}
}

// sendErrorResponse 发送错误响应
func sendErrorResponse(c *app.RequestContext, err *errors.DomainError) {
	resp := ErrorResponse{
		Error:   err.Code,
		Message: err.Message,
	}

	// 如果有底层错误，添加到详细信息中（仅在开发环境）
	if err.Err != nil {
		// Extension point: 根据环境决定是否显示详细错误
		// if os.Getenv("APP_ENV") == "development" {
		//     resp.Details = err.Err.Error()
		// }
	}

	c.JSON(err.HTTPStatus, resp)
}

// HandleError 处理错误的辅助函数
//
// 可以在 handler 中使用，统一错误处理逻辑
//
// Example:
//
//	if err != nil {
//	    middleware.HandleError(c, err)
//	    return
//	}
func HandleError(c *app.RequestContext, err error) {
	switch e := err.(type) {
	case *errors.DomainError:
		sendErrorResponse(c, e)
	default:
		// 未知错误，返回 500
		c.JSON(consts.StatusInternalServerError, ErrorResponse{
			Error:   "INTERNAL_ERROR",
			Message: "内部服务器错误",
		})
		log.Printf("ERROR: Unhandled error: %v", err)
	}
}

