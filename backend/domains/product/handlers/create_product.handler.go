package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// CreateProductHandler 创建商品处理器
//
// 对应用例：CreateProduct
//
// HTTP:
//   - Method: POST
//   - Path: /api/products
//
// 职责：
//   - 解析 HTTP 请求
//   - 转换为 Domain Input
//   - 调用 Service
//   - 返回 HTTP 响应
func (deps *HandlerDependencies) CreateProductHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: 解析 HTTP 请求
	var req dto.CreateProductRequest
	if err := BindAndValidate(c, &req); err != nil {
		HandleError(c, err)
		return
	}

	// Step 2: 获取操作人 ID
	operatorID, err := GetOperatorID(c)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 3: 转换为 Domain Input
	coinType := model.CoinType(req.CoinType)
	if coinType == "" {
		coinType = model.CoinTypeGold // 默认金币
	}

	input := service.CreateProductInput{
		OperatorID:    operatorID,
		Name:          req.Name,
		ImageURL:      req.ImageURL,
		Description:   req.Description,
		InitialCoins:  req.InitialCoins,
		CoinType:      coinType,
		Stock:         req.Stock,
		PurchaseLimit: req.PurchaseLimit,
		Cost:          req.Cost,
	}

	// Step 4: 调用 Service
	output, err := deps.productService.CreateProduct(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 5: 返回 HTTP 响应
	resp := dto.CreateProductResponse{
		ProductID: output.Product.ID,
		Name:      output.Product.Name,
		Status:    string(output.Product.Status),
		CreatedAt: output.Product.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	RespondCreated(c, resp)
}

