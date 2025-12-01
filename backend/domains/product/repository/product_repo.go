package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
)

// ProductRepositoryImpl 商品仓储实现
//
// 使用 database/sql + PostgreSQL（不使用 ORM）
type ProductRepositoryImpl struct {
	db *sql.DB
}

// NewProductRepository 创建商品仓储实例
//
// 参数：
//   - db: 数据库连接
//
// 返回：
//   - ProductRepository: 仓储实例
func NewProductRepository(db *sql.DB) ProductRepository {
	return &ProductRepositoryImpl{
		db: db,
	}
}

// Create 创建商品
func (r *ProductRepositoryImpl) Create(ctx context.Context, product *model.Product) error {
	query := `
		INSERT INTO products (
			id, name, image_url, description,
			initial_coins, coin_type,
			stock, listed_quantity, listed_limit, redeemed_count, available_quantity,
			sales_count, purchase_limit,
			cost, revenue,
			status, operator_id,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4,
			$5, $6,
			$7, $8, $9, $10, $11,
			$12, $13,
			$14, $15,
			$16, $17,
			$18, $19
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		product.ID, product.Name, product.ImageURL, product.Description,
		product.InitialCoins, product.CoinType,
		product.Stock, product.ListedQuantity, product.ListedLimit, product.RedeemedCount, product.AvailableQuantity,
		product.SalesCount, product.PurchaseLimit,
		product.Cost, product.Revenue,
		product.Status, product.OperatorID,
		product.CreatedAt, product.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("创建商品失败: %w", err)
	}

	return nil
}

// Update 更新商品
func (r *ProductRepositoryImpl) Update(ctx context.Context, product *model.Product) error {
	query := `
		UPDATE products SET
			name = $1,
			image_url = $2,
			description = $3,
			initial_coins = $4,
			coin_type = $5,
			stock = $6,
			listed_quantity = $7,
			listed_limit = $8,
			redeemed_count = $9,
			available_quantity = $10,
			sales_count = $11,
			purchase_limit = $12,
			cost = $13,
			revenue = $14,
			status = $15,
			operator_id = $16,
			updated_at = $17
		WHERE id = $18
	`

	result, err := r.db.ExecContext(ctx, query,
		product.Name, product.ImageURL, product.Description,
		product.InitialCoins, product.CoinType,
		product.Stock, product.ListedQuantity, product.ListedLimit, product.RedeemedCount, product.AvailableQuantity,
		product.SalesCount, product.PurchaseLimit,
		product.Cost, product.Revenue,
		product.Status, product.OperatorID,
		product.UpdatedAt,
		product.ID,
	)

	if err != nil {
		return fmt.Errorf("更新商品失败: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取受影响行数失败: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("PRODUCT_NOT_FOUND: 商品不存在")
	}

	return nil
}

// FindByID 根据 ID 获取商品
func (r *ProductRepositoryImpl) FindByID(ctx context.Context, id string) (*model.Product, error) {
	query := `
		SELECT
			id, name, image_url, description,
			initial_coins, coin_type,
			stock, listed_quantity, listed_limit, redeemed_count, available_quantity,
			sales_count, purchase_limit,
			cost, revenue,
			status, operator_id,
			created_at, updated_at
		FROM products
		WHERE id = $1
	`

	product := &model.Product{}
	var listedLimit, purchaseLimit sql.NullInt64
	var cost sql.NullFloat64

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&product.ID, &product.Name, &product.ImageURL, &product.Description,
		&product.InitialCoins, &product.CoinType,
		&product.Stock, &product.ListedQuantity, &listedLimit, &product.RedeemedCount, &product.AvailableQuantity,
		&product.SalesCount, &purchaseLimit,
		&cost, &product.Revenue,
		&product.Status, &product.OperatorID,
		&product.CreatedAt, &product.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("PRODUCT_NOT_FOUND: 商品不存在")
	}

	if err != nil {
		return nil, fmt.Errorf("查询商品失败: %w", err)
	}

	// 处理 NULL 值
	if listedLimit.Valid {
		val := int(listedLimit.Int64)
		product.ListedLimit = &val
	}
	if purchaseLimit.Valid {
		val := int(purchaseLimit.Int64)
		product.PurchaseLimit = &val
	}
	if cost.Valid {
		product.Cost = &cost.Float64
	}

	return product, nil
}

// FindByIDForUpdate 根据 ID 获取商品（使用行锁）
//
// 使用 SELECT ... FOR UPDATE 防止并发问题
func (r *ProductRepositoryImpl) FindByIDForUpdate(ctx context.Context, id string) (*model.Product, error) {
	query := `
		SELECT
			id, name, image_url, description,
			initial_coins, coin_type,
			stock, listed_quantity, listed_limit, redeemed_count, available_quantity,
			sales_count, purchase_limit,
			cost, revenue,
			status, operator_id,
			created_at, updated_at
		FROM products
		WHERE id = $1
		FOR UPDATE
	`

	product := &model.Product{}
	var listedLimit, purchaseLimit sql.NullInt64
	var cost sql.NullFloat64

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&product.ID, &product.Name, &product.ImageURL, &product.Description,
		&product.InitialCoins, &product.CoinType,
		&product.Stock, &product.ListedQuantity, &listedLimit, &product.RedeemedCount, &product.AvailableQuantity,
		&product.SalesCount, &purchaseLimit,
		&cost, &product.Revenue,
		&product.Status, &product.OperatorID,
		&product.CreatedAt, &product.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("PRODUCT_NOT_FOUND: 商品不存在")
	}

	if err != nil {
		return nil, fmt.Errorf("查询商品失败: %w", err)
	}

	// 处理 NULL 值
	if listedLimit.Valid {
		val := int(listedLimit.Int64)
		product.ListedLimit = &val
	}
	if purchaseLimit.Valid {
		val := int(purchaseLimit.Int64)
		product.PurchaseLimit = &val
	}
	if cost.Valid {
		product.Cost = &cost.Float64
	}

	return product, nil
}

// List 查询商品列表
func (r *ProductRepositoryImpl) List(ctx context.Context, filter *ProductFilter) ([]*model.Product, int, error) {
	// 规范化过滤器
	filter.Normalize()

	// 构建 WHERE 子句
	whereClauses := []string{}
	args := []interface{}{}
	argIndex := 1

	if filter.Status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *filter.Status)
		argIndex++
	}

	if filter.CoinType != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("coin_type = $%d", argIndex))
		args = append(args, *filter.CoinType)
		argIndex++
	}

	if filter.Keyword != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("name ILIKE $%d", argIndex))
		args = append(args, "%"+filter.Keyword+"%")
		argIndex++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products %s", whereSQL)
	var totalCount int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("查询商品总数失败: %w", err)
	}

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT
			id, name, image_url, description,
			initial_coins, coin_type,
			stock, listed_quantity, listed_limit, redeemed_count, available_quantity,
			sales_count, purchase_limit,
			cost, revenue,
			status, operator_id,
			created_at, updated_at
		FROM products
		%s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereSQL, filter.SortBy, strings.ToUpper(filter.SortOrder), argIndex, argIndex+1)

	args = append(args, filter.Limit, filter.Offset())

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("查询商品列表失败: %w", err)
	}
	defer rows.Close()

	products := []*model.Product{}
	for rows.Next() {
		product := &model.Product{}
		var listedLimit, purchaseLimit sql.NullInt64
		var cost sql.NullFloat64

		err := rows.Scan(
			&product.ID, &product.Name, &product.ImageURL, &product.Description,
			&product.InitialCoins, &product.CoinType,
			&product.Stock, &product.ListedQuantity, &listedLimit, &product.RedeemedCount, &product.AvailableQuantity,
			&product.SalesCount, &purchaseLimit,
			&cost, &product.Revenue,
			&product.Status, &product.OperatorID,
			&product.CreatedAt, &product.UpdatedAt,
		)

		if err != nil {
			return nil, 0, fmt.Errorf("扫描商品记录失败: %w", err)
		}

		// 处理 NULL 值
		if listedLimit.Valid {
			val := int(listedLimit.Int64)
			product.ListedLimit = &val
		}
		if purchaseLimit.Valid {
			val := int(purchaseLimit.Int64)
			product.PurchaseLimit = &val
		}
		if cost.Valid {
			product.Cost = &cost.Float64
		}

		products = append(products, product)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("遍历商品记录失败: %w", err)
	}

	return products, totalCount, nil
}

// Delete 删除商品
func (r *ProductRepositoryImpl) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM products WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("删除商品失败: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取受影响行数失败: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("PRODUCT_NOT_FOUND: 商品不存在")
	}

	return nil
}

// Exists 检查商品是否存在
func (r *ProductRepositoryImpl) Exists(ctx context.Context, id string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, id).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("检查商品是否存在失败: %w", err)
	}

	return exists, nil
}
