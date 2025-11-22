package dto

// CreateConversationRequest 创建对话请求
type CreateConversationRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Title  string `json:"title,omitempty" binding:"max=100"`
}

// CreateConversationResponse 创建对话响应
type CreateConversationResponse struct {
	ConversationID string `json:"conversation_id"`
	Title          string `json:"title"`
	CreatedAt      string `json:"created_at"`
}

// GetHistoryRequest 获取历史请求
type GetHistoryRequest struct {
	UserID         string `path:"user_id"`
	ConversationID string `path:"conversation_id" binding:"required"`
	Limit          int    `query:"limit" binding:"max=100,min=1"`
	Offset         int    `query:"offset"`
}

// Message 消息
type Message struct {
	MessageID string `json:"message_id"`
	Role      string `json:"role"`      // user, assistant, system
	Content   string `json:"content"`
	Tokens    int    `json:"tokens"`
	Timestamp string `json:"timestamp"`
}

// GetHistoryResponse 获取历史响应
type GetHistoryResponse struct {
	ConversationID string    `json:"conversation_id"`
	Title          string    `json:"title"`
	Messages       []Message `json:"messages"`
	TotalCount     int       `json:"total_count"`
	HasMore        bool      `json:"has_more"`
}

// ListConversationsRequest 列出对话请求
type ListConversationsRequest struct {
	UserID string `header:"user_id" binding:"required"`
	Limit  int    `query:"limit" binding:"max=50,min=1"`
	Offset int    `query:"offset"`
}

// ConversationSummary 对话摘要
type ConversationSummary struct {
	ConversationID string `json:"conversation_id"`
	Title          string `json:"title"`
	LastMessage    string `json:"last_message"`
	LastMessageAt  string `json:"last_message_at"`
	MessageCount   int    `json:"message_count"`
	TotalTokens    int    `json:"total_tokens"`
}

// ListConversationsResponse 列出对话响应
type ListConversationsResponse struct {
	Conversations []ConversationSummary `json:"conversations"`
	TotalCount    int                   `json:"total_count"`
	HasMore       bool                  `json:"has_more"`
}

// DeleteConversationRequest 删除对话请求
type DeleteConversationRequest struct {
	UserID         string `header:"user_id" binding:"required"`
	ConversationID string `path:"conversation_id" binding:"required"`
}

// DeleteConversationResponse 删除对话响应
type DeleteConversationResponse struct {
	Success   bool   `json:"success"`
	DeletedAt string `json:"deleted_at"`
}

