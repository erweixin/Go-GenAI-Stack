package dto

// CreateProductRequest 创建商品请求
type CreateProductRequest struct {
	Name          string   `json:"name" binding:"required,max=200"`
	ImageURL      string   `json:"image_url" binding:"omitempty,url"`
	Description   string   `json:"description" binding:"omitempty,max=5000"`
	InitialCoins  int      `json:"initial_coins" binding:"required,gt=0"`
	CoinType      string   `json:"coin_type" binding:"omitempty,oneof=gold silver"`
	Stock         int      `json:"stock" binding:"required,gte=0"`
	PurchaseLimit *int     `json:"purchase_limit" binding:"omitempty,gt=0"`
	Cost          *float64 `json:"cost" binding:"omitempty,gte=0"`
}

// CreateProductResponse 创建商品响应
type CreateProductResponse struct {
	ProductID string `json:"product_id"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

// UpdateProductRequest 更新商品请求
type UpdateProductRequest struct {
	Name          *string  `json:"name" binding:"omitempty,max=200"`
	ImageURL      *string  `json:"image_url" binding:"omitempty,url"`
	Description   *string  `json:"description" binding:"omitempty,max=5000"`
	InitialCoins  *int     `json:"initial_coins" binding:"omitempty,gt=0"`
	Stock         *int     `json:"stock" binding:"omitempty,gte=0"`
	PurchaseLimit *int     `json:"purchase_limit" binding:"omitempty,gt=0"`
	Cost          *float64 `json:"cost" binding:"omitempty,gte=0"`
}

// UpdateProductResponse 更新商品响应
type UpdateProductResponse struct {
	ProductID string `json:"product_id"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	UpdatedAt string `json:"updated_at"`
}

// ProductResponse 商品详情响应
type ProductResponse struct {
	ID                string   `json:"id"`
	Name              string   `json:"name"`
	ImageURL          string   `json:"image_url"`
	Description       string   `json:"description"`
	InitialCoins      int      `json:"initial_coins"`
	CoinType          string   `json:"coin_type"`
	Stock             int      `json:"stock"`
	ListedQuantity    int      `json:"listed_quantity"`
	ListedLimit       *int     `json:"listed_limit"`
	RedeemedCount     int      `json:"redeemed_count"`
	AvailableQuantity int      `json:"available_quantity"`
	SalesCount        int      `json:"sales_count"`
	PurchaseLimit     *int     `json:"purchase_limit"`
	Cost              *float64 `json:"cost"`
	Revenue           float64  `json:"revenue"`
	Status            string   `json:"status"`
	OperatorID        string   `json:"operator_id"`
	CreatedAt         string   `json:"created_at"`
	UpdatedAt         string   `json:"updated_at"`
}

// ListProductsRequest 列出商品请求
type ListProductsRequest struct {
	Status    string `query:"status" binding:"omitempty,oneof=on_shelf off_shelf"`
	Keyword   string `query:"keyword" binding:"omitempty,max=100"`
	SortBy    string `query:"sort_by" binding:"omitempty,oneof=created_at initial_coins redeemed_count updated_at"`
	SortOrder string `query:"sort_order" binding:"omitempty,oneof=asc desc"`
	Page      int    `query:"page" binding:"omitempty,min=1"`
	Limit     int    `query:"limit" binding:"omitempty,min=1,max=100"`
}

// ListProductsResponse 列出商品响应
type ListProductsResponse struct {
	Products   []ProductResponse `json:"products"`
	TotalCount int               `json:"total_count"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	HasMore    bool              `json:"has_more"`
}

// ShelveProductRequest 上架商品请求
type ShelveProductRequest struct {
	Quantity int `json:"quantity" binding:"required,gt=0"`
}

// ShelveProductResponse 上架商品响应
type ShelveProductResponse struct {
	ProductID      string `json:"product_id"`
	Status         string `json:"status"`
	ListedQuantity int    `json:"listed_quantity"`
	ShelvedAt      string `json:"shelved_at"`
}

// UnshelveProductResponse 下架商品响应
type UnshelveProductResponse struct {
	ProductID   string `json:"product_id"`
	Status      string `json:"status"`
	UnshelvedAt string `json:"unshelved_at"`
}

// DeductInventoryRequest 扣减库存请求（内部调用）
type DeductInventoryRequest struct {
	Quantity     int     `json:"quantity" binding:"required,gt=0"`
	UserID       string  `json:"user_id" binding:"required"`
	RedemptionID string  `json:"redemption_id" binding:"required"`
	CoinRate     float64 `json:"coin_rate" binding:"omitempty,gte=0"`
}

// DeductInventoryResponse 扣减库存响应
type DeductInventoryResponse struct {
	ProductID         string `json:"product_id"`
	RedeemedCount     int    `json:"redeemed_count"`
	AvailableQuantity int    `json:"available_quantity"`
	DeductedAt        string `json:"deducted_at"`
}

// DeleteProductResponse 删除商品响应
type DeleteProductResponse struct {
	Success   bool   `json:"success"`
	DeletedAt string `json:"deleted_at"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

