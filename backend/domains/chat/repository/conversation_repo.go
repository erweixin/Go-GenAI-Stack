package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/erweixin/go-genai-stack/domains/chat/model"
)

// conversationRepository 对话仓储实现
type conversationRepository struct {
	db *sql.DB
}

// NewConversationRepository 创建对话仓储
func NewConversationRepository(db *sql.DB) ConversationRepository {
	return &conversationRepository{db: db}
}

// Create 创建对话
func (r *conversationRepository) Create(ctx context.Context, conv *model.Conversation) error {
	query := `
		INSERT INTO conversations (conversation_id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.ExecContext(ctx, query,
		conv.ConversationID,
		conv.UserID,
		conv.Title,
		conv.CreatedAt,
		conv.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create conversation: %w", err)
	}
	return nil
}

// FindByID 根据 ID 查询对话
func (r *conversationRepository) FindByID(ctx context.Context, conversationID string) (*model.Conversation, error) {
	query := `
		SELECT conversation_id, user_id, title, created_at, updated_at
		FROM conversations
		WHERE conversation_id = $1
	`
	
	var conv model.Conversation
	err := r.db.QueryRowContext(ctx, query, conversationID).Scan(
		&conv.ConversationID,
		&conv.UserID,
		&conv.Title,
		&conv.CreatedAt,
		&conv.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("conversation not found: %s", conversationID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find conversation: %w", err)
	}
	
	conv.Messages = make([]*model.Message, 0) // 消息需要单独加载
	return &conv, nil
}

// FindByUser 查询用户的对话列表
func (r *conversationRepository) FindByUser(ctx context.Context, userID string, limit, offset int) ([]*model.Conversation, error) {
	query := `
		SELECT conversation_id, user_id, title, created_at, updated_at
		FROM conversations
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`
	
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)
	}
	
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query conversations: %w", err)
	}
	defer rows.Close()
	
	var convs []*model.Conversation
	for rows.Next() {
		var conv model.Conversation
		err := rows.Scan(
			&conv.ConversationID,
			&conv.UserID,
			&conv.Title,
			&conv.CreatedAt,
			&conv.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan conversation: %w", err)
		}
		conv.Messages = make([]*model.Message, 0)
		convs = append(convs, &conv)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	
	return convs, nil
}

// Update 更新对话
func (r *conversationRepository) Update(ctx context.Context, conv *model.Conversation) error {
	query := `
		UPDATE conversations
		SET title = $1, updated_at = $2
		WHERE conversation_id = $3
	`
	_, err := r.db.ExecContext(ctx, query,
		conv.Title,
		conv.UpdatedAt,
		conv.ConversationID,
	)
	if err != nil {
		return fmt.Errorf("failed to update conversation: %w", err)
	}
	return nil
}

// Delete 删除对话
func (r *conversationRepository) Delete(ctx context.Context, conversationID string) error {
	query := `DELETE FROM conversations WHERE conversation_id = $1`
	_, err := r.db.ExecContext(ctx, query, conversationID)
	if err != nil {
		return fmt.Errorf("failed to delete conversation: %w", err)
	}
	return nil
}

// CountByUser 统计用户的对话数量
func (r *conversationRepository) CountByUser(ctx context.Context, userID string) (int64, error) {
	query := `SELECT COUNT(*) FROM conversations WHERE user_id = $1`
	var count int64
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count conversations: %w", err)
	}
	return count, nil
}
