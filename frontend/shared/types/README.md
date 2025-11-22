# @go-genai-stack/types

TypeScript type definitions generated from Go backend DTOs.

## 📦 包说明

这个包包含从后端 Go Structs 自动生成的 TypeScript 接口定义。

**来源**：`backend/domains/*/http/dto`  
**工具**：`tygo`  
**用途**：Web 和 Mobile 的 HTTP API 类型定义

## 🔄 生成类型

```bash
# 从项目根目录运行
pnpm sync

# 或直接运行
./scripts/sync_types.sh
```

## 📖 使用方式

### 在 Web 中使用

```typescript
import { SendMessageRequest, SendMessageResponse } from '@go-genai-stack/types';

async function sendMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return response.json();
}
```

### 在 Mobile 中使用

```typescript
import { SendMessageRequest } from '@go-genai-stack/types';

const request: SendMessageRequest = {
  user_id: userId,
  message: text,
};
```

## 📂 结构

```
shared/types/
├── domains/           # 领域接口类型（tygo 生成）
│   ├── chat.ts       # 聊天领域
│   ├── llm.ts        # LLM 领域
│   └── monitoring.ts # 监控领域
├── index.ts          # 统一导出
├── package.json
├── tsconfig.json
└── README.md
```

## ⚠️ 注意事项

1. **不要手动编辑** `domains/` 下的文件，它们由 tygo 自动生成
2. **类型同步**：修改后端 DTO 后，记得运行 `pnpm sync`
3. **版本一致性**：这个包的版本应与后端 API 版本保持一致

## 🔗 相关文档

- [Vibe Coding 最优架构](../../docs/optimal-architecture.md)
- [类型同步指南](../../docs/type-sync.md)

