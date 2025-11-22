package repository

import (
	"context"
	"fmt"

	"github.com/erweixin/go-genai-stack/domains/chat/internal/po"
	"github.com/erweixin/go-genai-stack/domains/chat/model"
	"gorm.io/gorm"
)

// conversationRepository 对话仓储实现
type conversationRepository struct {
	db *gorm.DB
}

// NewConversationRepository 创建对话仓储
func NewConversationRepository(db *gorm.DB) ConversationRepository {
	return &conversationRepository{db: db}
}

// Create 创建对话
func (r *conversationRepository) Create(ctx context.Context, conv *model.Conversation) error {
	convPO := &po.ConversationPO{
		ConversationID: conv.ConversationID,
		UserID:         conv.UserID,
		Title:          conv.Title,
		CreatedAt:      conv.CreatedAt,
		UpdatedAt:      conv.UpdatedAt,
	}

	return r.db.WithContext(ctx).Create(convPO).Error
}

// FindByID 根据 ID 查询对话
func (r *conversationRepository) FindByID(ctx context.Context, conversationID string) (*model.Conversation, error) {
	var convPO po.ConversationPO
	err := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		First(&convPO).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("conversation not found: %s", conversationID)
		}
		return nil, err
	}

	return &model.Conversation{
		ConversationID: convPO.ConversationID,
		UserID:         convPO.UserID,
		Title:          convPO.Title,
		Messages:       make([]*model.Message, 0), // 消息需要单独加载
		CreatedAt:      convPO.CreatedAt,
		UpdatedAt:      convPO.UpdatedAt,
	}, nil
}

// FindByUser 查询用户的对话列表
func (r *conversationRepository) FindByUser(ctx context.Context, userID string, limit, offset int) ([]*model.Conversation, error) {
	var convPOs []*po.ConversationPO

	query := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("updated_at DESC")

	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	err := query.Find(&convPOs).Error
	if err != nil {
		return nil, err
	}

	convs := make([]*model.Conversation, len(convPOs))
	for i, po := range convPOs {
		convs[i] = &model.Conversation{
			ConversationID: po.ConversationID,
			UserID:         po.UserID,
			Title:          po.Title,
			Messages:       make([]*model.Message, 0),
			CreatedAt:      po.CreatedAt,
			UpdatedAt:      po.UpdatedAt,
		}
	}

	return convs, nil
}

// Update 更新对话
func (r *conversationRepository) Update(ctx context.Context, conv *model.Conversation) error {
	return r.db.WithContext(ctx).
		Model(&po.ConversationPO{}).
		Where("conversation_id = ?", conv.ConversationID).
		Updates(map[string]interface{}{
			"title":      conv.Title,
			"updated_at": conv.UpdatedAt,
		}).Error
}

// Delete 删除对话
func (r *conversationRepository) Delete(ctx context.Context, conversationID string) error {
	return r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Delete(&po.ConversationPO{}).Error
}

// CountByUser 统计用户的对话数量
func (r *conversationRepository) CountByUser(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&po.ConversationPO{}).
		Where("user_id = ?", userID).
		Count(&count).Error

	return count, err
}
