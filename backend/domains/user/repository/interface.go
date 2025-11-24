package repository

import (
	"context"

	"github.com/erweixin/go-genai-stack/backend/domains/user/model"
)

// UserRepository 用户仓储接口
//
// 定义用户数据访问的抽象接口
// 实现数据持久化和查询操作
type UserRepository interface {
	// Create 创建用户
	//
	// 参数：
	//   - ctx: 上下文
	//   - user: 用户实体
	//
	// 返回：
	//   - error: 错误信息（如邮箱/用户名重复）
	Create(ctx context.Context, user *model.User) error

	// GetByID 根据 ID 获取用户
	//
	// 参数：
	//   - ctx: 上下文
	//   - userID: 用户 ID
	//
	// 返回：
	//   - *model.User: 用户实体
	//   - error: 错误信息（如用户不存在）
	GetByID(ctx context.Context, userID string) (*model.User, error)

	// GetByEmail 根据邮箱获取用户
	//
	// 参数：
	//   - ctx: 上下文
	//   - email: 邮箱
	//
	// 返回：
	//   - *model.User: 用户实体
	//   - error: 错误信息（如用户不存在）
	GetByEmail(ctx context.Context, email string) (*model.User, error)

	// GetByUsername 根据用户名获取用户
	//
	// 参数：
	//   - ctx: 上下文
	//   - username: 用户名
	//
	// 返回：
	//   - *model.User: 用户实体
	//   - error: 错误信息（如用户不存在）
	GetByUsername(ctx context.Context, username string) (*model.User, error)

	// Update 更新用户信息
	//
	// 参数：
	//   - ctx: 上下文
	//   - user: 用户实体
	//
	// 返回：
	//   - error: 错误信息
	Update(ctx context.Context, user *model.User) error

	// Delete 删除用户
	//
	// 参数：
	//   - ctx: 上下文
	//   - userID: 用户 ID
	//
	// 返回：
	//   - error: 错误信息
	Delete(ctx context.Context, userID string) error

	// ExistsByEmail 检查邮箱是否存在
	//
	// 参数：
	//   - ctx: 上下文
	//   - email: 邮箱
	//
	// 返回：
	//   - bool: 是否存在
	//   - error: 错误信息
	ExistsByEmail(ctx context.Context, email string) (bool, error)

	// ExistsByUsername 检查用户名是否存在
	//
	// 参数：
	//   - ctx: 上下文
	//   - username: 用户名
	//
	// 返回：
	//   - bool: 是否存在
	//   - error: 错误信息
	ExistsByUsername(ctx context.Context, username string) (bool, error)
}

