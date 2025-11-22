package postgres

import (
	"context"
	"database/sql"
	"fmt"
)

// TxFunc 事务函数类型
//
// 在事务中执行的业务逻辑函数
// 如果返回错误，事务会自动回滚
// 如果返回 nil，事务会自动提交
type TxFunc func(tx *sql.Tx) error

// WithTransaction 在事务中执行函数
//
// 自动处理事务的开始、提交和回滚
//
// Example:
//
//	err := WithTransaction(ctx, db, func(tx *sql.Tx) error {
//	    // 执行数据库操作
//	    _, err := tx.ExecContext(ctx, "INSERT INTO users ...")
//	    if err != nil {
//	        return err // 自动回滚
//	    }
//	    return nil // 自动提交
//	})
func WithTransaction(ctx context.Context, db *sql.DB, fn TxFunc) error {
	// 开始事务
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// 确保事务被提交或回滚
	defer func() {
		if p := recover(); p != nil {
			// 发生 panic，回滚事务
			_ = tx.Rollback()
			panic(p) // 重新抛出 panic
		}
	}()

	// 执行业务逻辑
	if err := fn(tx); err != nil {
		// 业务逻辑返回错误，回滚事务
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("failed to rollback transaction: %v (original error: %w)", rbErr, err)
		}
		return err
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// WithTransactionIsolation 在指定隔离级别的事务中执行函数
//
// Example:
//
//	err := WithTransactionIsolation(ctx, db, sql.LevelSerializable, func(tx *sql.Tx) error {
//	    // 在可串行化隔离级别中执行操作
//	    return nil
//	})
func WithTransactionIsolation(ctx context.Context, db *sql.DB, isolation sql.IsolationLevel, fn TxFunc) error {
	// 配置事务选项
	txOpts := &sql.TxOptions{
		Isolation: isolation,
		ReadOnly:  false,
	}

	// 开始事务
	tx, err := db.BeginTx(ctx, txOpts)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// 确保事务被提交或回滚
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// 执行业务逻辑
	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("failed to rollback transaction: %v (original error: %w)", rbErr, err)
		}
		return err
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// WithReadOnlyTransaction 在只读事务中执行函数
//
// 适用于需要一致性读取但不修改数据的场景
//
// Example:
//
//	err := WithReadOnlyTransaction(ctx, db, func(tx *sql.Tx) error {
//	    rows, err := tx.QueryContext(ctx, "SELECT * FROM users WHERE ...")
//	    // ... 处理查询结果
//	    return nil
//	})
func WithReadOnlyTransaction(ctx context.Context, db *sql.DB, fn TxFunc) error {
	txOpts := &sql.TxOptions{
		Isolation: sql.LevelDefault,
		ReadOnly:  true,
	}

	tx, err := db.BeginTx(ctx, txOpts)
	if err != nil {
		return fmt.Errorf("failed to begin read-only transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("failed to rollback read-only transaction: %v (original error: %w)", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit read-only transaction: %w", err)
	}

	return nil
}

