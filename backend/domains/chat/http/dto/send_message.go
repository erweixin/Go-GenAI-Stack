package dto

// SendMessageRequest 发送消息请求
type SendMessageRequest struct {
	UserID         string `json:"user_id" binding:"required"`
	Message        string `json:"message" binding:"required,max=10000,min=1"`
	Model          string `json:"model,omitempty"`
	ConversationID string `json:"conversation_id,omitempty"`
}

// SendMessageResponse 发送消息响应
type SendMessageResponse struct {
	MessageID      string `json:"message_id"`
	Content        string `json:"content"`
	Tokens         int    `json:"tokens"`
	ConversationID string `json:"conversation_id"`
	Model          string `json:"model"`
}

// StreamMessageRequest 流式发送消息请求
type StreamMessageRequest struct {
	UserID         string `json:"user_id" binding:"required"`
	Message        string `json:"message" binding:"required,max=10000,min=1"`
	Model          string `json:"model,omitempty"`
	ConversationID string `json:"conversation_id,omitempty"`
}

// StreamChunk 流式消息块
type StreamChunk struct {
	Content   string `json:"content"`
	Done      bool   `json:"done"`
	MessageID string `json:"message_id,omitempty"`
	Tokens    int    `json:"tokens,omitempty"`
}
