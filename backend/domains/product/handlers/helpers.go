package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
)

// HandleError 处理错误并返回 HTTP 响应
//
// 参数：
//   - c: Hertz 请求上下文
//   - err: 错误信息
//
// 错误码映射：
//   - PRODUCT_NOT_FOUND -> 404
//   - INVALID_* -> 400
//   - *_FAILED -> 500
//   - 其他 -> 500
func HandleError(c *app.RequestContext, err error) {
	if err == nil {
		return
	}

	errMsg := err.Error()
	var statusCode int
	var errorCode string

	// 解析错误码（格式：ERROR_CODE: message）
	if idx := strings.Index(errMsg, ":"); idx > 0 {
		errorCode = strings.TrimSpace(errMsg[:idx])
		errMsg = strings.TrimSpace(errMsg[idx+1:])
	}

	// 根据错误码映射 HTTP 状态码
	switch {
	case strings.Contains(errorCode, "NOT_FOUND"):
		statusCode = 404
	case strings.HasPrefix(errorCode, "INVALID_"):
		statusCode = 400
	case strings.Contains(errorCode, "ALREADY_"):
		statusCode = 400
	case strings.Contains(errorCode, "INSUFFICIENT_"):
		statusCode = 400
	case strings.Contains(errorCode, "CANNOT_DELETE_"):
		statusCode = 400
	case strings.HasSuffix(errorCode, "_REQUIRED"):
		statusCode = 400
	case strings.HasSuffix(errorCode, "_FAILED"):
		statusCode = 500
	case errorCode == "":
		statusCode = 500
		errorCode = "INTERNAL_ERROR"
	default:
		statusCode = 400
	}

	c.JSON(statusCode, dto.ErrorResponse{
		Error:   errMsg,
		Message: errMsg,
		Code:    errorCode,
	})
}

// ConvertProductToResponse 将领域模型转换为 HTTP 响应
//
// 参数：
//   - product: 商品实体
//
// 返回：
//   - dto.ProductResponse: HTTP 响应
func ConvertProductToResponse(product *model.Product) dto.ProductResponse {
	return dto.ProductResponse{
		ID:                product.ID,
		Name:              product.Name,
		ImageURL:          product.ImageURL,
		Description:       product.Description,
		InitialCoins:      product.InitialCoins,
		CoinType:          string(product.CoinType),
		Stock:             product.Stock,
		ListedQuantity:    product.ListedQuantity,
		ListedLimit:       product.ListedLimit,
		RedeemedCount:     product.RedeemedCount,
		AvailableQuantity: product.AvailableQuantity,
		SalesCount:        product.SalesCount,
		PurchaseLimit:     product.PurchaseLimit,
		Cost:              product.Cost,
		Revenue:           product.Revenue,
		Status:            string(product.Status),
		OperatorID:        product.OperatorID,
		CreatedAt:         product.CreatedAt.Format(time.RFC3339),
		UpdatedAt:         product.UpdatedAt.Format(time.RFC3339),
	}
}

// GetOperatorID 从认证上下文获取操作人 ID
//
// 参数：
//   - c: Hertz 请求上下文
//
// 返回：
//   - string: 操作人 ID（用户 UUID）
//   - error: 错误信息（未登录或用户 ID 无效）
//
// 注意：需要在认证中间件之后调用
func GetOperatorID(c *app.RequestContext) (string, error) {
	// 从认证中间件注入的上下文中获取 user_id
	userID, exists := c.Get("user_id")
	if !exists {
		return "", fmt.Errorf("UNAUTHORIZED: 未登录，请先登录")
	}

	// 类型断言为 string
	userIDStr, ok := userID.(string)
	if !ok || userIDStr == "" {
		return "", fmt.Errorf("INVALID_USER_ID: 用户 ID 无效")
	}

	return userIDStr, nil
}

// BindAndValidate 绑定并验证请求参数
//
// 参数：
//   - c: Hertz 请求上下文
//   - req: 请求对象（指针）
//
// 返回：
//   - error: 错误信息
func BindAndValidate(c *app.RequestContext, req interface{}) error {
	if err := c.BindAndValidate(req); err != nil {
		return fmt.Errorf("INVALID_REQUEST: %s", err.Error())
	}
	return nil
}

// RespondJSON 返回 JSON 响应
//
// 参数：
//   - c: Hertz 请求上下文
//   - statusCode: HTTP 状态码
//   - data: 响应数据
func RespondJSON(c *app.RequestContext, statusCode int, data interface{}) {
	c.JSON(statusCode, data)
}

// RespondSuccess 返回成功响应
//
// 参数：
//   - c: Hertz 请求上下文
//   - data: 响应数据
func RespondSuccess(c *app.RequestContext, data interface{}) {
	RespondJSON(c, 200, data)
}

// RespondCreated 返回创建成功响应
//
// 参数：
//   - c: Hertz 请求上下文
//   - data: 响应数据
func RespondCreated(c *app.RequestContext, data interface{}) {
	RespondJSON(c, 201, data)
}
