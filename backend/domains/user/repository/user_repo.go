package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/erweixin/go-genai-stack/backend/domains/user/model"
	"github.com/lib/pq"
)

// userRepository 用户仓储实现
//
// 使用 database/sql 实现数据访问
type userRepository struct {
	db *sql.DB
}

// NewUserRepository 创建用户仓储实例
//
// 参数：
//   - db: 数据库连接
//
// 返回：
//   - UserRepository: 用户仓储接口
func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

// Create 创建用户
func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	query := `
		INSERT INTO users (
			id, email, username, password_hash, full_name, avatar_url,
			status, email_verified, created_at, updated_at, last_login_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := r.db.ExecContext(ctx, query,
		user.ID,
		user.Email,
		nullString(user.Username),
		user.PasswordHash,
		nullString(user.FullName),
		nullString(user.AvatarURL),
		string(user.Status),
		user.EmailVerified,
		user.CreatedAt,
		user.UpdatedAt,
		nullTime(user.LastLoginAt),
	)

	if err != nil {
		// 检查是否是唯一性约束冲突
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique_violation
				if pqErr.Constraint == "users_email_key" {
					return model.ErrEmailAlreadyExists
				}
				if pqErr.Constraint == "users_username_key" {
					return model.ErrUsernameAlreadyExists
				}
			}
		}
		return fmt.Errorf("创建用户失败: %w", err)
	}

	return nil
}

// GetByID 根据 ID 获取用户
func (r *userRepository) GetByID(ctx context.Context, userID string) (*model.User, error) {
	query := `
		SELECT id, email, username, password_hash, full_name, avatar_url,
		       status, email_verified, created_at, updated_at, last_login_at
		FROM users
		WHERE id = $1
	`

	user := &model.User{}
	var username, fullName, avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.Email,
		&username,
		&user.PasswordHash,
		&fullName,
		&avatarURL,
		&user.Status,
		&user.EmailVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
		&lastLoginAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, model.ErrUserNotFound
		}
		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	// 处理 NULL 字段
	user.Username = username.String
	user.FullName = fullName.String
	user.AvatarURL = avatarURL.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return user, nil
}

// GetByEmail 根据邮箱获取用户
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `
		SELECT id, email, username, password_hash, full_name, avatar_url,
		       status, email_verified, created_at, updated_at, last_login_at
		FROM users
		WHERE email = $1
	`

	user := &model.User{}
	var username, fullName, avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&username,
		&user.PasswordHash,
		&fullName,
		&avatarURL,
		&user.Status,
		&user.EmailVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
		&lastLoginAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, model.ErrUserNotFound
		}
		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	// 处理 NULL 字段
	user.Username = username.String
	user.FullName = fullName.String
	user.AvatarURL = avatarURL.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return user, nil
}

// GetByUsername 根据用户名获取用户
func (r *userRepository) GetByUsername(ctx context.Context, username string) (*model.User, error) {
	query := `
		SELECT id, email, username, password_hash, full_name, avatar_url,
		       status, email_verified, created_at, updated_at, last_login_at
		FROM users
		WHERE username = $1
	`

	user := &model.User{}
	var usernameVal, fullName, avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Email,
		&usernameVal,
		&user.PasswordHash,
		&fullName,
		&avatarURL,
		&user.Status,
		&user.EmailVerified,
		&user.CreatedAt,
		&user.UpdatedAt,
		&lastLoginAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, model.ErrUserNotFound
		}
		return nil, fmt.Errorf("查询用户失败: %w", err)
	}

	// 处理 NULL 字段
	user.Username = usernameVal.String
	user.FullName = fullName.String
	user.AvatarURL = avatarURL.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return user, nil
}

// Update 更新用户信息
func (r *userRepository) Update(ctx context.Context, user *model.User) error {
	query := `
		UPDATE users
		SET email = $2, username = $3, password_hash = $4, full_name = $5,
		    avatar_url = $6, status = $7, email_verified = $8,
		    updated_at = $9, last_login_at = $10
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query,
		user.ID,
		user.Email,
		nullString(user.Username),
		user.PasswordHash,
		nullString(user.FullName),
		nullString(user.AvatarURL),
		string(user.Status),
		user.EmailVerified,
		user.UpdatedAt,
		nullTime(user.LastLoginAt),
	)

	if err != nil {
		// 检查是否是唯一性约束冲突
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique_violation
				if pqErr.Constraint == "users_email_key" {
					return model.ErrEmailAlreadyExists
				}
				if pqErr.Constraint == "users_username_key" {
					return model.ErrUsernameAlreadyExists
				}
			}
		}
		return fmt.Errorf("更新用户失败: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}

	if rowsAffected == 0 {
		return model.ErrUserNotFound
	}

	return nil
}

// Delete 删除用户
func (r *userRepository) Delete(ctx context.Context, userID string) error {
	query := `DELETE FROM users WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("删除用户失败: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("获取影响行数失败: %w", err)
	}

	if rowsAffected == 0 {
		return model.ErrUserNotFound
	}

	return nil
}

// ExistsByEmail 检查邮箱是否存在
func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("检查邮箱是否存在失败: %w", err)
	}

	return exists, nil
}

// ExistsByUsername 检查用户名是否存在
func (r *userRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, username).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("检查用户名是否存在失败: %w", err)
	}

	return exists, nil
}

// --- 辅助函数 ---

// nullString 将空字符串转为 sql.NullString
func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

// nullTime 将 nil 时间转为 sql.NullTime
func nullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: *t, Valid: true}
}
