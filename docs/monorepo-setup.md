# Monorepo 设置指南

本指南介绍如何设置和使用 Go-GenAI-Stack 的 Monorepo 架构。

## 📋 前置要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Go** >= 1.21
- **tygo** (用于类型生成)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repo-url>
cd Go-GenAI-Stack
```

### 2. 安装依赖

```bash
# 安装前端依赖（使用 pnpm workspace）
pnpm install

# 安装后端依赖
cd backend
go mod download
cd ..

# 安装 tygo
go install github.com/gzuidhof/tygo@latest
```

### 3. 生成类型定义

```bash
# 运行类型同步脚本
pnpm sync

# 或直接运行
./scripts/sync_types.sh
```

### 4. 启动开发服务器

```bash
# 启动所有服务（后端 + Web）
pnpm dev

# 或分别启动
pnpm dev:backend   # Go 后端
pnpm dev:web       # React Web
pnpm dev:mobile    # React Native
```

## 📦 Workspace 结构

```
go-genai-stack/
├── backend/               # Go 后端
│   ├── cmd/
│   ├── domains/          # DDD 领域
│   └── shared/
│
├── web/                  # React Web 前端
│   ├── src/
│   │   ├── features/    # 功能模块
│   │   └── types/       # Web 特有类型
│   └── package.json
│
├── mobile/               # React Native 移动端
│   ├── src/
│   │   ├── features/
│   │   └── types/
│   └── package.json
│
├── shared/               # 共享包
│   ├── types/           # API 接口类型（tygo 生成）
│   │   └── package.json
│   ├── utils/           # 工具函数
│   │   └── package.json
│   └── constants/       # 常量定义
│       └── package.json
│
├── scripts/             # 项目脚本
├── docs/               # 文档
├── pnpm-workspace.yaml # pnpm workspace 配置
└── package.json        # 根 package.json
```

## 🔄 工作流

### 开发新功能

#### 1. 后端添加 API

```go
// backend/domains/chat/http/dto/send_message.go
package dto

type SendMessageRequest struct {
    UserID  string `json:"user_id" binding:"required"`
    Message string `json:"message" binding:"required"`
    Model   string `json:"model,omitempty"`
}

type SendMessageResponse struct {
    MessageID string `json:"message_id"`
    Content   string `json:"content"`
    Tokens    int    `json:"tokens"`
}
```

#### 2. 生成前端类型

```bash
pnpm sync
```

这会生成：

```typescript
// shared/types/domains/chat.ts
export interface SendMessageRequest {
  user_id: string;
  message: string;
  model?: string;
}

export interface SendMessageResponse {
  message_id: string;
  content: string;
  tokens: number;
}
```

#### 3. Web 使用类型

```typescript
// web/src/features/chat/api/chatApi.ts
import type { SendMessageRequest, SendMessageResponse } from '@go-genai-stack/types';
import { API_ENDPOINTS } from '@go-genai-stack/constants';

