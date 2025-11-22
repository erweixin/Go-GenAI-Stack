package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/erweixin/go-genai-stack/domains/chat/model"
)

// messageRepository 消息仓储实现
type messageRepository struct {
	db *sql.DB
}

// NewMessageRepository 创建消息仓储
func NewMessageRepository(db *sql.DB) MessageRepository {
	return &messageRepository{db: db}
}

// Save 保存消息
func (r *messageRepository) Save(ctx context.Context, message *model.Message) error {
	query := `
		INSERT INTO messages (id, conversation_id, role, content, tokens, model, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.ExecContext(ctx, query,
		message.ID,
		message.ConversationID,
		message.Role,
		message.Content,
		message.Tokens,
		message.Model,
		message.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save message: %w", err)
	}
	return nil
}

// FindByID 根据 ID 查询消息
func (r *messageRepository) FindByID(ctx context.Context, messageID string) (*model.Message, error) {
	query := `
		SELECT id, conversation_id, role, content, tokens, model, created_at
		FROM messages
		WHERE id = $1
	`
	
	var msg model.Message
	err := r.db.QueryRowContext(ctx, query, messageID).Scan(
		&msg.ID,
		&msg.ConversationID,
		&msg.Role,
		&msg.Content,
		&msg.Tokens,
		&msg.Model,
		&msg.CreatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("message not found: %s", messageID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find message: %w", err)
	}
	
	return &msg, nil
}

// FindByConversation 查询对话的所有消息
func (r *messageRepository) FindByConversation(ctx context.Context, conversationID string, limit, offset int) ([]*model.Message, error) {
	query := `
		SELECT id, conversation_id, role, content, tokens, model, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
	`
	
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)
	}
	
	rows, err := r.db.QueryContext(ctx, query, conversationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query messages: %w", err)
	}
	defer rows.Close()
	
	var messages []*model.Message
	for rows.Next() {
		var msg model.Message
		err := rows.Scan(
			&msg.ID,
			&msg.ConversationID,
			&msg.Role,
			&msg.Content,
			&msg.Tokens,
			&msg.Model,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, &msg)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	
	return messages, nil
}

// FindRecent 查询对话的最近 N 条消息
func (r *messageRepository) FindRecent(ctx context.Context, conversationID string, n int) ([]*model.Message, error) {
	query := `
		SELECT id, conversation_id, role, content, tokens, model, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	
	rows, err := r.db.QueryContext(ctx, query, conversationID, n)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent messages: %w", err)
	}
	defer rows.Close()
	
	var messages []*model.Message
	for rows.Next() {
		var msg model.Message
		err := rows.Scan(
			&msg.ID,
			&msg.ConversationID,
			&msg.Role,
			&msg.Content,
			&msg.Tokens,
			&msg.Model,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, &msg)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}
	
	// 反转顺序（从旧到新）
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	
	return messages, nil
}

// Count 统计对话的消息数量
func (r *messageRepository) Count(ctx context.Context, conversationID string) (int64, error) {
	query := `SELECT COUNT(*) FROM messages WHERE conversation_id = $1`
	var count int64
	err := r.db.QueryRowContext(ctx, query, conversationID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count messages: %w", err)
	}
	return count, nil
}

// Delete 删除消息
func (r *messageRepository) Delete(ctx context.Context, messageID string) error {
	query := `DELETE FROM messages WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, messageID)
	if err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}
	return nil
}
