# @go-genai-stack/utils

Shared utility functions for Web and Mobile platforms.

## 📦 包说明

这个包包含跨 Web 和 Mobile 平台使用的工具函数。

## 🚀 使用方式

### 格式化函数

```typescript
import { formatRelativeTime, formatTokenCount, formatCurrency } from '@go-genai-stack/utils';

// 相对时间
formatRelativeTime(new Date()) // "刚刚"
formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5)) // "5分钟前"

// Token 数量
formatTokenCount(1500) // "1.5K"

// 金额
formatCurrency(0.001) // "$0.00"
```

### 验证函数

```typescript
import { isValidEmail, validateMessageLength } from '@go-genai-stack/utils';

// 邮箱验证
isValidEmail('user@example.com') // true

// 消息验证
const result = validateMessageLength('Hello world');
if (!result.valid) {
  console.error(result.error);
}
```

### 存储函数

```typescript
import { createStorage, WebStorageAdapter, STORAGE_KEYS } from '@go-genai-stack/utils';

// Web
const storage = createStorage(new WebStorageAdapter());

// 保存用户 token
await storage.setString(STORAGE_KEYS.USER_TOKEN, 'abc123');

// 保存对象
await storage.setObject('user', { id: '123', name: 'Alice' });

// 读取
const token = await storage.getString(STORAGE_KEYS.USER_TOKEN);
const user = await storage.getObject<User>('user');
```

#### Mobile 中使用

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStorage, MobileStorageAdapter } from '@go-genai-stack/utils';

// Mobile
const storage = createStorage(new MobileStorageAdapter(AsyncStorage));
```

## 📂 包含的模块

- **format.ts** - 格式化函数（时间、数字、金额等）
- **validation.ts** - 验证函数（邮箱、URL、消息等）
- **storage.ts** - 统一的存储接口（抽象 Web 和 Mobile）

## 🧪 测试

```bash
pnpm --filter @go-genai-stack/utils test
```

## 📝 添加新工具函数

1. 在对应的文件中添加函数（或创建新文件）
2. 添加完整的 JSDoc 注释和示例
3. 在 `index.ts` 中导出
4. 编写单元测试

## 🔗 相关文档

- [Vibe Coding 最优架构](../../docs/optimal-architecture.md)

