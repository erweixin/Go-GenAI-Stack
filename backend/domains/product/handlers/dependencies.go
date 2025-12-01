package handlers

import (
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
)

// HandlerDependencies Handler 依赖容器
//
// 职责：
// - 封装 Handler 需要的所有依赖
// - 使用依赖注入模式
// - 便于测试和扩展
type HandlerDependencies struct {
	productService *service.ProductService
	// Extension point: 添加更多依赖
	// authService *auth.Service
	// cache       cache.Cache
}

// NewHandlerDependencies 创建 Handler 依赖容器
//
// 参数：
//   - productService: 商品领域服务
//
// 返回：
//   - *HandlerDependencies: 依赖容器实例
func NewHandlerDependencies(productService *service.ProductService) *HandlerDependencies {
	return &HandlerDependencies{
		productService: productService,
	}
}
