package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/doug-martin/goqu/v9"
	"github.com/erweixin/go-genai-stack/backend/domains/user/model"
	"github.com/lib/pq"
)

// userRepository 用户仓储实现
//
// 使用 database/sql + goqu 实现数据访问。
// 使用 goqu 作为 SQL 构建器，支持多数据库方言（PostgreSQL、MySQL、SQLite）。
type userRepository struct {
	db      *sql.DB
	dialect goqu.DialectWrapper
}

// NewUserRepository 创建用户仓储实例
//
// 参数：
//   - db: 数据库连接
//   - dbType: 数据库类型（postgres, mysql, sqlite），用于选择 SQL 方言
//
// 返回：
//   - UserRepository: 用户仓储接口
func NewUserRepository(db *sql.DB, dbType string) UserRepository {
	// 映射数据库类型到 goqu dialect
	var dialect goqu.DialectWrapper
	switch dbType {
	case "postgres":
		dialect = goqu.Dialect("postgres")
	case "mysql":
		dialect = goqu.Dialect("mysql")
	case "sqlite":
		dialect = goqu.Dialect("sqlite3")
	default:
		// 默认使用 postgres（向后兼容）
		dialect = goqu.Dialect("postgres")
	}

	return &userRepository{
		db:      db,
		dialect: dialect,
	}
}

// Create 创建用户
func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	// 使用 goqu 构建 INSERT 语句
	query, args, err := r.dialect.Insert("users").
		Cols("id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at").
		Vals(goqu.Vals{
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
		}).
		ToSQL()
	if err != nil {
		return fmt.Errorf("构建插入查询失败: %w", err)
	}

	_, err = r.db.ExecContext(ctx, query, args...)

	if err != nil {
		// 检查是否是唯一性约束冲突（PostgreSQL 特有）
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
	// 使用 goqu 构建 SELECT 语句
	query, args, err := r.dialect.From("users").
		Select("id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at").
		Where(goqu.C("id").Eq(userID)).
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("构建查询失败: %w", err)
	}

	user := &model.User{}
	var username, fullName, avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	err = r.db.QueryRowContext(ctx, query, args...).Scan(
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
	// 使用 goqu 构建 SELECT 语句
	query, args, err := r.dialect.From("users").
		Select("id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at").
		Where(goqu.C("email").Eq(email)).
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("构建查询失败: %w", err)
	}

	user := &model.User{}
	var username, fullName, avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	err = r.db.QueryRowContext(ctx, query, args...).Scan(
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
	// 使用 goqu 构建 SELECT 语句
	query, args, err := r.dialect.From("users").
		Select("id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at").
		Where(goqu.C("username").Eq(username)).
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("构建查询失败: %w", err)
	}

	user := &model.User{}
	var usernameVal, fullName, avatarURL sql.NullString
	var lastLoginAt sql.NullTime

	err = r.db.QueryRowContext(ctx, query, args...).Scan(
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
	// 使用 goqu 构建 UPDATE 语句
	query, args, err := r.dialect.Update("users").
		Set(goqu.Record{
			"email":          user.Email,
			"username":       nullString(user.Username),
			"password_hash":  user.PasswordHash,
			"full_name":      nullString(user.FullName),
			"avatar_url":     nullString(user.AvatarURL),
			"status":         string(user.Status),
			"email_verified": user.EmailVerified,
			"updated_at":     user.UpdatedAt,
			"last_login_at":  nullTime(user.LastLoginAt),
		}).
		Where(goqu.C("id").Eq(user.ID)).
		ToSQL()
	if err != nil {
		return fmt.Errorf("构建更新查询失败: %w", err)
	}

	result, err := r.db.ExecContext(ctx, query, args...)

	if err != nil {
		// 检查是否是唯一性约束冲突（PostgreSQL 特有）
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
	// 使用 goqu 构建 DELETE 语句
	query, args, err := r.dialect.Delete("users").
		Where(goqu.C("id").Eq(userID)).
		ToSQL()
	if err != nil {
		return fmt.Errorf("构建删除查询失败: %w", err)
	}

	result, err := r.db.ExecContext(ctx, query, args...)
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
	// 使用 goqu 构建 EXISTS 查询
	query, args, err := r.dialect.Select(goqu.L("EXISTS(?)", r.dialect.From("users").
		Select(goqu.L("1")).
		Where(goqu.C("email").Eq(email)))).
		ToSQL()
	if err != nil {
		return false, fmt.Errorf("构建查询失败: %w", err)
	}

	var exists bool
	err = r.db.QueryRowContext(ctx, query, args...).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("检查邮箱是否存在失败: %w", err)
	}

	return exists, nil
}

// ExistsByUsername 检查用户名是否存在
func (r *userRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	// 使用 goqu 构建 EXISTS 查询
	query, args, err := r.dialect.Select(goqu.L("EXISTS(?)", r.dialect.From("users").
		Select(goqu.L("1")).
		Where(goqu.C("username").Eq(username)))).
		ToSQL()
	if err != nil {
		return false, fmt.Errorf("构建查询失败: %w", err)
	}

	var exists bool
	err = r.db.QueryRowContext(ctx, query, args...).Scan(&exists)
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
