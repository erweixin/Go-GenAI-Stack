package tests

import (
	"context"
	"testing"

	"github.com/erweixin/go-genai-stack/backend/domains/product/model"
	"github.com/erweixin/go-genai-stack/backend/domains/product/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockProductRepository 模拟商品仓储
type MockProductRepository struct {
	mock.Mock
}

func (m *MockProductRepository) Create(ctx context.Context, product *model.Product) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockProductRepository) Update(ctx context.Context, product *model.Product) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockProductRepository) FindByID(ctx context.Context, id string) (*model.Product, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Product), args.Error(1)
}

func (m *MockProductRepository) FindByIDForUpdate(ctx context.Context, id string) (*model.Product, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Product), args.Error(1)
}

func (m *MockProductRepository) List(ctx context.Context, filter interface{}) ([]*model.Product, int, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*model.Product), args.Int(1), args.Error(2)
}

func (m *MockProductRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockProductRepository) Exists(ctx context.Context, id string) (bool, error) {
	args := m.Called(ctx, id)
	return args.Bool(0), args.Error(1)
}

// TestCreateProduct_Success 测试创建商品成功
func TestCreateProduct_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockProductRepository)
	svc := service.NewProductService(mockRepo)

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*model.Product")).Return(nil)

	input := service.CreateProductInput{
		OperatorID:   "operator-123",
		Name:         "测试商品",
		Description:  "这是一个测试商品",
		InitialCoins: 100,
		CoinType:     model.CoinTypeGold,
		Stock:        50,
	}

	// Act
	output, err := svc.CreateProduct(context.Background(), input)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, output)
	assert.NotNil(t, output.Product)
	assert.Equal(t, "测试商品", output.Product.Name)
	assert.Equal(t, 100, output.Product.InitialCoins)
	assert.Equal(t, 50, output.Product.Stock)
	assert.Equal(t, model.StatusOffShelf, output.Product.Status)
	mockRepo.AssertExpectations(t)
}

// TestCreateProduct_EmptyName 测试商品名称为空
func TestCreateProduct_EmptyName(t *testing.T) {
	// Arrange
	mockRepo := new(MockProductRepository)
	svc := service.NewProductService(mockRepo)

	input := service.CreateProductInput{
		OperatorID:   "operator-123",
		Name:         "", // 空名称
		InitialCoins: 100,
		CoinType:     model.CoinTypeGold,
		Stock:        50,
	}

	// Act
	output, err := svc.CreateProduct(context.Background(), input)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, output)
	assert.Contains(t, err.Error(), "PRODUCT_NAME_EMPTY")
}

// TestCreateProduct_InvalidCoins 测试初始金币无效
func TestCreateProduct_InvalidCoins(t *testing.T) {
	// Arrange
	mockRepo := new(MockProductRepository)
	svc := service.NewProductService(mockRepo)

	input := service.CreateProductInput{
		OperatorID:   "operator-123",
		Name:         "测试商品",
		InitialCoins: 0, // 无效的金币数
		CoinType:     model.CoinTypeGold,
		Stock:        50,
	}

	// Act
	output, err := svc.CreateProduct(context.Background(), input)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, output)
	assert.Contains(t, err.Error(), "INVALID_COINS")
}

// TestCreateProduct_NegativeStock 测试库存为负数
func TestCreateProduct_NegativeStock(t *testing.T) {
	// Arrange
	mockRepo := new(MockProductRepository)
	svc := service.NewProductService(mockRepo)

	input := service.CreateProductInput{
		OperatorID:   "operator-123",
		Name:         "测试商品",
		InitialCoins: 100,
		CoinType:     model.CoinTypeGold,
		Stock:        -10, // 负数库存
	}

	// Act
	output, err := svc.CreateProduct(context.Background(), input)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, output)
	assert.Contains(t, err.Error(), "INVALID_STOCK")
}

