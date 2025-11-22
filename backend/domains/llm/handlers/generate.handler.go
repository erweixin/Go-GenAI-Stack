package handlers

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/domains/llm/http/dto"
)

// ListModelsHandler 列出可用模型
func ListModelsHandler(ctx context.Context, c *app.RequestContext) {
	// TODO: 从配置或数据库读取模型列表
	resp := &dto.ListModelsResponse{
		Models: []dto.ModelInfo{
			{
				Name:         "gpt-4o",
				DisplayName:  "GPT-4o",
				Provider:     "openai",
				MaxTokens:    128000,
				Capabilities: []string{"chat", "structured"},
			},
			{
				Name:         "gpt-4o-mini",
				DisplayName:  "GPT-4o Mini",
				Provider:     "openai",
				MaxTokens:    128000,
				Capabilities: []string{"chat", "structured"},
			},
			{
				Name:         "claude-3-5-sonnet-20241022",
				DisplayName:  "Claude 3.5 Sonnet",
				Provider:     "anthropic",
				MaxTokens:    200000,
				Capabilities: []string{"chat", "structured"},
			},
		},
	}

	c.JSON(consts.StatusOK, resp)
}

// GenerateHandler 生成文本
func GenerateHandler(ctx context.Context, c *app.RequestContext) {
	var req dto.GenerateRequest

	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": err.Error(),
		})
		return
	}

	// TODO: 调用 Eino 进行实际的 LLM 调用
	// 目前返回 mock 数据
	resp := &dto.GenerateResponse{
		Content:      "这是 LLM 的回复（Mock）",
		Model:        req.Model,
		Tokens:       20,
		FinishReason: "stop",
	}

	c.JSON(consts.StatusOK, resp)
}

// StructuredGenerateHandler 结构化输出生成
func StructuredGenerateHandler(ctx context.Context, c *app.RequestContext) {
	var req dto.StructuredRequest

	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": err.Error(),
		})
		return
	}

	// TODO: 实现 Structured Output
	// 1. 根据 schema_name 获取 JSON Schema
	// 2. 调用 LLM with JSON mode
	// 3. 验证输出
	// 4. 如果失败，重试

	resp := &dto.StructuredResponse{
		Data: map[string]interface{}{
			"name": "示例",
			"age":  25,
		},
		Model:        req.Model,
		Tokens:       30,
		Retries:      0,
		ValidationOK: true,
	}

	c.JSON(consts.StatusOK, resp)
}

// SelectModelHandler 根据策略选择模型
func SelectModelHandler(ctx context.Context, c *app.RequestContext) {
	// TODO: 实现模型路由逻辑
	// 策略：latency, cost, quality, balanced

	c.JSON(consts.StatusOK, map[string]interface{}{
		"selected_model": "gpt-4o",
		"strategy":       "balanced",
		"reason":         "最佳性价比",
	})
}
