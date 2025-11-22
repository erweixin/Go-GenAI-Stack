package model

import (
	"time"
)

// Conversation 对话聚合根
type Conversation struct {
	ConversationID string
	UserID         string
	Title          string
	Messages       []*Message
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// NewConversation 创建新对话
func NewConversation(userID, title string) *Conversation {
	now := time.Now()
	return &Conversation{
		ConversationID: GenerateID("conv"),
		UserID:         userID,
		Title:          title,
		Messages:       make([]*Message, 0),
		CreatedAt:      now,
		UpdatedAt:      now,
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

