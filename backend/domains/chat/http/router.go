package http

import (
	"github.com/cloudwego/hertz/pkg/route"
	"github.com/erweixin/go-genai-stack/domains/chat/handlers"
)

// RegisterRoutes 注册聊天领域的路由
func RegisterRoutes(r *route.RouterGroup, handlerService *handlers.HandlerService) {
	chat := r.Group("/chat")
	{
		// 消息相关
		chat.POST("/send", handlerService.SendMessageHandler)
		chat.POST("/stream", handlerService.StreamMessageHandler)

		// 对话相关
		chat.POST("/conversations", handlerService.CreateConversationHandler)
		chat.GET("/conversations", handlerService.ListConversationsHandler)
		chat.GET("/conversations/:id/history", handlerService.GetHistoryHandler)
		chat.DELETE("/conversations/:id", handlerService.DeleteConversationHandler)
	}
}
