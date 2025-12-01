package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
	"github.com/erweixin/go-genai-stack/backend/domains/product/repository"
)

// ProductService 商品领域服务
//
// 职责：
// - 封装商品领域的业务逻辑
// - 协调多个实体和仓储
// - 实现复杂的业务流程
// - 发布领域事件
//
// 与 Handler 的区别：
// - Handler：HTTP 适配层，薄层，只做请求/响应转换
// - Service：业务逻辑层，厚层，实现领域用例
type ProductService struct {
	productRepo repository.ProductRepository
	// Extension point: 添加更多依赖
	// eventBus events.EventBus
	// cache    cache.Cache
}

// NewProductService 创建商品领域服务
//
// 参数：
//   - productRepo: 商品仓储
//
// 返回：
//   - *ProductService: 商品领域服务实例
func NewProductService(productRepo repository.ProductRepository) *ProductService {
	return &ProductService{
		productRepo: productRepo,
	}
}

// CreateProductInput 创建商品输入（领域层 DTO）
type CreateProductInput struct {
	OperatorID    string // 操作人 ID（从认证上下文获取）
	Name          string
	ImageURL      string
	Description   string
	InitialCoins  int
	CoinType      model.CoinType
	Stock         int
	PurchaseLimit *int
	Cost          *float64
}

// CreateProductOutput 创建商品输出
type CreateProductOutput struct {
	Product *model.Product
}

// UpdateProductInput 更新商品输入
type UpdateProductInput struct {
	OperatorID    string  // 操作人 ID
	ProductID     string  // 商品 ID
	Name          *string // 可选更新
	ImageURL      *string
	Description   *string
	InitialCoins  *int
	Stock         *int
	PurchaseLimit *int
	Cost          *float64
}

// UpdateProductOutput 更新商品输出
type UpdateProductOutput struct {
	Product *model.Product
}

// GetProductInput 获取商品输入
type GetProductInput struct {
	ProductID string
}

// GetProductOutput 获取商品输出
type GetProductOutput struct {
	Product *model.Product
}

// ListProductsInput 列出商品输入
type ListProductsInput struct {
	Filter repository.ProductFilter
}

// ListProductsOutput 列出商品输出
type ListProductsOutput struct {
	Products   []*model.Product
	TotalCount int
	Page       int
	Limit      int
	HasMore    bool
}

// ShelveProductInput 上架商品输入
type ShelveProductInput struct {
	OperatorID string // 操作人 ID
	ProductID  string // 商品 ID
	Quantity   int    // 上架数量
}

// ShelveProductOutput 上架商品输出
type ShelveProductOutput struct {
	Product *model.Product
}

// UnshelveProductInput 下架商品输入
type UnshelveProductInput struct {
	OperatorID string // 操作人 ID
	ProductID  string // 商品 ID
}

// UnshelveProductOutput 下架商品输出
type UnshelveProductOutput struct {
	Product *model.Product
}

// DeductInventoryInput 扣减库存输入
type DeductInventoryInput struct {
	ProductID    string  // 商品 ID
	Quantity     int     // 扣减数量
	UserID       string  // 用户 ID
	RedemptionID string  // 兑换订单 ID
	CoinRate     float64 // 金币汇率（金币 -> 人民币）
}

// DeductInventoryOutput 扣减库存输出
type DeductInventoryOutput struct {
	Product *model.Product
}

// DeleteProductInput 删除商品输入
type DeleteProductInput struct {
	OperatorID string // 操作人 ID
	ProductID  string // 商品 ID
}

// DeleteProductOutput 删除商品输出
type DeleteProductOutput struct {
	Success   bool
	DeletedAt time.Time
}

// CreateProduct 创建商品（用例实现）
//
// 对应 usecases.yaml 中的 CreateProduct
func (s *ProductService) CreateProduct(ctx context.Context, input CreateProductInput) (*CreateProductOutput, error) {
	// Step 1: ValidateInput - 业务规则验证
	if input.OperatorID == "" {
		return nil, fmt.Errorf("OPERATOR_ID_REQUIRED: 操作人 ID 不能为空")
	}
	if input.Name == "" {
		return nil, fmt.Errorf("PRODUCT_NAME_EMPTY: 商品名称不能为空")
	}

	// Step 2 & 3: CreateProductEntity - 创建商品实体
	coinType := input.CoinType
	if coinType == "" {
		coinType = model.CoinTypeGold // 默认金币
	}

	product, err := model.NewProduct(input.OperatorID, input.Name, input.InitialCoins, coinType, input.Stock)
	if err != nil {
		return nil, err // 直接返回 Model 层的错误
	}

	// 设置可选字段
	product.ImageURL = input.ImageURL
	product.Description = input.Description
	product.PurchaseLimit = input.PurchaseLimit
	product.Cost = input.Cost

	// Step 4: SaveProduct - 保存商品
	if err := s.productRepo.Create(ctx, product); err != nil {
		return nil, fmt.Errorf("CREATION_FAILED: 保存商品失败: %w", err)
	}

	// Step 5: PublishProductCreatedEvent
	// Extension point: 发布事件到事件总线
	log.Printf("Product created: %s", product.ID)

	return &CreateProductOutput{Product: product}, nil
}

