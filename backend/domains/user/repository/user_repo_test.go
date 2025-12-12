package repository

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/erweixin/go-genai-stack/backend/domains/user/model"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestUserRepository_Create 测试创建用户
func TestUserRepository_Create(t *testing.T) {
	t.Run("创建用户成功", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.Username = "testuser"
		user.FullName = "Test User"

		// Mock INSERT users (goqu 将参数值直接嵌入到 SQL 中)
		mock.ExpectExec(`INSERT INTO "users"`).
			WillReturnResult(sqlmock.NewResult(1, 1))

		err = repo.Create(context.Background(), user)

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("创建用户邮箱重复", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")

		// Mock INSERT users 返回唯一性约束冲突
		pqErr := &pq.Error{
			Code:       "23505",
			Constraint: "users_email_key",
		}
		mock.ExpectExec(`INSERT INTO "users"`).
			WillReturnError(pqErr)

		err = repo.Create(context.Background(), user)

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrEmailAlreadyExists)
	})

	t.Run("创建用户用户名重复", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.Username = "testuser"

		// Mock INSERT users 返回唯一性约束冲突
		pqErr := &pq.Error{
			Code:       "23505",
			Constraint: "users_username_key",
		}
		mock.ExpectExec(`INSERT INTO "users"`).
			WillReturnError(pqErr)

		err = repo.Create(context.Background(), user)

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUsernameAlreadyExists)
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")

		mock.ExpectExec(`INSERT INTO "users"`).
			WillReturnError(fmt.Errorf("database error"))

		err = repo.Create(context.Background(), user)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "创建用户失败")
	})
}

// TestUserRepository_GetByID 测试根据ID获取用户
func TestUserRepository_GetByID(t *testing.T) {
	t.Run("获取存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		now := time.Now()

		// Mock SELECT users (goqu 将参数值直接嵌入到 SQL 中)
		rows := sqlmock.NewRows([]string{
			"id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at",
		}).AddRow(
			"user-123", "test@example.com", "testuser", "hash", "Test User", "",
			"active", true, now, now, nil,
		)
		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("id"`).
			WillReturnRows(rows)

		user, err := repo.GetByID(context.Background(), "user-123")

		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "user-123", user.ID)
		assert.Equal(t, "test@example.com", user.Email)
		assert.Equal(t, "testuser", user.Username)
		assert.Equal(t, "Test User", user.FullName)
		assert.Equal(t, model.StatusActive, user.Status)
		assert.True(t, user.EmailVerified)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("获取不存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("id"`).
			WillReturnError(sql.ErrNoRows)

		user, err := repo.GetByID(context.Background(), "nonexistent")

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUserNotFound)
		assert.Nil(t, user)
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("id"`).
			WillReturnError(fmt.Errorf("database error"))

		user, err := repo.GetByID(context.Background(), "user-123")

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "查询用户失败")
	})
}

// TestUserRepository_GetByEmail 测试根据邮箱获取用户
func TestUserRepository_GetByEmail(t *testing.T) {
	t.Run("获取存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		now := time.Now()

		// Mock SELECT users (goqu 将参数值直接嵌入到 SQL 中)
		rows := sqlmock.NewRows([]string{
			"id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at",
		}).AddRow(
			"user-123", "test@example.com", "testuser", "hash", "Test User", "",
			"active", true, now, now, nil,
		)
		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("email"`).
			WillReturnRows(rows)

		user, err := repo.GetByEmail(context.Background(), "test@example.com")

		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "test@example.com", user.Email)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("获取不存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("email"`).
			WillReturnError(sql.ErrNoRows)

		user, err := repo.GetByEmail(context.Background(), "nonexistent@example.com")

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUserNotFound)
		assert.Nil(t, user)
	})
}

