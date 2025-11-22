# @go-genai-stack/constants

Shared constants for Web and Mobile platforms.

## 📦 包说明

这个包包含跨 Web 和 Mobile 平台使用的常量定义。

## 🚀 使用方式

### API 端点

```typescript
import { API_ENDPOINTS, buildUrl } from '@go-genai-stack/constants';

// 使用端点
fetch(API_ENDPOINTS.chat.send, {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' }),
});

// 带参数的 URL
const url = buildUrl(API_ENDPOINTS.chat.deleteConversation, { id: 'conv-123' });
// "/api/chat/conversations/conv-123/delete"
```

### 错误码

```typescript
import { 
  ERROR_CODES, 
  getErrorMessage, 
  isUserError,
  isRateLimitError 
} from '@go-genai-stack/constants';

// 检查错误类型
if (isRateLimitError(errorCode)) {
  showRetryDialog();
}

// 获取错误消息
const message = getErrorMessage(ERROR_CODES.MESSAGE_EMPTY);
// "消息不能为空"
```

### 模型常量

```typescript
import { 
  MODELS, 
  MODEL_METADATA, 
  getModelDisplayName,
  getModelsByCapability 
} from '@go-genai-stack/constants';

// 使用模型常量
const response = await llmApi.generate({
  model: MODELS.GPT4O,
  prompt: 'Hello',
});

// 获取显示名称
getModelDisplayName(MODELS.GPT4O) // "GPT-4o"

// 按能力筛选
const fastModels = getModelsByCapability('fast');
// ['gpt-4o-mini']
```

## 📂 包含的模块

- **api-endpoints.ts** - API 路径常量
- **error-codes.ts** - 错误码和错误消息
- **models.ts** - LLM 模型相关常量

## ⚠️ 注意事项

1. **与后端保持同步**：常量定义应与后端保持一致
2. **使用常量而非硬编码**：避免直接写字符串
3. **TypeScript 类型安全**：充分利用 `as const` 和类型推导

## 🔗 相关文档

- [Vibe Coding 最优架构](../../docs/optimal-architecture.md)
- [后端错误码定义](../../backend/domains/shared/errors)