// UpdateProduct 更新商品（用例实现）
//
// 对应 usecases.yaml 中的 UpdateProduct
func (s *ProductService) UpdateProduct(ctx context.Context, input UpdateProductInput) (*UpdateProductOutput, error) {
	// Step 1: ValidateInput
	if input.OperatorID == "" {
		return nil, fmt.Errorf("OPERATOR_ID_REQUIRED: 操作人 ID 不能为空")
	}

	// Step 2: GetProduct
	product, err := s.productRepo.FindByID(ctx, input.ProductID)
	if err != nil {
		return nil, err // 包含 PRODUCT_NOT_FOUND
	}

	// 更新操作人
	product.OperatorID = input.OperatorID

	// Step 3: ValidateStockUpdate & UpdateProductFields
	if err := product.Update(input.Name, input.Description, input.ImageURL, input.InitialCoins, input.Stock, input.Cost, input.PurchaseLimit); err != nil {
		return nil, err
	}

	// Step 4: SaveProduct
	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, fmt.Errorf("UPDATE_FAILED: 更新商品失败: %w", err)
	}

	// Step 5: PublishProductUpdatedEvent
	log.Printf("Product updated: %s", product.ID)

	return &UpdateProductOutput{Product: product}, nil
}

// GetProduct 获取商品详情（用例实现）
//
// 对应 usecases.yaml 中的 GetProduct
func (s *ProductService) GetProduct(ctx context.Context, input GetProductInput) (*GetProductOutput, error) {
	// Step 1: GetProduct
	product, err := s.productRepo.FindByID(ctx, input.ProductID)
	if err != nil {
		return nil, err // 包含 PRODUCT_NOT_FOUND
	}

	return &GetProductOutput{Product: product}, nil
}

// ListProducts 列出商品（用例实现）
//
// 对应 usecases.yaml 中的 ListProducts
func (s *ProductService) ListProducts(ctx context.Context, input ListProductsInput) (*ListProductsOutput, error) {
	// Step 1: ValidateQueryParams（已在 Filter 中完成）

	// Step 2 & 3: QueryProducts + CountTotalProducts
	products, totalCount, err := s.productRepo.List(ctx, &input.Filter)
	if err != nil {
		return nil, fmt.Errorf("QUERY_FAILED: 查询失败: %w", err)
	}

	// Step 4: FormatResponse
	hasMore := (input.Filter.Page * input.Filter.Limit) < totalCount

	return &ListProductsOutput{
		Products:   products,
		TotalCount: totalCount,
		Page:       input.Filter.Page,
		Limit:      input.Filter.Limit,
		HasMore:    hasMore,
	}, nil
}

// ShelveProduct 上架商品（用例实现）
//
// 对应 usecases.yaml 中的 ShelveProduct
func (s *ProductService) ShelveProduct(ctx context.Context, input ShelveProductInput) (*ShelveProductOutput, error) {
	// Step 1: ValidateInput
	if input.OperatorID == "" {
		return nil, fmt.Errorf("OPERATOR_ID_REQUIRED: 操作人 ID 不能为空")
	}
	if input.Quantity <= 0 {
		return nil, fmt.Errorf("INVALID_SHELVE_QUANTITY: 上架数量必须大于 0")
	}

	// Step 2: GetProduct
	product, err := s.productRepo.FindByID(ctx, input.ProductID)
	if err != nil {
		return nil, err // 包含 PRODUCT_NOT_FOUND
	}

	// 更新操作人
	product.OperatorID = input.OperatorID

	// Step 3-5: CheckStatus, ValidateStock, MarkAsShelved, UpdateListedQuantity
	if err := product.Shelve(input.Quantity); err != nil {
		return nil, err
	}

	// Step 6: SaveProduct
	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, fmt.Errorf("SHELVE_FAILED: 上架失败: %w", err)
	}

	// Step 7: PublishProductShelvedEvent
	log.Printf("Product shelved: %s, quantity: %d", product.ID, input.Quantity)

	return &ShelveProductOutput{Product: product}, nil
}

