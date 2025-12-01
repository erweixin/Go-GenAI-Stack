package handlers

import (
	"context"
	"fmt"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// UnshelveProductHandler 下架商品处理器
//
// 对应用例：UnshelveProduct
//
// HTTP:
//   - Method: POST
//   - Path: /api/products/:id/unshelve
//
// 职责：
//   - 解析路径参数
//   - 调用 Service
//   - 返回下架结果
func (deps *HandlerDependencies) UnshelveProductHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: 解析路径参数
	productID := c.Param("id")
	if productID == "" {
		HandleError(c, fmt.Errorf("INVALID_REQUEST: 商品 ID 不能为空"))
		return
	}

	// Step 2: 获取操作人 ID
	operatorID, err := GetOperatorID(c)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 3: 调用 Service
	input := service.UnshelveProductInput{
		OperatorID: operatorID,
		ProductID:  productID,
	}

	output, err := deps.productService.UnshelveProduct(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 4: 返回 HTTP 响应
	resp := dto.UnshelveProductResponse{
		ProductID:   output.Product.ID,
		Status:      string(output.Product.Status),
		UnshelvedAt: output.Product.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	RespondSuccess(c, resp)
}

