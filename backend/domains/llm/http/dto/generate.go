package dto

// GenerateRequest LLM 生成请求
type GenerateRequest struct {
	Model       string                 `json:"model" binding:"required"`
	Prompt      string                 `json:"prompt" binding:"required"`
	MaxTokens   int                    `json:"max_tokens,omitempty"`
	Temperature float64                `json:"temperature,omitempty"`
	TopP        float64                `json:"top_p,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// GenerateResponse LLM 生成响应
type GenerateResponse struct {
	Content      string `json:"content"`
	Model        string `json:"model"`
	Tokens       int    `json:"tokens"`
	FinishReason string `json:"finish_reason"`
}

// StructuredRequest 结构化输出请求
type StructuredRequest struct {
	Model       string                 `json:"model" binding:"required"`
	Prompt      string                 `json:"prompt" binding:"required"`
	SchemaName  string                 `json:"schema_name" binding:"required"`
	MaxRetries  int                    `json:"max_retries,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// StructuredResponse 结构化输出响应
type StructuredResponse struct {
	Data         map[string]interface{} `json:"data"`
	Model        string                 `json:"model"`
	Tokens       int                    `json:"tokens"`
	Retries      int                    `json:"retries"`
	ValidationOK bool                   `json:"validation_ok"`
}

// ListModelsResponse 模型列表响应
type ListModelsResponse struct {
	Models []ModelInfo `json:"models"`
}

// ModelInfo 模型信息
type ModelInfo struct {
	Name         string   `json:"name"`
	DisplayName  string   `json:"display_name"`
	Provider     string   `json:"provider"`
	MaxTokens    int      `json:"max_tokens"`
	Capabilities []string `json:"capabilities"`
}

