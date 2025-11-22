# LLM Domain (LLM 领域)

## 概述

LLM 领域负责管理大语言模型的调用、路由、配置和监控。

## 领域边界

### 职责范围

- ✅ 模型配置管理
- ✅ 模型调用接口（统一抽象）
- ✅ 多模型路由（基于策略）
- ✅ Structured Output (Go Struct → JSON Schema → Validation)
- ✅ 模型性能监控

### 不包含的职责

- ❌ 对话管理（属于 Chat Domain）
- ❌ Token 计费（属于 Monitoring Domain）
- ❌ 用户权限（属于 User Domain）

## 核心概念

### Model (模型)
支持的模型及其配置。

### Router (路由器)
根据策略选择最优模型：
- Latency-based（延迟优先）
- Cost-based（成本优先）
- Quality-based（质量优先）

### Structured Output
将 LLM 输出强制转换为特定的 Go Struct 格式。

## 技术栈

- LLM 框架：Eino
- 支持的提供商：OpenAI, Anthropic, Google
- Schema 生成：invopop/jsonschema
- Schema 验证：xeipuuv/gojsonschema

## 快速开始

```go
// 调用 LLM
response, err := llmService.Generate(ctx, &GenerateRequest{
    Model: "gpt-4o",
    Prompt: "Hello, AI!",
})

// Structured Output
type UserInfo struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

response, err := llmService.GenerateStructured(ctx, &StructuredRequest{
    Model: "gpt-4o",
    Prompt: "Extract user info: John is 25 years old",
    Schema: UserInfo{},
})
```

## 待办事项

- [ ] 集成 Eino
- [ ] 实现多模型路由
- [ ] 实现 Structured Output
- [ ] 添加模型性能监控

