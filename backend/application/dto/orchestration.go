package dto

// SendWithRoutingRequest 发送消息并路由请求（应用层 DTO）
// 组合了多个领域的数据
type SendWithRoutingRequest struct {
	UserID   string `json:"user_id" binding:"required"`
	Message  string `json:"message" binding:"required,max=10000"`
	Strategy string `json:"strategy,omitempty"` // latency, cost, quality, balanced
}

// SendWithRoutingResponse 发送消息并路由响应
type SendWithRoutingResponse struct {
	// Chat Domain 数据
	MessageID      string `json:"message_id"`
	ConversationID string `json:"conversation_id"`
	
	// LLM Domain 数据
	Content string `json:"content"`
	Model   string `json:"model"`
	Tokens  int    `json:"tokens"`
	
	// Monitoring Domain 数据
	Latency int     `json:"latency_ms"`
	Cost    float64 `json:"cost"`
}

// ConversationSummary 对话摘要（应用层组合）
type ConversationSummary struct {
	ConversationID string `json:"conversation_id"`
	Title          string `json:"title"`
	MessageCount   int    `json:"message_count"`
	TotalTokens    int    `json:"total_tokens"`
	LastMessageAt  string `json:"last_message_at"`
	LastMessage    string `json:"last_message"`
}

