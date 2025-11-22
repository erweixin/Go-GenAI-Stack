package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/domains/chat/http/dto"
	"github.com/erweixin/go-genai-stack/domains/chat/model"
	"github.com/erweixin/go-genai-stack/shared/errors"
)

// SendMessageHandler 处理发送消息请求
//
// 用例：SendMessage
// 参考：domains/chat/usecases.yaml
//
// 步骤：
// 1. 验证输入
// 2. 检查限流
// 3. 获取或创建对话
// 4. 保存用户消息
// 5. 调用 LLM 生成回复
// 6. 保存 AI 回复
// 7. 返回响应
func SendMessageHandler(ctx context.Context, c *app.RequestContext) {
	var req dto.SendMessageRequest

	// Step 1: 验证输入
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": err.Error(),
		})
		return
	}

	// Step 2: 检查限流（TODO: 实现 rate limiter）
	// if err := checkRateLimit(req.UserID); err != nil {
	//     c.JSON(consts.StatusTooManyRequests, map[string]interface{}{
	//         "error": "RATE_LIMIT_EXCEEDED",
	//         "message": "请求过于频繁，请稍后再试",
	//     })
	//     return
	// }

	// Step 3: 获取或创建对话
	conversationID := req.ConversationID
	if conversationID == "" {
		conversationID = model.GenerateID("conv")
		// TODO: 创建对话记录
		// conversation := &model.Conversation{...}
		// if err := repo.CreateConversation(conversation); err != nil {
		//     handleError(c, err)
		//     return
		// }
	}

	// Step 4: 保存用户消息
	userMessage := &model.Message{
		MessageID:      model.GenerateID("msg"),
		ConversationID: conversationID,
		Role:           "user",
		Content:        req.Message,
		Timestamp:      time.Now(),
	}
	// TODO: 保存到数据库
	// if err := repo.SaveMessage(userMessage); err != nil {
	//     handleError(c, err)
	//     return
	// }

	// Step 5: 调用 LLM 生成回复（TODO: 调用 LLM Domain）
	// 目前返回 mock 数据
	assistantContent := fmt.Sprintf("这是对您消息的回复：%s", req.Message)
	tokens := len(req.Message) + len(assistantContent) // 简化的 token 计算

	// Step 6: 保存 AI 回复
	assistantMessage := &model.Message{
		MessageID:      model.GenerateID("msg"),
		ConversationID: conversationID,
		Role:           "assistant",
		Content:        assistantContent,
		Tokens:         tokens,
		Timestamp:      time.Now(),
	}
	// TODO: 保存到数据库
	// if err := repo.SaveMessage(assistantMessage); err != nil {
	//     handleError(c, err)
	//     return
	// }

	// Step 7: 发布事件（TODO: 实现事件总线）
	// eventBus.Publish("MessageReceived", assistantMessage)

	// 返回响应
	resp := &dto.SendMessageResponse{
		MessageID:      assistantMessage.MessageID,
		Content:        assistantMessage.Content,
		Tokens:         tokens,
		ConversationID: conversationID,
		Model:          getModel(req.Model),
	}

	c.JSON(consts.StatusOK, resp)
}

// getModel 获取实际使用的模型名称
func getModel(requestedModel string) string {
	if requestedModel == "" {
		return "gpt-4o" // 默认模型
	}
	return requestedModel
}

// handleError 统一错误处理
func handleError(c *app.RequestContext, err error) {
	switch e := err.(type) {
	case *errors.DomainError:
		c.JSON(e.HTTPStatus, map[string]interface{}{
			"error":   e.Code,
			"message": e.Message,
		})
	default:
		c.JSON(consts.StatusInternalServerError, map[string]interface{}{
			"error":   "INTERNAL_ERROR",
			"message": "内部服务器错误",
		})
	}
}