// TestUserRepository_GetByUsername 测试根据用户名获取用户
func TestUserRepository_GetByUsername(t *testing.T) {
	t.Run("获取存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		now := time.Now()

		// Mock SELECT users (goqu 将参数值直接嵌入到 SQL 中)
		rows := sqlmock.NewRows([]string{
			"id", "email", "username", "password_hash", "full_name", "avatar_url",
			"status", "email_verified", "created_at", "updated_at", "last_login_at",
		}).AddRow(
			"user-123", "test@example.com", "testuser", "hash", "Test User", "",
			"active", true, now, now, nil,
		)
		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("username"`).
			WillReturnRows(rows)

		user, err := repo.GetByUsername(context.Background(), "testuser")

		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "testuser", user.Username)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("获取不存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectQuery(`SELECT .+ FROM "users" WHERE \("username"`).
			WillReturnError(sql.ErrNoRows)

		user, err := repo.GetByUsername(context.Background(), "nonexistent")

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUserNotFound)
		assert.Nil(t, user)
	})
}

// TestUserRepository_Update 测试更新用户
func TestUserRepository_Update(t *testing.T) {
	t.Run("更新用户成功", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.ID = "user-123"
		user.Username = "updateduser"
		user.FullName = "Updated User"

		// Mock UPDATE (goqu 将参数值直接嵌入到 SQL 中)
		mock.ExpectExec(`UPDATE "users" SET`).
			WillReturnResult(sqlmock.NewResult(0, 1))

		err = repo.Update(context.Background(), user)

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("更新用户邮箱重复", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.ID = "user-123"

		// Mock UPDATE 返回唯一性约束冲突
		pqErr := &pq.Error{
			Code:       "23505",
			Constraint: "users_email_key",
		}
		mock.ExpectExec(`UPDATE "users" SET`).
			WillReturnError(pqErr)

		err = repo.Update(context.Background(), user)

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrEmailAlreadyExists)
	})

	t.Run("更新用户用户名重复", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.ID = "user-123"
		user.Username = "duplicateuser"

		// Mock UPDATE 返回唯一性约束冲突
		pqErr := &pq.Error{
			Code:       "23505",
			Constraint: "users_username_key",
		}
		mock.ExpectExec(`UPDATE "users" SET`).
			WillReturnError(pqErr)

		err = repo.Update(context.Background(), user)

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUsernameAlreadyExists)
	})

	t.Run("更新不存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.ID = "nonexistent"

		// Mock UPDATE returns 0 rows affected
		mock.ExpectExec(`UPDATE "users" SET`).
			WillReturnResult(sqlmock.NewResult(0, 0))

		err = repo.Update(context.Background(), user)

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUserNotFound)
	})

	t.Run("更新失败", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")
		user, _ := model.NewUser("test@example.com", "password123")
		user.ID = "user-123"

		mock.ExpectExec(`UPDATE "users" SET`).
			WillReturnError(fmt.Errorf("database error"))

		err = repo.Update(context.Background(), user)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "更新用户失败")
	})
}

// TestUserRepository_Delete 测试删除用户
func TestUserRepository_Delete(t *testing.T) {
	t.Run("删除存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		// Mock DELETE user (goqu 将参数值直接嵌入到 SQL 中)
		mock.ExpectExec(`DELETE FROM "users" WHERE \("id"`).
			WillReturnResult(sqlmock.NewResult(0, 1))

		err = repo.Delete(context.Background(), "user-123")

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("删除不存在的用户", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		// Mock DELETE user returns 0 rows affected
		mock.ExpectExec(`DELETE FROM "users" WHERE \("id"`).
			WillReturnResult(sqlmock.NewResult(0, 0))

		err = repo.Delete(context.Background(), "nonexistent")

		assert.Error(t, err)
		assert.ErrorIs(t, err, model.ErrUserNotFound)
	})

	t.Run("删除失败", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectExec(`DELETE FROM "users" WHERE \("id"`).
			WillReturnError(fmt.Errorf("database error"))

		err = repo.Delete(context.Background(), "user-123")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "删除用户失败")
	})
}

// TestUserRepository_ExistsByEmail 测试检查邮箱是否存在
func TestUserRepository_ExistsByEmail(t *testing.T) {
	t.Run("邮箱存在", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		// goqu 生成的 EXISTS 查询将参数嵌入到子查询中，主查询没有参数
		rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
		mock.ExpectQuery(`SELECT EXISTS\(\(SELECT 1 FROM "users" WHERE \("email"`).
			WillReturnRows(rows)

		exists, err := repo.ExistsByEmail(context.Background(), "test@example.com")

		assert.NoError(t, err)
		assert.True(t, exists)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("邮箱不存在", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		// goqu 生成的 EXISTS 查询将参数嵌入到子查询中，主查询没有参数
		rows := sqlmock.NewRows([]string{"exists"}).AddRow(false)
		mock.ExpectQuery(`SELECT EXISTS\(\(SELECT 1 FROM "users" WHERE \("email"`).
			WillReturnRows(rows)

		exists, err := repo.ExistsByEmail(context.Background(), "nonexistent@example.com")

		assert.NoError(t, err)
		assert.False(t, exists)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectQuery(`SELECT EXISTS\(\(SELECT 1 FROM "users" WHERE \("email"`).
			WillReturnError(fmt.Errorf("database error"))

		exists, err := repo.ExistsByEmail(context.Background(), "test@example.com")

		assert.Error(t, err)
		assert.False(t, exists)
		assert.Contains(t, err.Error(), "检查邮箱是否存在失败")
	})
}

// TestUserRepository_ExistsByUsername 测试检查用户名是否存在
func TestUserRepository_ExistsByUsername(t *testing.T) {
	t.Run("用户名存在", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		// goqu 生成的 EXISTS 查询将参数嵌入到子查询中，主查询没有参数
		rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
		mock.ExpectQuery(`SELECT EXISTS\(\(SELECT 1 FROM "users" WHERE \("username"`).
			WillReturnRows(rows)

		exists, err := repo.ExistsByUsername(context.Background(), "testuser")

		assert.NoError(t, err)
		assert.True(t, exists)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("用户名不存在", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		// goqu 生成的 EXISTS 查询将参数嵌入到子查询中，主查询没有参数
		rows := sqlmock.NewRows([]string{"exists"}).AddRow(false)
		mock.ExpectQuery(`SELECT EXISTS\(\(SELECT 1 FROM "users" WHERE \("username"`).
			WillReturnRows(rows)

		exists, err := repo.ExistsByUsername(context.Background(), "nonexistent")

		assert.NoError(t, err)
		assert.False(t, exists)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewUserRepository(db, "postgres")

		mock.ExpectQuery(`SELECT EXISTS\(\(SELECT 1 FROM "users" WHERE \("username"`).
			WillReturnError(fmt.Errorf("database error"))

		exists, err := repo.ExistsByUsername(context.Background(), "testuser")

		assert.Error(t, err)
		assert.False(t, exists)
		assert.Contains(t, err.Error(), "检查用户名是否存在失败")
	})
}
