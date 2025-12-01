package handlers

import (
	"context"
	"fmt"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// DeleteProductHandler 删除商品处理器
//
// 对应用例：DeleteProduct
//
// HTTP:
//   - Method: DELETE
//   - Path: /api/products/:id
//
// 职责：
//   - 解析路径参数
//   - 调用 Service
//   - 返回删除结果
func (deps *HandlerDependencies) DeleteProductHandler(ctx context.Context, c *app.RequestContext) {
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
	input := service.DeleteProductInput{
		OperatorID: operatorID,
		ProductID:  productID,
	}

	output, err := deps.productService.DeleteProduct(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 4: 返回 HTTP 响应
	resp := dto.DeleteProductResponse{
		Success:   output.Success,
		DeletedAt: output.DeletedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	RespondSuccess(c, resp)
}