export async function sendMessage(
  req: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await fetch(API_ENDPOINTS.chat.send, {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return response.json();
}
```

#### 4. Mobile 使用相同类型

```typescript
// mobile/src/features/chat/api/chatApi.ts
import type { SendMessageRequest } from '@go-genai-stack/types';

// 完全相同的类型安全！
const request: SendMessageRequest = {
  user_id: userId,
  message: text,
};
```

### 使用共享工具

```typescript
// Web 或 Mobile 都可以使用
import { formatRelativeTime, formatTokenCount } from '@go-genai-stack/utils';
import { ERROR_CODES, getErrorMessage } from '@go-genai-stack/constants';

// 格式化
const timeAgo = formatRelativeTime(message.timestamp);
const tokens = formatTokenCount(message.tokens);

// 错误处理
if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
  alert(getErrorMessage(error.code)); // "请求过于频繁，请稍后再试"
}
```

## 🛠️ 常用命令

### 依赖管理

```bash
# 安装所有依赖
pnpm install

# 为特定包添加依赖
pnpm --filter @go-genai-stack/web add react-query
pnpm --filter @go-genai-stack/mobile add react-native-vector-icons

# 为 shared 包添加依赖
pnpm --filter @go-genai-stack/utils add date-fns
```

### 开发

```bash
# 启动所有服务
pnpm dev

# 启动特定服务
pnpm dev:backend
pnpm dev:web
pnpm dev:mobile

# 类型同步
pnpm sync
```

### 构建

```bash
# 构建所有项目
pnpm build

# 构建特定项目
pnpm build:backend
pnpm build:web
pnpm build:mobile
```

### 测试

```bash
# 测试所有项目
pnpm test

# 测试后端
pnpm test:backend

# 测试前端
pnpm test:web
pnpm test:mobile

# 测试 shared 包
pnpm --filter @go-genai-stack/utils test
```

### 清理

```bash
# 清理所有构建产物和依赖
pnpm clean

# 重新安装
pnpm install
```

## 📝 添加新的 Shared 包

### 1. 创建包目录

```bash
mkdir -p shared/新包名
cd shared/新包名
```

### 2. 创建 package.json

```json
{
  "name": "@go-genai-stack/新包名",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

### 3. 创建 tsconfig.json

参考 `shared/utils/tsconfig.json`

### 4. 在 Web/Mobile 中使用

**package.json**:
```json
{
  "dependencies": {
    "@go-genai-stack/新包名": "workspace:*"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "paths": {
      "@go-genai-stack/新包名": ["../shared/新包名"]
    }
  }
}
```

### 5. 重新安装依赖

```bash
pnpm install
```

## 🐛 常见问题

### 类型找不到

**问题**：TypeScript 提示找不到 `@go-genai-stack/types`

**解决**：
```bash
# 1. 检查是否安装依赖
pnpm install

# 2. 检查 tygo 是否生成类型
pnpm sync

# 3. 重启 TypeScript 服务器（VSCode: Cmd+Shift+P → Restart TS Server）
```

### pnpm workspace 链接失败

**问题**：workspace 依赖没有正确链接

**解决**：
```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules
pnpm install
```

### tygo 生成失败

**问题**：运行 `pnpm sync` 失败

**解决**：
```bash
# 1. 检查 tygo 是否安装
which tygo

# 2. 如果没有，安装 tygo
go install github.com/gzuidhof/tygo@latest

# 3. 确保 Go bin 在 PATH 中
export PATH=$PATH:$(go env GOPATH)/bin

# 4. 重新运行
pnpm sync
```

### Mobile 类型不同步

**问题**：Mobile 使用的类型与 Web 不一致

**原因**：过去使用符号链接，现在改为 pnpm workspace

**解决**：
```bash
# 删除旧的符号链接
rm -rf mobile/src/types/domains

# 在 mobile/package.json 中添加依赖
# "dependencies": {
#   "@go-genai-stack/types": "workspace:*"
# }

# 重新安装
pnpm install
```

## 🎯 最佳实践

### 1. 类型定义

- ✅ **HTTP API 类型** 放在 `shared/types`（tygo 生成）
- ✅ **UI 状态类型** 放在各自的 `features/*/types.ts`
- ❌ **不要** 手动编辑 `shared/types/domains/`

### 2. 工具函数

- ✅ **跨端通用** 的放在 `shared/utils`
- ✅ **平台特定** 的放在 `web/src/utils` 或 `mobile/src/utils`
- ❌ **不要** 在 shared 中使用平台特定 API（如 DOM API）

### 3. 常量

- ✅ **API 路径、错误码** 放在 `shared/constants`
- ✅ **环境配置** 放在各自的 `.env`
- ❌ **不要** 硬编码字符串

### 4. 依赖管理

- ✅ 使用 `workspace:*` 引用 shared 包
- ✅ 使用 `pnpm --filter` 为特定包添加依赖
- ❌ **不要** 直接在 shared 包目录运行 `npm install`

### 5. 版本控制

- ✅ 提交 `pnpm-lock.yaml`
- ✅ 提交 `package.json`
- ❌ **不要** 提交 `node_modules/`
- ❌ **不要** 提交 `shared/types/domains/*.ts`（可选，看团队习惯）

## 🔗 相关文档

- [Shared 包文档](../shared/README.md)
- [类型同步指南](./type-sync.md)
- [Vibe Coding DDD 架构](./vibe-coding-ddd-structure.md)