// UnshelveProduct 下架商品（用例实现）
//
// 对应 usecases.yaml 中的 UnshelveProduct
func (s *ProductService) UnshelveProduct(ctx context.Context, input UnshelveProductInput) (*UnshelveProductOutput, error) {
	// Step 1: ValidateInput
	if input.OperatorID == "" {
		return nil, fmt.Errorf("OPERATOR_ID_REQUIRED: 操作人 ID 不能为空")
	}

	// Step 2: GetProduct
	product, err := s.productRepo.FindByID(ctx, input.ProductID)
	if err != nil {
		return nil, err // 包含 PRODUCT_NOT_FOUND
	}

	// 更新操作人
	product.OperatorID = input.OperatorID

	// Step 3: CheckStatus, MarkAsUnshelved
	if err := product.Unshelve(); err != nil {
		return nil, err
	}

	// Step 4: SaveProduct
	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, fmt.Errorf("UNSHELVE_FAILED: 下架失败: %w", err)
	}

	// Step 5: PublishProductUnshelvedEvent
	log.Printf("Product unshelved: %s", product.ID)

	return &UnshelveProductOutput{Product: product}, nil
}

// DeductInventory 扣减库存（用例实现）
//
// 对应 usecases.yaml 中的 DeductInventory
//
// 注意：此方法需要在事务中调用，由调用方（Redemption Domain）管理事务
func (s *ProductService) DeductInventory(ctx context.Context, input DeductInventoryInput) (*DeductInventoryOutput, error) {
	// Step 1: ValidateInput
	if input.ProductID == "" {
		return nil, fmt.Errorf("PRODUCT_ID_REQUIRED: 商品 ID 不能为空")
	}
	if input.Quantity <= 0 {
		return nil, fmt.Errorf("INVALID_QUANTITY: 扣减数量必须大于 0")
	}
	if input.UserID == "" {
		return nil, fmt.Errorf("USER_ID_REQUIRED: 用户 ID 不能为空")
	}
	if input.RedemptionID == "" {
		return nil, fmt.Errorf("REDEMPTION_ID_REQUIRED: 兑换订单 ID 不能为空")
	}

	// Step 2: LockProduct & GetProduct（使用行锁）
	product, err := s.productRepo.FindByIDForUpdate(ctx, input.ProductID)
	if err != nil {
		return nil, err // 包含 PRODUCT_NOT_FOUND
	}

	// Step 3-5: CheckStatus, ValidateStock, DeductStock
	coinRate := input.CoinRate
	if coinRate == 0 {
		coinRate = 1.0 // 默认汇率 1:1
	}

	if err := product.DeductInventory(input.Quantity, coinRate); err != nil {
		return nil, err
	}

	// Step 6: SaveProduct
	if err := s.productRepo.Update(ctx, product); err != nil {
		return nil, fmt.Errorf("DEDUCT_FAILED: 扣减库存失败: %w", err)
	}

	// Step 7: PublishInventoryDeductedEvent
	log.Printf("Inventory deducted: product=%s, quantity=%d, user=%s, redemption=%s",
		product.ID, input.Quantity, input.UserID, input.RedemptionID)

	return &DeductInventoryOutput{Product: product}, nil
}

// DeleteProduct 删除商品（用例实现）
//
// 对应 usecases.yaml 中的 DeleteProduct
func (s *ProductService) DeleteProduct(ctx context.Context, input DeleteProductInput) (*DeleteProductOutput, error) {
	// Step 1: ValidateInput
	if input.OperatorID == "" {
		return nil, fmt.Errorf("OPERATOR_ID_REQUIRED: 操作人 ID 不能为空")
	}

	// Step 2: GetProduct
	product, err := s.productRepo.FindByID(ctx, input.ProductID)
	if err != nil {
		return nil, err // 包含 PRODUCT_NOT_FOUND
	}

	// Step 3: ValidateDeletion
	canDelete, err := product.CanDelete()
	if !canDelete {
		return nil, err
	}

	// Step 4: DeleteProductRecord
	if err := s.productRepo.Delete(ctx, input.ProductID); err != nil {
		return nil, fmt.Errorf("DELETION_FAILED: 删除商品失败: %w", err)
	}

	// Step 5: PublishProductDeletedEvent
	log.Printf("Product deleted: %s by operator %s", input.ProductID, input.OperatorID)

	deletedAt := time.Now()
	return &DeleteProductOutput{
		Success:   true,
		DeletedAt: deletedAt,
	}, nil
}
