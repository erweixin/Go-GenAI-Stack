package repository

import (
	"context"
	"database/sql"

	"github.com/erweixin/go-genai-stack/domains/chat/model"
	"github.com/erweixin/go-genai-stack/shared/errors"
)

// messageRepository 消息仓储实现
type messageRepository struct {
	db *sql.DB
}

// NewMessageRepository 创建消息仓储实例
func NewMessageRepository(db *sql.DB) MessageRepository {
	return &messageRepository{
		db: db,
	}
}

// Save 保存消息
func (r *messageRepository) Save(ctx context.Context, message *model.Message) error {
	query := `
		INSERT INTO messages (id, conversation_id, role, content, tokens, model, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET
			content = EXCLUDED.content,
			tokens = EXCLUDED.tokens,
			model = EXCLUDED.model
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
		return errors.Wrap(err, "DB_ERROR", "保存消息失败", 500)
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
	
	message := &model.Message{}
	var modelStr sql.NullString

	err := r.db.QueryRowContext(ctx, query, messageID).Scan(
		&message.ID,
		&message.ConversationID,
		&message.Role,
		&message.Content,
		&message.Tokens,
		&modelStr,
		&message.CreatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, errors.New("MESSAGE_NOT_FOUND", "消息不存在", 404)
	}

	if err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "查询消息失败", 500)
	}

	if modelStr.Valid {
		message.Model = modelStr.String
	}
	
	return message, nil
}

// FindByConversation 查询对话的所有消息（分页）
func (r *messageRepository) FindByConversation(ctx context.Context, conversationID string, limit, offset int) ([]*model.Message, error) {
	query := `
		SELECT id, conversation_id, role, content, tokens, model, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
		LIMIT $2 OFFSET $3
	`
	
	rows, err := r.db.QueryContext(ctx, query, conversationID, limit, offset)
	if err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "查询消息列表失败", 500)
	}
	defer rows.Close()
	
	messages := make([]*model.Message, 0)
	for rows.Next() {
		message := &model.Message{}
		var modelStr sql.NullString

		err := rows.Scan(
			&message.ID,
			&message.ConversationID,
			&message.Role,
			&message.Content,
			&message.Tokens,
			&modelStr,
			&message.CreatedAt,
		)

		if err != nil {
			return nil, errors.Wrap(err, "DB_ERROR", "扫描消息数据失败", 500)
		}

		if modelStr.Valid {
			message.Model = modelStr.String
		}

		messages = append(messages, message)
	}
	
	if err := rows.Err(); err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "遍历消息数据失败", 500)
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
		return nil, errors.Wrap(err, "DB_ERROR", "查询最近消息失败", 500)
	}
	defer rows.Close()
	
	messages := make([]*model.Message, 0)
	for rows.Next() {
		message := &model.Message{}
		var modelStr sql.NullString

		err := rows.Scan(
			&message.ID,
			&message.ConversationID,
			&message.Role,
			&message.Content,
			&message.Tokens,
			&modelStr,
			&message.CreatedAt,
		)

		if err != nil {
			return nil, errors.Wrap(err, "DB_ERROR", "扫描消息数据失败", 500)
		}

		if modelStr.Valid {
			message.Model = modelStr.String
		}

		messages = append(messages, message)
	}
	
	if err := rows.Err(); err != nil {
		return nil, errors.Wrap(err, "DB_ERROR", "遍历消息数据失败", 500)
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
		return 0, errors.Wrap(err, "DB_ERROR", "统计消息数量失败", 500)
	}

	return count, nil
}

// Delete 删除消息
func (r *messageRepository) Delete(ctx context.Context, messageID string) error {
	query := `DELETE FROM messages WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, messageID)
	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "删除消息失败", 500)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "DB_ERROR", "获取删除结果失败", 500)
	}

	if rowsAffected == 0 {
		return errors.New("MESSAGE_NOT_FOUND", "消息不存在", 404)
	}

	return nil
}
