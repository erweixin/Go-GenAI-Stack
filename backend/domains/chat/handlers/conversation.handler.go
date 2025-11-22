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
func (s *HandlerService) CreateConversationHandler(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateConversationRequest

	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": err.Error(),
		})
		return
	}

	conversation := model.NewConversation(req.UserID, req.Title)
	if conversation.Title == "" {
		conversation.Title = "新对话"
	}

	if err := s.conversationRepo.Create(ctx, conversation); err != nil {
		handleError(c, err)
		return
	}

	resp := &dto.CreateConversationResponse{
		ConversationID: conversation.ID,
		Title:          conversation.Title,
		CreatedAt:      conversation.CreatedAt.Format(time.RFC3339),
	}

	c.JSON(consts.StatusOK, resp)
}

// GetHistoryHandler 获取对话历史
func (s *HandlerService) GetHistoryHandler(ctx context.Context, c *app.RequestContext) {
	conversationID := c.Param("id")

	// 查询对话信息
	conversation, err := s.conversationRepo.FindByID(ctx, conversationID)
	if err != nil {
		handleError(c, err)
		return
	}

	// 查询消息列表（默认获取最近 50 条）
	limit := 50
	offset := 0
	messages, err := s.messageRepo.FindByConversation(ctx, conversationID, limit, offset)
	if err != nil {
		handleError(c, err)
		return
	}

	// 统计总消息数
	totalCount, err := s.messageRepo.Count(ctx, conversationID)
	if err != nil {
		handleError(c, err)
		return
	}

	// 转换为 DTO
	dtoMessages := make([]dto.Message, len(messages))
	for i, msg := range messages {
		dtoMessages[i] = dto.Message{
			MessageID: msg.ID,
			Role:      msg.Role,
			Content:   msg.Content,
			Tokens:    msg.Tokens,
			Timestamp: msg.CreatedAt.Format(time.RFC3339),
		}
	}

	resp := &dto.GetHistoryResponse{
		ConversationID: conversationID,
		Title:          conversation.Title,
		Messages:       dtoMessages,
		TotalCount:     int(totalCount),
		HasMore:        int64(offset+limit) < totalCount,
	}

	c.JSON(consts.StatusOK, resp)
}

// ListConversationsHandler 列出对话
func (s *HandlerService) ListConversationsHandler(ctx context.Context, c *app.RequestContext) {
	// Extension point: 从请求中获取 user_id（通过认证中间件）
	// 暂时从查询参数获取
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": "缺少 user_id 参数",
		})
		return
	}

	// 查询用户的对话列表（默认获取最近 20 条）
	limit := 20
	offset := 0
	conversations, err := s.conversationRepo.FindByUser(ctx, userID, limit, offset)
	if err != nil {
		handleError(c, err)
		return
	}

	// 统计总对话数
	totalCount, err := s.conversationRepo.CountByUser(ctx, userID)
	if err != nil {
		handleError(c, err)
		return
	}

	// 转换为 DTO（这里简化处理，实际应该查询每个对话的最后一条消息）
	dtoConversations := make([]dto.ConversationSummary, len(conversations))
	for i, conv := range conversations {
		dtoConversations[i] = dto.ConversationSummary{
			ConversationID: conv.ID,
			Title:          conv.Title,
			LastMessage:    "", // Extension point: 查询最后一条消息
			LastMessageAt:  conv.UpdatedAt.Format(time.RFC3339),
			MessageCount:   0, // Extension point: 查询消息数量
			TotalTokens:    0, // Extension point: 查询总 token 数
		}
	}

	resp := &dto.ListConversationsResponse{
		Conversations: dtoConversations,
		TotalCount:    int(totalCount),
		HasMore:       int64(offset+limit) < totalCount,
	}

	c.JSON(consts.StatusOK, resp)
}

// DeleteConversationHandler 删除对话
func (s *HandlerService) DeleteConversationHandler(ctx context.Context, c *app.RequestContext) {
	conversationID := c.Param("id")

	// Extension point: 验证所有权（通过认证中间件）
	// userID := c.GetString("user_id")
	// conversation, err := s.conversationRepo.FindByID(ctx, conversationID)
	// if conversation.UserID != userID {
	//     c.JSON(consts.StatusForbidden, map[string]interface{}{
	//         "error": "FORBIDDEN",
	//         "message": "无权访问此对话",
	//     })
	//     return
	// }

	if err := s.conversationRepo.Delete(ctx, conversationID); err != nil {
		handleError(c, err)
		return
	}

	resp := &dto.DeleteConversationResponse{
		Success:   true,
		DeletedAt: time.Now().Format(time.RFC3339),
	}

	c.JSON(consts.StatusOK, resp)
}
