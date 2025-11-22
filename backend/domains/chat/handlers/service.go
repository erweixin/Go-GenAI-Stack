package handlers

import (
	"github.com/erweixin/go-genai-stack/domains/chat/repository"
)

// HandlerService 处理器服务，持有所有依赖
type HandlerService struct {
	messageRepo      repository.MessageRepository
	conversationRepo repository.ConversationRepository
}

// NewHandlerService 创建新的处理器服务
func NewHandlerService(
	messageRepo repository.MessageRepository,
	conversationRepo repository.ConversationRepository,
) *HandlerService {
	return &HandlerService{
		messageRepo:      messageRepo,
		conversationRepo: conversationRepo,
	}
}

