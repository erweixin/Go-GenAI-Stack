package http

import (
	"github.com/cloudwego/hertz/pkg/route"
	"github.com/erweixin/go-genai-stack/domains/chat/handlers"
)

// RegisterRoutes 注册聊天领域的路由
func RegisterRoutes(r *route.RouterGroup) {
	chat := r.Group("/chat")
	{
		// 消息相关
		chat.POST("/send", handlers.SendMessageHandler)
		chat.POST("/stream", handlers.StreamMessageHandler)

		// 对话相关
		chat.POST("/conversations", handlers.CreateConversationHandler)
		chat.GET("/conversations", handlers.ListConversationsHandler)
		chat.GET("/conversations/:id/history", handlers.GetHistoryHandler)
		chat.DELETE("/conversations/:id", handlers.DeleteConversationHandler)
	}
}
