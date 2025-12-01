package repository

import (
	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
)

// ProductFilter 商品查询过滤器
//
// 用于构建复杂的查询条件
type ProductFilter struct {
	// 筛选条件
	Status   *model.ProductStatus // 按状态筛选（nil = 不筛选）
	CoinType *model.CoinType      // 按金币类型筛选（nil = 不筛选）
	Keyword  string               // 关键词搜索（商品名称）

	// 排序
	SortBy    string // 排序字段（created_at, initial_coins, redeemed_count）
	SortOrder string // 排序方向（asc, desc）

	// 分页
	Page  int // 页码（从 1 开始）
	Limit int // 每页数量
}

// NewProductFilter 创建默认的过滤器
//
// 返回：
//   - *ProductFilter: 过滤器实例
func NewProductFilter() *ProductFilter {
	return &ProductFilter{
		SortBy:    "created_at",
		SortOrder: "desc",
		Page:      1,
		Limit:     20,
	}
}

// Offset 计算分页偏移量
//
// 返回：
//   - int: 偏移量
func (f *ProductFilter) Offset() int {
	if f.Page < 1 {
		f.Page = 1
	}
	return (f.Page - 1) * f.Limit
}

// ValidateSortBy 验证排序字段
//
// 返回：
//   - bool: 是否有效
func (f *ProductFilter) ValidateSortBy() bool {
	validFields := map[string]bool{
		"created_at":     true,
		"initial_coins":  true,
		"redeemed_count": true,
		"updated_at":     true,
	}
	return validFields[f.SortBy]
}

// ValidateSortOrder 验证排序方向
//
// 返回：
//   - bool: 是否有效
func (f *ProductFilter) ValidateSortOrder() bool {
	return f.SortOrder == "asc" || f.SortOrder == "desc"
}

// Normalize 规范化过滤器参数
func (f *ProductFilter) Normalize() {
	// 规范化排序字段
	if !f.ValidateSortBy() {
		f.SortBy = "created_at"
	}

	// 规范化排序方向
	if !f.ValidateSortOrder() {
		f.SortOrder = "desc"
	}

	// 规范化分页参数
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
}
