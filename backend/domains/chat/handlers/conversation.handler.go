package handlers

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/domains/chat/http/dto"
	"github.com/erweixin/go-genai-stack/domains/chat/model"
)

// CreateConversationHandler 创建新对话
func CreateConversationHandler(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateConversationRequest

	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": err.Error(),
		})
		return
	}

	// Extension point: 持久化对话
	// if err := conversationRepo.Create(ctx, conversation); err != nil {
	//     handleError(c, err)
	//     return
	// }
	conversation := model.NewConversation(req.UserID, req.Title)
	if conversation.Title == "" {
		conversation.Title = "新对话"
	}

	resp := &dto.CreateConversationResponse{
		ConversationID: conversation.ID,
		Title:          conversation.Title,
		CreatedAt:      conversation.CreatedAt.Format(time.RFC3339),
	}

	c.JSON(consts.StatusOK, resp)
}

// GetHistoryHandler 获取对话历史
func GetHistoryHandler(ctx context.Context, c *app.RequestContext) {
	conversationID := c.Param("id")

	// Extension point: 从数据库查询历史消息
	// messages, err := messageRepo.FindByConversation(ctx, conversationID, limit, offset)
	// if err != nil {
	//     handleError(c, err)
	//     return
	// }
	//
	// 当前返回 mock 数据用于演示
	resp := &dto.GetHistoryResponse{
		ConversationID: conversationID,
		Title:          "示例对话",
		Messages: []dto.Message{
			{
				MessageID: "msg-001",
				Role:      "user",
				Content:   "你好",
				Tokens:    2,
				Timestamp: time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
			},
			{
				MessageID: "msg-002",
				Role:      "assistant",
				Content:   "你好！有什么我可以帮助您的吗？",
				Tokens:    10,
				Timestamp: time.Now().Add(-4 * time.Minute).Format(time.RFC3339),
			},
		},
		TotalCount: 2,
		HasMore:    false,
	}

	c.JSON(consts.StatusOK, resp)
}

// ListConversationsHandler 列出对话
func ListConversationsHandler(ctx context.Context, c *app.RequestContext) {
	// Extension point: 从请求中获取 user_id（通过认证中间件）
	// userID := c.GetString("user_id")

	// Extension point: 从数据库查询用户的对话列表
	// conversations, err := conversationRepo.FindByUser(ctx, userID, limit, offset)
	// if err != nil {
	//     handleError(c, err)
	//     return
	// }
	//
	// 当前返回 mock 数据用于演示
	resp := &dto.ListConversationsResponse{
		Conversations: []dto.ConversationSummary{
			{
				ConversationID: "conv-001",
				Title:          "关于 AI 的讨论",
				LastMessage:    "谢谢你的解答",
				LastMessageAt:  time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
				MessageCount:   10,
				TotalTokens:    1500,
			},
			{
				ConversationID: "conv-002",
				Title:          "编程问题",
				LastMessage:    "这样就可以了",
				LastMessageAt:  time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
				MessageCount:   5,
				TotalTokens:    800,
			},
		},
		TotalCount: 2,
		HasMore:    false,
	}

	c.JSON(consts.StatusOK, resp)
}

// DeleteConversationHandler 删除对话
func DeleteConversationHandler(ctx context.Context, c *app.RequestContext) {
	// conversationID := c.Param("id")

	// Extension point: 验证所有权和删除
	// userID := c.GetString("user_id")
	// if err := chatOrchestrator.DeleteConversation(ctx, conversationID, userID); err != nil {
	//     handleError(c, err)
	//     return
	// }

	resp := &dto.DeleteConversationResponse{
		Success:   true,
		DeletedAt: time.Now().Format(time.RFC3339),
	}

	c.JSON(consts.StatusOK, resp)
}
