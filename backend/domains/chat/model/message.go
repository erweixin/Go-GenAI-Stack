package model

import (
	"crypto/rand"
	"fmt"
	"time"
)

// Message 消息实体
//
// 字段映射到数据库：
//   ID             -> messages.id
//   ConversationID -> messages.conversation_id
//   Role           -> messages.role
//   Content        -> messages.content
//   Tokens         -> messages.tokens
//   Model          -> messages.model
//   CreatedAt      -> messages.created_at
type Message struct {
	ID             string    // 消息ID（UUID）
	ConversationID string    // 所属对话ID
	Role           string    // 消息角色：user, assistant, system
	Content        string    // 消息内容
	Tokens         int       // Token 数量
	Model          string    // 使用的模型（仅 assistant 消息）
	CreatedAt      time.Time // 创建时间
}

// MessageRole 消息角色
const (
	RoleUser      = "user"
	RoleAssistant = "assistant"
	RoleSystem    = "system"
)

// NewUserMessage 创建用户消息
func NewUserMessage(conversationID, content string) *Message {
	return &Message{
		ID:             GenerateID("msg"),
		ConversationID: conversationID,
		Role:           RoleUser,
		Content:        content,
		Tokens:         EstimateTokens(content),
		CreatedAt:      time.Now(),
	}
}

// NewAssistantMessage 创建助手消息
func NewAssistantMessage(conversationID, content, model string, tokens int) *Message {
	return &Message{
		ID:             GenerateID("msg"),
		ConversationID: conversationID,
		Role:           RoleAssistant,
		Content:        content,
		Tokens:         tokens,
		Model:          model,
		CreatedAt:      time.Now(),
	}
}

// NewSystemMessage 创建系统消息
func NewSystemMessage(conversationID, content string) *Message {
	return &Message{
		ID:             GenerateID("msg"),
		ConversationID: conversationID,
		Role:           RoleSystem,
		Content:        content,
		Tokens:         EstimateTokens(content),
		CreatedAt:      time.Now(),
	}
}

// IsUser 是否为用户消息
func (m *Message) IsUser() bool {
	return m.Role == RoleUser
}

// IsAssistant 是否为助手消息
func (m *Message) IsAssistant() bool {
	return m.Role == RoleAssistant
}

// IsSystem 是否为系统消息
func (m *Message) IsSystem() bool {
	return m.Role == RoleSystem
}

// GenerateID 生成唯一 ID
func GenerateID(prefix string) string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%s-%x", prefix, b)
}

// EstimateTokens 估算 token 数量（简化版本）
// 实际应该使用 tiktoken 等库
func EstimateTokens(content string) int {
	// 粗略估算：英文 ~4 字符/token，中文 ~2 字符/token
	// 这里简化为按字符数 / 3
	return len(content) / 3
}

