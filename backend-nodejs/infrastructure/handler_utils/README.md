# Handler Utils - Handler 工具函数

提供统一的错误处理、上下文提取等辅助功能，简化 Handler 层代码。

## 功能特性

- ✅ **统一错误处理**：`handleDomainError()` - 自动转换领域错误为 HTTP 响应
- ✅ **错误码映射**：自动将错误码映射到 HTTP 状态码
- ✅ **上下文提取**：`getUserIDFromRequest()` - 从请求中提取用户 ID
- ✅ **参数提取**：`getRequiredPathParam()` - 获取必需的路径参数
- ✅ **查询参数**：`getRequiredQueryParam()` / `getOptionalQueryParam()` - 获取查询参数

## 快速开始

### 1. 统一错误处理

```typescript
import { handleDomainError } from '../../infrastructure/handler_utils/helpers.js';

export async function createTaskHandler(
  deps: HandlerDependencies,
  req: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const output = await deps.taskService.createTask(ctx, input);
    reply.code(200).send(output);
  } catch (err) {
    // 统一错误处理：自动转换错误码、映射 HTTP 状态码
    handleDomainError(reply, err);
  }
}
```

### 2. 提取用户 ID

```typescript
import { getUserIDFromRequest } from '../../infrastructure/handler_utils/helpers.js';

export async function createTaskHandler(req: FastifyRequest, reply: FastifyReply) {
  // 从认证中间件注入的上下文中提取用户 ID
  // 如果用户未认证，自动抛出 UNAUTHORIZED 错误
  const userId = getUserIDFromRequest(req);
  
  // 使用 userId...
}
```

### 3. 获取路径参数

```typescript
import { getRequiredPathParam } from '../../infrastructure/handler_utils/helpers.js';

export async function updateTaskHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  // 获取必需的路径参数
  // 如果参数不存在或为空，自动抛出 VALIDATION_ERROR 错误
  const taskId = getRequiredPathParam(req, 'id');
  
  // 使用 taskId...
}
```

### 4. 获取查询参数

```typescript
import { 
  getRequiredQueryParam, 
  getOptionalQueryParam 
} from '../../infrastructure/handler_utils/helpers.js';

export async function listTasksHandler(
  req: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  // 必需的查询参数
  const page = getRequiredQueryParam(req, 'page');
  
  // 可选的查询参数（带默认值）
  const limit = getOptionalQueryParam(req, 'limit', 10);
  const offset = getOptionalQueryParam(req, 'offset', 0);
}
```

## API 参考

### handleDomainError(reply, err)

统一处理领域错误，转换为 HTTP 响应。

**支持的错误格式**：
1. `DomainError` - 结构化错误（推荐）
2. `"ERROR_CODE: message"` - 字符串格式错误（兼容现有代码）

**自动功能**：
- 提取错误码和消息
- 映射错误码到 HTTP 状态码
- 返回统一的错误响应格式

**示例**：
```typescript
// DomainError
throw createError('TASK_NOT_FOUND', 'Task with id 123 not found');
// → HTTP 404 { error: "TASK_NOT_FOUND", message: "Task with id 123 not found" }

// 字符串格式
throw new Error('TASK_NOT_FOUND: Task with id 123 not found');
// → HTTP 404 { error: "TASK_NOT_FOUND", message: "Task with id 123 not found" }
```

### getUserIDFromRequest(request)

从请求中提取用户 ID。

**行为**：
- 从认证中间件注入的 `request.userId` 中获取
- 如果用户未认证，抛出 `UNAUTHORIZED` 错误

**示例**：
```typescript
const userId = getUserIDFromRequest(request);
// 如果未认证，自动抛出：
// DomainError { code: "UNAUTHORIZED", statusCode: 401 }
```

### getRequiredPathParam(request, paramName)

获取必需的路径参数。

**行为**：
- 从 `request.params` 中获取参数
- 如果参数不存在或为空，抛出 `VALIDATION_ERROR` 错误

**示例**：
```typescript
const taskId = getRequiredPathParam(request, 'id');
// 如果参数为空，自动抛出：
// DomainError { code: "VALIDATION_ERROR", statusCode: 400 }
```

### getRequiredQueryParam(request, paramName)

获取必需的查询参数。

**行为**：
- 从 `request.query` 中获取参数
- 如果参数不存在或为空，抛出 `VALIDATION_ERROR` 错误

### getOptionalQueryParam(request, paramName, defaultValue)

获取可选的查询参数（带默认值）。

**行为**：
- 从 `request.query` 中获取参数
- 如果参数不存在或为空，返回默认值
- 自动进行类型转换（number、boolean）

**示例**：
```typescript
const limit = getOptionalQueryParam(request, 'limit', 10); // number
const enabled = getOptionalQueryParam(request, 'enabled', false); // boolean
```

## 错误码到 HTTP 状态码映射

工具函数自动将错误码映射到 HTTP 状态码：

| 错误码模式 | HTTP 状态码 |
|-----------|------------|
| `INVALID_*`, `EMPTY`, `TOO_LONG`, `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `INVALID_TOKEN` | 401 |
| `FORBIDDEN`, `ACCESS`, `USER_BANNED` | 403 |
| `*_NOT_FOUND`, `NOT_FOUND` | 404 |
| `*_EXISTS`, `CONFLICT` | 409 |
| `RATE_LIMIT`, `TOO_FREQUENT` | 429 |
| `*_FAILED`, `INTERNAL_ERROR`, `DATABASE_ERROR` | 500 |
| `EXTERNAL_*` | 502 |
| `UNAVAILABLE` | 503 |

## 最佳实践

1. **统一错误处理**：所有 Handler 都使用 `handleDomainError()` 处理错误
2. **使用工具函数**：使用 `getUserIDFromRequest()` 等工具函数，而不是直接访问 `request.userId`
3. **参数验证**：使用 `getRequiredPathParam()` 等函数，自动进行参数验证
4. **错误格式**：优先使用 `DomainError`，而不是字符串格式错误

## 参考

- [Go 后端 Handler Utils 实现](../backend/infrastructure/handler_utils/helpers.go)
- [错误定义](../../shared/errors/errors.ts)

