package repository

import (
	"context"
	"github.com/your-org/go-genai-stack/domains/chat/model"
)

// MessageRepository 消息仓储接口
// 定义消息的持久化操作，使用领域语言
type MessageRepository interface {
	// Save 保存消息（创建或更新）
	Save(ctx context.Context, message *model.Message) error
	
	// FindByID 根据 ID 查询消息
	FindByID(ctx context.Context, messageID string) (*model.Message, error)
	
	// FindByConversation 查询对话的所有消息
	FindByConversation(ctx context.Context, conversationID string, limit, offset int) ([]*model.Message, error)
	
	// FindRecent 查询对话的最近 N 条消息
	FindRecent(ctx context.Context, conversationID string, n int) ([]*model.Message, error)
	
	// Count 统计对话的消息数量
	Count(ctx context.Context, conversationID string) (int64, error)
	
	// Delete 删除消息
	Delete(ctx context.Context, messageID string) error
}

// ConversationRepository 对话仓储接口
type ConversationRepository interface {
	// Create 创建对话
	Create(ctx context.Context, conv *model.Conversation) error
	
	// FindByID 根据 ID 查询对话
	FindByID(ctx context.Context, conversationID string) (*model.Conversation, error)
	
	// FindByUser 查询用户的对话列表
	FindByUser(ctx context.Context, userID string, limit, offset int) ([]*model.Conversation, error)
	
	// Update 更新对话（如标题）
	Update(ctx context.Context, conv *model.Conversation) error
	
	// Delete 删除对话
	Delete(ctx context.Context, conversationID string) error
	
	// CountByUser 统计用户的对话数量
	CountByUser(ctx context.Context, userID string) (int64, error)
}
