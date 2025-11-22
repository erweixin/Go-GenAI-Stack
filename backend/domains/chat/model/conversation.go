package model

import (
	"time"
)

// Conversation 对话聚合根
//
// 字段映射到数据库：
//
//	ID        -> conversations.id
//	UserID    -> conversations.user_id
//	Title     -> conversations.title
//	CreatedAt -> conversations.created_at
//	UpdatedAt -> conversations.updated_at
type Conversation struct {
	ID        string     // 对话ID（UUID）
	UserID    string     // 用户ID
	Title     string     // 对话标题
	Messages  []*Message // 消息列表（聚合）
	CreatedAt time.Time  // 创建时间
	UpdatedAt time.Time  // 更新时间
}

// NewConversation 创建新对话
func NewConversation(userID, title string) *Conversation {
	now := time.Now()
	return &Conversation{
		ID:        GenerateID("conv"),
		UserID:    userID,
		Title:     title,
		Messages:  make([]*Message, 0),
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// AddMessage 添加消息到对话
func (c *Conversation) AddMessage(message *Message) {
	c.Messages = append(c.Messages, message)
	c.UpdatedAt = time.Now()
}

// GetTotalTokens 获取对话总 token 数
func (c *Conversation) GetTotalTokens() int {
	total := 0
	for _, msg := range c.Messages {
		total += msg.Tokens
	}
	return total
}

// GetMessageCount 获取消息数量
func (c *Conversation) GetMessageCount() int {
	return len(c.Messages)
}

// GetLastMessage 获取最后一条消息
func (c *Conversation) GetLastMessage() *Message {
	if len(c.Messages) == 0 {
		return nil
	}
	return c.Messages[len(c.Messages)-1]
}

// TruncateHistory 截断历史消息以适应 token 限制
func (c *Conversation) TruncateHistory(maxTokens int) []*Message {
	if c.GetTotalTokens() <= maxTokens {
		return c.Messages
	}

	// 滑动窗口策略：保留最近的消息
	result := make([]*Message, 0)
	totalTokens := 0

	// 从后往前遍历
	for i := len(c.Messages) - 1; i >= 0; i-- {
		msg := c.Messages[i]
		if totalTokens+msg.Tokens > maxTokens {
			break
		}
		result = append([]*Message{msg}, result...)
		totalTokens += msg.Tokens
	}

	return result
}
