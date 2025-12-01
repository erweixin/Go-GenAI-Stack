package handlers

import (
	"context"
	"fmt"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// GetProductHandler 获取商品详情处理器
//
// 对应用例：GetProduct
//
// HTTP:
//   - Method: GET
//   - Path: /api/products/:id
//
// 职责：
//   - 解析路径参数
//   - 调用 Service
//   - 返回商品详情
func (deps *HandlerDependencies) GetProductHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: 解析路径参数
	productID := c.Param("id")
	if productID == "" {
		HandleError(c, fmt.Errorf("INVALID_REQUEST: 商品 ID 不能为空"))
		return
	}

	// Step 2: 调用 Service
	input := service.GetProductInput{
		ProductID: productID,
	}

	output, err := deps.productService.GetProduct(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 3: 返回 HTTP 响应
	resp := ConvertProductToResponse(output.Product)
	RespondSuccess(c, resp)
}

