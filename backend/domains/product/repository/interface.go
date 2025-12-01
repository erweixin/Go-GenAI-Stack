package repository

import (
	"context"

	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
)

// ProductRepository 商品仓储接口
//
// 职责：
// - 定义商品数据访问的抽象接口
// - 隐藏数据库实现细节
// - 使用领域语言（而非SQL语言）
//
// 实现：
// - ProductRepositoryImpl：使用 database/sql + PostgreSQL
type ProductRepository interface {
	// Create 创建商品
	//
	// 参数：
	//   - ctx: 上下文
	//   - product: 商品实体
	//
	// 返回：
	//   - error: 错误信息
	Create(ctx context.Context, product *model.Product) error

	// Update 更新商品
	//
	// 参数：
	//   - ctx: 上下文
	//   - product: 商品实体
	//
	// 返回：
	//   - error: 错误信息
	Update(ctx context.Context, product *model.Product) error

	// FindByID 根据 ID 获取商品
	//
	// 参数：
	//   - ctx: 上下文
	//   - id: 商品 ID
	//
	// 返回：
	//   - *model.Product: 商品实体
	//   - error: 错误信息（不存在时返回 ErrProductNotFound）
	FindByID(ctx context.Context, id string) (*model.Product, error)

	// FindByIDForUpdate 根据 ID 获取商品（使用行锁）
	//
	// 用于库存扣减等需要并发控制的场景
	//
	// 参数：
	//   - ctx: 上下文
	//   - id: 商品 ID
	//
	// 返回：
	//   - *model.Product: 商品实体
	//   - error: 错误信息
	FindByIDForUpdate(ctx context.Context, id string) (*model.Product, error)

	// List 查询商品列表
	//
	// 参数：
	//   - ctx: 上下文
	//   - filter: 查询过滤条件
	//
	// 返回：
	//   - []*model.Product: 商品列表
	//   - int: 总数量（用于分页）
	//   - error: 错误信息
	List(ctx context.Context, filter *ProductFilter) ([]*model.Product, int, error)

	// Delete 删除商品
	//
	// 参数：
	//   - ctx: 上下文
	//   - id: 商品 ID
	//
	// 返回：
	//   - error: 错误信息
	Delete(ctx context.Context, id string) error

	// Exists 检查商品是否存在
	//
	// 参数：
	//   - ctx: 上下文
	//   - id: 商品 ID
	//
	// 返回：
	//   - bool: 是否存在
	//   - error: 错误信息
	Exists(ctx context.Context, id string) (bool, error)
}
