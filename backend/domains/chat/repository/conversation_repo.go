package repository

import (
	"context"
	"database/sql"

	"github.com/erweixin/go-genai-stack/domains/chat/model"
	"github.com/erweixin/go-genai-stack/shared/errors"
)

// conversationRepository 对话仓储实现
type conversationRepository struct {
	db *sql.DB
}

// NewConversationRepository 创建对话仓储实例
func NewConversationRepository(db *sql.DB) ConversationRepository {
	return &conversationRepository{
		db: db,
	}
}

// Create 创建对话
func (r *conversationRepository) Create(ctx context.Context, conv *model.Conversation) error {
	query := `
		INSERT INTO conversations (id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.ExecContext(ctx, query,
		conv.ID,
		conv.UserID,
		conv.Title,
		conv.CreatedAt,
		conv.UpdatedAt,
	)

	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "创建对话失败", 500)
	}

	return nil
}

// FindByID 根据 ID 查询对话
func (r *conversationRepository) FindByID(ctx context.Context, conversationID string) (*model.Conversation, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM conversations
		WHERE id = $1 AND deleted_at IS NULL
	`

	conv := &model.Conversation{}
	err := r.db.QueryRowContext(ctx, query, conversationID).Scan(
		&conv.ID,
		&conv.UserID,
		&conv.Title,
		&conv.CreatedAt,
		&conv.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("CONVERSATION_NOT_FOUND", "对话不存在", 404)
	}

	if err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "查询对话失败", 500)
	}

	// 初始化消息列表
	conv.Messages = make([]*model.Message, 0)

	return conv, nil
}

// FindByUser 查询用户的对话列表（分页）
func (r *conversationRepository) FindByUser(ctx context.Context, userID string, limit, offset int) ([]*model.Conversation, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM conversations
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY updated_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "查询对话列表失败", 500)
	}
	defer rows.Close()

	conversations := make([]*model.Conversation, 0)
	for rows.Next() {
		conv := &model.Conversation{}
		err := rows.Scan(
			&conv.ID,
			&conv.UserID,
			&conv.Title,
			&conv.CreatedAt,
			&conv.UpdatedAt,
		)

		if err != nil {
			return nil, errors.Wrap(err, "DB_ERROR", "扫描对话数据失败", 500)
		}

		// 初始化消息列表
		conv.Messages = make([]*model.Message, 0)

		conversations = append(conversations, conv)
	}

	if err := rows.Err(); err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "遍历对话数据失败", 500)
	}

	return conversations, nil
}

// Update 更新对话（如标题）
func (r *conversationRepository) Update(ctx context.Context, conv *model.Conversation) error {
	query := `
		UPDATE conversations
		SET title = $1, updated_at = $2
		WHERE id = $3 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query,
		conv.Title,
		conv.UpdatedAt,
		conv.ID,
	)

	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "更新对话失败", 500)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "获取更新结果失败", 500)
	}

	if rowsAffected == 0 {
		return errors.New("CONVERSATION_NOT_FOUND", "对话不存在", 404)
	}

	return nil
}

// Delete 删除对话（软删除）
func (r *conversationRepository) Delete(ctx context.Context, conversationID string) error {
	query := `
		UPDATE conversations
		SET deleted_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, conversationID)
	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "删除对话失败", 500)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "获取删除结果失败", 500)
	}

	if rowsAffected == 0 {
		return errors.New("CONVERSATION_NOT_FOUND", "对话不存在", 404)
	}

	return nil
}

// CountByUser 统计用户的对话数量
func (r *conversationRepository) CountByUser(ctx context.Context, userID string) (int64, error) {
	query := `SELECT COUNT(*) FROM conversations WHERE user_id = $1 AND deleted_at IS NULL`

	var count int64
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, errors.Wrap(err, "DB_ERROR", "统计对话数量失败", 500)
	}

	return count, nil
}
