package model

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// ProductStatus 定义商品状态
type ProductStatus string

const (
	StatusOnShelf  ProductStatus = "on_shelf"  // 上架
	StatusOffShelf ProductStatus = "off_shelf" // 下架
)

// IsValid 检查商品状态是否有效
func (s ProductStatus) IsValid() bool {
	switch s {
	case StatusOnShelf, StatusOffShelf:
		return true
	}
	return false
}

// CoinType 定义金币类型
type CoinType string

const (
	CoinTypeGold   CoinType = "gold"   // 金币
	CoinTypeSilver CoinType = "silver" // 银币
)

// IsValid 检查金币类型是否有效
func (c CoinType) IsValid() bool {
	switch c {
	case CoinTypeGold, CoinTypeSilver:
		return true
	}
	return false
}

// Product 聚合根
// 包含商品的所有核心属性和业务行为
type Product struct {
	ID                string
	Name              string
	ImageURL          string   // 商品图片 URL
	Description       string   // 商品描述
	InitialCoins      int      // 兑换所需金币数
	CoinType          CoinType // 金币类型
	Stock             int      // 总库存
	ListedQuantity    int      // 上架数量
	ListedLimit       *int     // 上架限量（NULL=不限制）
	RedeemedCount     int      // 已兑换数量
	AvailableQuantity int      // 线上剩余（计算字段）
	SalesCount        int      // 销售数量（等同于已兑换数量）
	PurchaseLimit     *int     // 每人购买限制（NULL=不限制）
	Cost              *float64 // 成本（元）
	Revenue           float64  // 已兑换收益（元）
	Status            ProductStatus
	OperatorID        string // 操作人 ID
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// 领域错误定义
var (
	ErrProductNameEmpty            = fmt.Errorf("PRODUCT_NAME_EMPTY: 商品名称不能为空")
	ErrProductNameTooLong          = fmt.Errorf("PRODUCT_NAME_TOO_LONG: 商品名称过长，最大 200 字符")
	ErrInvalidCoins                = fmt.Errorf("INVALID_COINS: 初始金币必须大于 0")
	ErrInvalidCoinType             = fmt.Errorf("INVALID_COIN_TYPE: 金币类型无效")
	ErrInvalidStock                = fmt.Errorf("INVALID_STOCK: 库存不能为负数")
	ErrInvalidCost                 = fmt.Errorf("INVALID_COST: 成本不能为负数")
	ErrAlreadyOnShelf              = fmt.Errorf("ALREADY_ON_SHELF: 商品已上架")
	ErrAlreadyOffShelf             = fmt.Errorf("ALREADY_OFF_SHELF: 商品已下架")
	ErrInsufficientStockToShelve   = fmt.Errorf("INSUFFICIENT_STOCK_TO_SHELVE: 库存不足，无法上架")
	ErrInvalidShelveQuantity       = fmt.Errorf("INVALID_SHELVE_QUANTITY: 上架数量无效")
	ErrInsufficientStock           = fmt.Errorf("INSUFFICIENT_STOCK: 库存不足")
	ErrProductOffShelf             = fmt.Errorf("PRODUCT_OFF_SHELF: 商品已下架，无法兑换")
	ErrRedeemedCountExceedsStock   = fmt.Errorf("REDEEMED_COUNT_EXCEEDS_STOCK: 已兑换数量超过总库存")
	ErrInvalidStockUpdate          = fmt.Errorf("INVALID_STOCK_UPDATE: 库存不能小于已兑换数量")
	ErrCannotDeleteOnShelfProduct  = fmt.Errorf("CANNOT_DELETE_ON_SHELF_PRODUCT: 无法删除上架状态的商品")
	ErrCannotDeleteRedeemedProduct = fmt.Errorf("CANNOT_DELETE_REDEEMED_PRODUCT: 无法删除已有兑换记录的商品")
)

// NewProduct 创建一个新的商品
//
// 参数：
//   - operatorID: 操作人 ID
//   - name: 商品名称
//   - initialCoins: 兑换所需金币数
//   - coinType: 金币类型
//   - stock: 总库存
//
// 返回：
//   - *Product: 商品实体
//   - error: 错误信息
func NewProduct(operatorID, name string, initialCoins int, coinType CoinType, stock int) (*Product, error) {
	// 验证操作人 ID
	if operatorID == "" {
		return nil, fmt.Errorf("OPERATOR_ID_REQUIRED: 操作人 ID 不能为空")
	}

	// 验证商品名称
	if name == "" {
		return nil, ErrProductNameEmpty
	}
	if len(name) > 200 {
		return nil, ErrProductNameTooLong
	}

	// 验证初始金币
	if initialCoins <= 0 {
		return nil, ErrInvalidCoins
	}

	// 验证金币类型
	if !coinType.IsValid() {
		return nil, ErrInvalidCoinType
	}

	// 验证库存
	if stock < 0 {
		return nil, ErrInvalidStock
	}

	now := time.Now()
	return &Product{
		ID:                uuid.New().String(),
		Name:              name,
		InitialCoins:      initialCoins,
		CoinType:          coinType,
		Stock:             stock,
		ListedQuantity:    0, // 创建时未上架
		RedeemedCount:     0,
		AvailableQuantity: 0,
		SalesCount:        0,
		Revenue:           0,
		Status:            StatusOffShelf, // 默认下架状态
		OperatorID:        operatorID,
		CreatedAt:         now,
		UpdatedAt:         now,
	}, nil
}

// Update 更新商品基本信息
//
// 参数：
//   - name: 商品名称（可选）
//   - description: 商品描述（可选）
//   - imageURL: 商品图片 URL（可选）
//   - initialCoins: 初始金币（可选）
//   - stock: 总库存（可选）
//   - cost: 成本（可选）
//   - purchaseLimit: 购买限制（可选）
//
// 返回：
//   - error: 错误信息
func (p *Product) Update(name *string, description *string, imageURL *string, initialCoins *int, stock *int, cost *float64, purchaseLimit *int) error {
	// 更新名称
	if name != nil {
		if *name == "" {
			return ErrProductNameEmpty
		}
		if len(*name) > 200 {
			return ErrProductNameTooLong
		}
		p.Name = *name
	}

	// 更新描述
	if description != nil {
		p.Description = *description
	}

	// 更新图片 URL
	if imageURL != nil {
		p.ImageURL = *imageURL
	}

	// 更新初始金币
	if initialCoins != nil {
		if *initialCoins <= 0 {
			return ErrInvalidCoins
		}
		p.InitialCoins = *initialCoins
	}

	// 更新库存（必须 >= 已兑换数量）
	if stock != nil {
		if *stock < 0 {
			return ErrInvalidStock
		}
		if *stock < p.RedeemedCount {
			return ErrInvalidStockUpdate
		}
		p.Stock = *stock
	}

	// 更新成本
	if cost != nil {
		if *cost < 0 {
			return ErrInvalidCost
		}
		p.Cost = cost
	}

	// 更新购买限制
	if purchaseLimit != nil {
		p.PurchaseLimit = purchaseLimit
	}

	p.UpdatedAt = time.Now()
	return nil
}

// Shelve 上架商品
//
// 参数：
//   - quantity: 上架数量
//
// 返回：
//   - error: 错误信息
//
// 业务规则：
//   - 当前状态必须是下架
//   - 上架数量 > 0
//   - 可用库存（总库存 - 已兑换数量）>= 上架数量
func (p *Product) Shelve(quantity int) error {
	// 检查状态
	if p.Status == StatusOnShelf {
		return ErrAlreadyOnShelf
	}

	// 验证上架数量
	if quantity <= 0 {
		return ErrInvalidShelveQuantity
	}

	// 计算可用库存
	availableStock := p.Stock - p.RedeemedCount
	if availableStock < quantity {
		return ErrInsufficientStockToShelve
	}

	// 检查上架限量
	if p.ListedLimit != nil && quantity > *p.ListedLimit {
		return fmt.Errorf("EXCEEDS_LISTED_LIMIT: 上架数量超过限量 %d", *p.ListedLimit)
	}

	// 更新状态
	p.Status = StatusOnShelf
	p.ListedQuantity = quantity
	p.AvailableQuantity = quantity - p.RedeemedCount
	p.UpdatedAt = time.Now()

	return nil
}

// Unshelve 下架商品
//
// 返回：
//   - error: 错误信息
//
// 业务规则：
//   - 当前状态必须是上架
func (p *Product) Unshelve() error {
	// 检查状态
	if p.Status == StatusOffShelf {
		return ErrAlreadyOffShelf
	}

	// 更新状态
	p.Status = StatusOffShelf
	p.UpdatedAt = time.Now()

	return nil
}

// DeductInventory 扣减库存（用户兑换时调用）
//
// 参数：
//   - quantity: 扣减数量
//   - coinRate: 金币汇率（金币价值 -> 人民币）
//
// 返回：
//   - error: 错误信息
//
// 业务规则：
//   - 商品必须是上架状态
//   - 线上剩余 >= 扣减数量
//   - 使用行锁保证并发安全（在 Repository 层实现）
func (p *Product) DeductInventory(quantity int, coinRate float64) error {
	// 检查状态
	if p.Status != StatusOnShelf {
		return ErrProductOffShelf
	}

	// 验证数量
	if quantity <= 0 {
		return fmt.Errorf("INVALID_QUANTITY: 扣减数量必须大于 0")
	}

	// 检查库存
	if p.AvailableQuantity < quantity {
		return ErrInsufficientStock
	}

	// 扣减库存
	p.RedeemedCount += quantity
	p.AvailableQuantity = p.ListedQuantity - p.RedeemedCount
	p.SalesCount += quantity

	// 更新收益（金币数 × 汇率）
	p.Revenue += float64(p.InitialCoins*quantity) * coinRate

	p.UpdatedAt = time.Now()

	return nil
}

// CanDelete 检查商品是否可以删除
//
// 返回：
//   - bool: 是否可以删除
//   - error: 错误信息
//
// 业务规则：
//   - 必须是下架状态
//   - 已兑换数量为 0
func (p *Product) CanDelete() (bool, error) {
	if p.Status == StatusOnShelf {
		return false, ErrCannotDeleteOnShelfProduct
	}

	if p.RedeemedCount > 0 {
		return false, ErrCannotDeleteRedeemedProduct
	}

	return true, nil
}

// IsSoldOut 检查商品是否售罄
//
// 返回：
//   - bool: 是否售罄
func (p *Product) IsSoldOut() bool {
	return p.AvailableQuantity <= 0 && p.Status == StatusOnShelf
}

// GetAvailableStock 获取可用库存（总库存 - 已兑换数量）
//
// 返回：
//   - int: 可用库存
func (p *Product) GetAvailableStock() int {
	return p.Stock - p.RedeemedCount
}

// RecalculateAvailableQuantity 重新计算线上剩余
//
// 用于数据修复或迁移
func (p *Product) RecalculateAvailableQuantity() {
	p.AvailableQuantity = p.ListedQuantity - p.RedeemedCount
	if p.AvailableQuantity < 0 {
		p.AvailableQuantity = 0
	}
}
