package http

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/erweixin/go-genai-stack/backend/domains/product/handlers"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/middleware"
)

// RegisterRoutes 注册商品领域的 HTTP 路由
//
// 参数：
//   - h: Hertz 服务器实例
//   - deps: Handler 依赖容器
//   - authMiddleware: 认证中间件（用于获取用户 ID）
//
// 路由列表：
//   - POST   /products           - 创建商品（需要认证）
//   - GET    /products           - 列出商品（需要认证）
//   - GET    /products/:id       - 获取商品详情（需要认证）
//   - PUT    /products/:id       - 更新商品（需要认证）
//   - DELETE /products/:id       - 删除商品（需要认证）
//   - POST   /products/:id/shelve   - 上架商品（需要认证）
//   - POST   /products/:id/unshelve - 下架商品（需要认证）
func RegisterRoutes(h *server.Hertz, deps *handlers.HandlerDependencies, authMiddleware *middleware.AuthMiddleware) {
	// Product 路由组（应用认证中间件）
	productGroup := h.Group("/api/products", authMiddleware.Handle())

	// 创建商品
	productGroup.POST("", func(ctx context.Context, c *app.RequestContext) {
		deps.CreateProductHandler(ctx, c)
	})

	// 列出商品
	productGroup.GET("", func(ctx context.Context, c *app.RequestContext) {
		deps.ListProductsHandler(ctx, c)
	})

	// 获取商品详情
	productGroup.GET("/:id", func(ctx context.Context, c *app.RequestContext) {
		deps.GetProductHandler(ctx, c)
	})

	// 更新商品
	productGroup.PUT("/:id", func(ctx context.Context, c *app.RequestContext) {
		deps.UpdateProductHandler(ctx, c)
	})

	// 删除商品
	productGroup.DELETE("/:id", func(ctx context.Context, c *app.RequestContext) {
		deps.DeleteProductHandler(ctx, c)
	})

	// 上架商品
	productGroup.POST("/:id/shelve", func(ctx context.Context, c *app.RequestContext) {
		deps.ShelveProductHandler(ctx, c)
	})

	// 下架商品
	productGroup.POST("/:id/unshelve", func(ctx context.Context, c *app.RequestContext) {
		deps.UnshelveProductHandler(ctx, c)
	})

	// 注意：DeductInventory 是内部调用的 API，这里不暴露
	// 如果需要暴露，应该添加认证和授权中间件
}

