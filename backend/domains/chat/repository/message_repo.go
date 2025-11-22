package repository

import (
	"context"
	"fmt"

	"gorm.io/gorm"
	"github.com/your-org/go-genai-stack/domains/chat/internal/po"
	"github.com/your-org/go-genai-stack/domains/chat/model"
)

// messageRepository 消息仓储实现
type messageRepository struct {
	db *gorm.DB
}

// NewMessageRepository 创建消息仓储
func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepository{db: db}
}

// Save 保存消息
func (r *messageRepository) Save(ctx context.Context, message *model.Message) error {
	messagePO := r.toMessagePO(message)
	return r.db.WithContext(ctx).Create(messagePO).Error
}

// FindByID 根据 ID 查询消息
func (r *messageRepository) FindByID(ctx context.Context, messageID string) (*model.Message, error) {
	var messagePO po.MessagePO
	err := r.db.WithContext(ctx).
		Where("message_id = ?", messageID).
		First(&messagePO).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("message not found: %s", messageID)
		}
		return nil, err
	}
	
	return r.toMessage(&messagePO), nil
}

// FindByConversation 查询对话的所有消息
func (r *messageRepository) FindByConversation(ctx context.Context, conversationID string, limit, offset int) ([]*model.Message, error) {
	var pos []*po.MessagePO
	
	query := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("timestamp ASC")
	
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	
	err := query.Find(&pos).Error
	if err != nil {
		return nil, err
	}
	
	return r.toMessages(pos), nil
}

// FindRecent 查询对话的最近 N 条消息
func (r *messageRepository) FindRecent(ctx context.Context, conversationID string, n int) ([]*model.Message, error) {
	var pos []*po.MessagePO
	
	err := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("timestamp DESC").
		Limit(n).
		Find(&pos).Error
	
	if err != nil {
		return nil, err
	}
	
	// 反转顺序（从旧到新）
	messages := r.toMessages(pos)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	
	return messages, nil
}

// Count 统计对话的消息数量
func (r *messageRepository) Count(ctx context.Context, conversationID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&po.MessagePO{}).
		Where("conversation_id = ?", conversationID).
		Count(&count).Error
	
	return count, err
}

// Delete 删除消息
func (r *messageRepository) Delete(ctx context.Context, messageID string) error {
	return r.db.WithContext(ctx).
		Where("message_id = ?", messageID).
		Delete(&po.MessagePO{}).Error
}

// toMessagePO 领域模型转持久化对象
func (r *messageRepository) toMessagePO(message *model.Message) *po.MessagePO {
	return &po.MessagePO{
		MessageID:      message.MessageID,
		ConversationID: message.ConversationID,
		Role:           message.Role,
		Content:        message.Content,
		Tokens:         message.Tokens,
		Model:          message.Model,
		Timestamp:      message.Timestamp,
	}
}

// toMessage 持久化对象转领域模型
func (r *messageRepository) toMessage(po *po.MessagePO) *model.Message {
	return &model.Message{
		MessageID:      po.MessageID,
		ConversationID: po.ConversationID,
		Role:           po.Role,
		Content:        po.Content,
		Tokens:         po.Tokens,
		Model:          po.Model,
		Timestamp:      po.Timestamp,
	}
}

// toMessages 批量转换
func (r *messageRepository) toMessages(pos []*po.MessagePO) []*model.Message {
	messages := make([]*model.Message, len(pos))
	for i, po := range pos {
		messages[i] = r.toMessage(po)
	}
	return messages
}
