package services

import (
	"context"
	"fmt"
	"time"

	"github.com/your-org/go-genai-stack/domains/chat/model"
	"github.com/your-org/go-genai-stack/domains/chat/repository"
)

// ChatOrchestrator 聊天编排服务
// 负责编排 Chat Domain 和 LLM Domain 之间的交互
type ChatOrchestrator struct {
	messageRepo      repository.MessageRepository
	conversationRepo repository.ConversationRepository
	// llmService      *llm.Service  // TODO: 添加 LLM Domain 依赖
}

// NewChatOrchestrator 创建聊天编排服务
func NewChatOrchestrator(
	messageRepo repository.MessageRepository,
	conversationRepo repository.ConversationRepository,
) *ChatOrchestrator {
	return &ChatOrchestrator{
		messageRepo:      messageRepo,
		conversationRepo: conversationRepo,
	}
}

// SendMessageRequest 发送消息请求（应用层）
type SendMessageRequest struct {
	UserID         string
	Message        string
	Model          string
	ConversationID string
}

// SendMessageResponse 发送消息响应（应用层）
type SendMessageResponse struct {
	MessageID      string
	Content        string
	Tokens         int
	ConversationID string
	Model          string
}

// SendMessage 发送消息（跨领域编排）
//
// 编排流程：
// 1. Chat Domain: 获取或创建对话
// 2. Chat Domain: 保存用户消息
// 3. LLM Domain: 调用 LLM 生成回复（TODO）
// 4. Chat Domain: 保存 AI 回复
// 5. Monitoring Domain: 记录 token 使用（TODO）
func (o *ChatOrchestrator) SendMessage(ctx context.Context, req *SendMessageRequest) (*SendMessageResponse, error) {
	// Step 1: 获取或创建对话
	var conv *model.Conversation
	var err error
	
	if req.ConversationID != "" {
		conv, err = o.conversationRepo.FindByID(ctx, req.ConversationID)
		if err != nil {
			return nil, fmt.Errorf("conversation not found: %w", err)
		}
	} else {
		// 创建新对话
		conv = model.NewConversation(req.UserID, "新对话")
		err = o.conversationRepo.Create(ctx, conv)
		if err != nil {
			return nil, fmt.Errorf("create conversation failed: %w", err)
		}
	}
	
	// Step 2: 保存用户消息
	userMessage := model.NewUserMessage(conv.ConversationID, req.Message)
	err = o.messageRepo.Save(ctx, userMessage)
	if err != nil {
		return nil, fmt.Errorf("save user message failed: %w", err)
	}
	
	// Step 3: 调用 LLM 生成回复
	// TODO: 调用 LLM Domain
	// llmResponse, err := o.llmService.Generate(ctx, &llm.Request{
	//     Model: req.Model,
	//     Messages: conv.GetHistory(),
	// })
	
	// 临时 mock 数据
	assistantContent := fmt.Sprintf("这是对您消息的回复：%s", req.Message)
	tokens := model.EstimateTokens(req.Message) + model.EstimateTokens(assistantContent)
	
	// Step 4: 保存 AI 回复
	assistantMessage := model.NewAssistantMessage(
		conv.ConversationID,
		assistantContent,
		getModelOrDefault(req.Model),
		tokens,
	)
	err = o.messageRepo.Save(ctx, assistantMessage)
	if err != nil {
		return nil, fmt.Errorf("save assistant message failed: %w", err)
	}
	
	// Step 5: 更新对话时间
	conv.UpdatedAt = time.Now()
	err = o.conversationRepo.Update(ctx, conv)
	if err != nil {
		// 非关键错误，记录日志即可
		fmt.Printf("update conversation failed: %v\n", err)
	}
	
	// TODO: Step 6: 发布领域事件
	// eventBus.Publish("MessageReceived", assistantMessage)
	
	// TODO: Step 7: 记录监控指标
	// monitoringService.RecordTokenUsage(req.Model, tokens)
	
	return &SendMessageResponse{
		MessageID:      assistantMessage.MessageID,
		Content:        assistantMessage.Content,
		Tokens:         tokens,
		ConversationID: conv.ConversationID,
		Model:          assistantMessage.Model,
	}, nil
}

// GetConversationHistory 获取对话历史
func (o *ChatOrchestrator) GetConversationHistory(ctx context.Context, conversationID string, userID string) ([]*model.Message, error) {
	// 验证对话所有权
	conv, err := o.conversationRepo.FindByID(ctx, conversationID)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}
	
	if conv.UserID != userID {
		return nil, fmt.Errorf("unauthorized access")
	}
	
	// 获取消息历史
	messages, err := o.messageRepo.FindByConversation(ctx, conversationID, 100, 0)
	if err != nil {
		return nil, fmt.Errorf("get messages failed: %w", err)
	}
	
	return messages, nil
}

// DeleteConversation 删除对话（跨领域编排）
func (o *ChatOrchestrator) DeleteConversation(ctx context.Context, conversationID string, userID string) error {
	// 验证所有权
	conv, err := o.conversationRepo.FindByID(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}
	
	if conv.UserID != userID {
		return fmt.Errorf("unauthorized access")
	}
	
	// 删除所有消息
	messages, _ := o.messageRepo.FindByConversation(ctx, conversationID, -1, 0)
	for _, msg := range messages {
		err = o.messageRepo.Delete(ctx, msg.MessageID)
		if err != nil {
			fmt.Printf("delete message failed: %v\n", err)
		}
	}
	
	// 删除对话
	err = o.conversationRepo.Delete(ctx, conversationID)
	if err != nil {
		return fmt.Errorf("delete conversation failed: %w", err)
	}
	
	// TODO: 发布 ConversationDeleted 事件
	
	return nil
}

// getModelOrDefault 获取模型或返回默认值
func getModelOrDefault(model string) string {
	if model == "" {
		return "gpt-4o"
	}
	return model
}

