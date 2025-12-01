package handlers

import (
	"context"
	"fmt"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// ShelveProductHandler 上架商品处理器
//
// 对应用例：ShelveProduct
//
// HTTP:
//   - Method: POST
//   - Path: /api/products/:id/shelve
//
// 职责：
//   - 解析路径参数和请求体
//   - 调用 Service
//   - 返回上架结果
func (deps *HandlerDependencies) ShelveProductHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: 解析路径参数
	productID := c.Param("id")
	if productID == "" {
		HandleError(c, fmt.Errorf("INVALID_REQUEST: 商品 ID 不能为空"))
		return
	}

	// Step 2: 解析请求体
	var req dto.ShelveProductRequest
	if err := BindAndValidate(c, &req); err != nil {
		HandleError(c, err)
		return
	}

	// Step 3: 获取操作人 ID
	operatorID, err := GetOperatorID(c)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 4: 调用 Service
	input := service.ShelveProductInput{
		OperatorID: operatorID,
		ProductID:  productID,
		Quantity:   req.Quantity,
	}

	output, err := deps.productService.ShelveProduct(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 5: 返回 HTTP 响应
	resp := dto.ShelveProductResponse{
		ProductID:      output.Product.ID,
		Status:         string(output.Product.Status),
		ListedQuantity: output.Product.ListedQuantity,
		ShelvedAt:      output.Product.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	RespondSuccess(c, resp)
}

