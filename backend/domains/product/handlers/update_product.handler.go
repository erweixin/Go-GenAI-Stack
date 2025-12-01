package handlers

import (
	"context"
	"fmt"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// UpdateProductHandler 更新商品处理器
//
// 对应用例：UpdateProduct
//
// HTTP:
//   - Method: PUT
//   - Path: /api/products/:id
//
// 职责：
//   - 解析路径参数和请求体
//   - 转换为 Domain Input
//   - 调用 Service
//   - 返回更新结果
func (deps *HandlerDependencies) UpdateProductHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: 解析路径参数
	productID := c.Param("id")
	if productID == "" {
		HandleError(c, fmt.Errorf("INVALID_REQUEST: 商品 ID 不能为空"))
		return
	}

	// Step 2: 解析请求体
	var req dto.UpdateProductRequest
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

	// Step 4: 转换为 Domain Input
	input := service.UpdateProductInput{
		OperatorID:    operatorID,
		ProductID:     productID,
		Name:          req.Name,
		ImageURL:      req.ImageURL,
		Description:   req.Description,
		InitialCoins:  req.InitialCoins,
		Stock:         req.Stock,
		PurchaseLimit: req.PurchaseLimit,
		Cost:          req.Cost,
	}

	// Step 5: 调用 Service
	output, err := deps.productService.UpdateProduct(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 6: 返回 HTTP 响应
	resp := dto.UpdateProductResponse{
		ProductID: output.Product.ID,
		Name:      output.Product.Name,
		Status:    string(output.Product.Status),
		UpdatedAt: output.Product.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	RespondSuccess(c, resp)
}

