package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/domains/product/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
	"github.com/erweixin/go-genai-stack/backend/domains/product/repository"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// ListProductsHandler 列出商品处理器
//
// 对应用例：ListProducts
//
// HTTP:
//   - Method: GET
//   - Path: /api/products
//
// 职责：
//   - 解析查询参数
//   - 构建过滤条件
//   - 调用 Service
//   - 返回分页结果
func (deps *HandlerDependencies) ListProductsHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: 解析查询参数
	var req dto.ListProductsRequest
	if err := c.BindAndValidate(&req); err != nil {
		HandleError(c, err)
		return
	}

	// Step 2: 构建过滤器
	filter := repository.NewProductFilter()

	// 状态筛选
	if req.Status != "" {
		status := model.ProductStatus(req.Status)
		filter.Status = &status
	}

	// 关键词搜索
	if req.Keyword != "" {
		filter.Keyword = req.Keyword
	}

	// 排序
	if req.SortBy != "" {
		filter.SortBy = req.SortBy
	}
	if req.SortOrder != "" {
		filter.SortOrder = req.SortOrder
	}

	// 分页
	if req.Page > 0 {
		filter.Page = req.Page
	}
	if req.Limit > 0 {
		filter.Limit = req.Limit
	}

	// Step 3: 调用 Service
	input := service.ListProductsInput{
		Filter: *filter,
	}

	output, err := deps.productService.ListProducts(ctx, input)
	if err != nil {
		HandleError(c, err)
		return
	}

	// Step 4: 转换为 HTTP 响应
	products := make([]dto.ProductResponse, len(output.Products))
	for i, product := range output.Products {
		products[i] = ConvertProductToResponse(product)
	}

	resp := dto.ListProductsResponse{
		Products:   products,
		TotalCount: output.TotalCount,
		Page:       output.Page,
		Limit:      output.Limit,
		HasMore:    output.HasMore,
	}

	RespondSuccess(c, resp)
}
