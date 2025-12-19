# 快速参考

## 🚀 常用命令

```bash
# 依赖管理
pnpm install                                      # 安装所有依赖
pnpm --filter @go-genai-stack/web add <pkg>      # 为 Web 添加依赖
pnpm --filter @go-genai-stack/mobile add <pkg>   # 为 Mobile 添加依赖

# 开发
pnpm dev                # 启动所有服务
pnpm dev:backend        # 只启动后端
pnpm dev:web           # 只启动 Web
pnpm dev:mobile        # 只启动 Mobile

# 类型同步
pnpm sync              # 从 Go 生成 TypeScript 类型

# 构建
pnpm build             # 构建所有项目
pnpm build:web         # 构建 Web
pnpm build:backend     # 构建后端

# 测试
pnpm test              # 测试所有项目
pnpm test:web          # 测试 Web
pnpm test:backend      # 测试后端

# Docker 环境
cd docker/prod && ./start.sh              # 启动生产环境
cd docker/frontend-debug && ./start.sh    # 启动前端开发环境
cd docker/backend-debug && ./start.sh     # 启动后端开发环境
cd docker/e2e && ./start.sh               # 启动 E2E 测试环境
cd docker/monitoring && ./start.sh        # 启动监控服务
```

## 📦 Import 路径

```typescript
// 类型定义（从后端生成）
import { SendMessageRequest, SendMessageResponse } from '@go-genai-stack/types';

// 工具函数
import { formatRelativeTime, isValidEmail } from '@go-genai-stack/utils';

// 常量
import { API_ENDPOINTS, ERROR_CODES, MODELS } from '@go-genai-stack/constants';

// Web 内部
import { Button } from '@/components/ui/Button';
import type { ChatStore } from '@/features/chat/types';

// Mobile 内部
import { Button } from '@/components/Button';
```

## 🗂️ 目录结构速查

```
go-genai-stack/
├── backend/                    # Go 后端
│   └── domains/               # 领域（DDD）
│       └── {domain}/
│           ├── README.md      # 领域说明
│           ├── usecases.yaml  # 用例声明
│           ├── http/dto/      # HTTP DTO（tygo 来源）
│           └── handlers/      # 用例实现
│
├── frontend/                  # 前端 Monorepo
│   ├── web/                   # React Web
│   │   └── src/
│   │       └── features/     # 功能模块（对齐领域）
│   │           └── {feature}/
│   │               ├── api/  # API 调用
│   │               ├── components/
│   │               ├── hooks/
│   │               └── types.ts  # UI 类型
│   │
│   ├── mobile/                # React Native
│   │   └── src/
│   │       └── features/
│   │
│   └── shared/                 # 共享包
│       ├── types/            # API 类型（tygo 生成）
│       ├── utils/            # 工具函数
│       └── constants/        # 常量
│
└── docker/                    # Docker 环境配置
    ├── prod/                 # 生产环境
    ├── frontend-debug/       # 前端开发环境
    ├── backend-debug/        # 后端开发环境
    └── e2e/                  # E2E 测试环境
```

## 🔄 工作流速查

### 添加新 API

1. **后端定义 DTO**
   ```go
   // backend/domains/chat/http/dto/new_api.go
   type NewRequest struct {
       Field string `json:"field"`
   }
   ```

2. **生成前端类型**
   ```bash
   pnpm sync
   ```

3. **Web 使用**
   ```typescript
   import { NewRequest } from '@go-genai-stack/types';
   ```

### 添加共享工具函数

1. **在 frontend/shared/utils 添加**
   ```typescript
   // frontend/shared/utils/myUtil.ts
   export function myUtil() { ... }
   ```

2. **导出**
   ```typescript
   // frontend/shared/utils/index.ts
   export * from './myUtil';
   ```

3. **使用**
   ```typescript
   import { myUtil } from '@go-genai-stack/utils';
   ```

## 🎯 类型分类

| 类型 | 位置 | 示例 |
|------|------|------|
| HTTP API 接口 | `frontend/shared/types/domains/` | `SendMessageRequest` |
| Web UI 状态 | `frontend/web/src/features/*/types.ts` | `ChatMessageUI` |
| Mobile UI 状态 | `frontend/mobile/src/features/*/types.ts` | `ChatMessageRN` |
| 共享工具类型 | `frontend/shared/utils/*.ts` | `StorageAdapter` |
| 共享常量类型 | `frontend/shared/constants/*.ts` | `ModelName` |

## 🛠️ 配置文件速查

### package.json 依赖配置

```json
{
  "dependencies": {
    "@go-genai-stack/types": "workspace:*",
    "@go-genai-stack/utils": "workspace:*",
    "@go-genai-stack/constants": "workspace:*"
  }
}
```

### tsconfig.json 路径配置

**Web 项目** (`frontend/web/tsconfig.json`):
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@go-genai-stack/types": ["../shared/types"],
      "@go-genai-stack/utils": ["../shared/utils"],
      "@go-genai-stack/constants": ["../shared/constants"]
    }
  }
}
```

**Mobile 项目** (`frontend/mobile/tsconfig.json`):
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@go-genai-stack/types": ["../shared/types"],
      "@go-genai-stack/utils": ["../shared/utils"],
      "@go-genai-stack/constants": ["../shared/constants"]
    }
  }
}
```

## 📝 代码模板

### API 调用模板

```typescript
import type { XxxRequest, XxxResponse } from '@go-genai-stack/types';
import { API_ENDPOINTS } from '@go-genai-stack/constants';

export async function xxxApi(
  req: XxxRequest
): Promise<XxxResponse> {
  const response = await fetch(API_ENDPOINTS.xxx.xxx, {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return response.json();
}
```

### 组件模板（使用类型）

```typescript
import type { XxxResponse } from '@go-genai-stack/types';
import { formatRelativeTime } from '@go-genai-stack/utils';

interface XxxProps {
  data: XxxResponse;
}

export function Xxx({ data }: XxxProps) {
  return <div>{formatRelativeTime(data.timestamp)}</div>;
}
```

### 错误处理模板

```typescript
import { ERROR_CODES, getErrorMessage, isRateLimitError } from '@go-genai-stack/constants';

try {
  await api();
} catch (error) {
  if (isRateLimitError(error.code)) {
    showToast(getErrorMessage(error.code));
  }
}
```

## 🐛 调试清单

### TypeScript 找不到类型

- [ ] 运行 `pnpm install`
- [ ] 运行 `pnpm sync`
- [ ] 检查 `tsconfig.json` 的 `paths` 配置
- [ ] 重启 TypeScript 服务器（VSCode: Cmd+Shift+P → Restart TS Server）

### Workspace 链接失败

- [ ] 检查 `pnpm-workspace.yaml`
- [ ] 检查 `package.json` 的 `workspace:*` 依赖
- [ ] 运行 `pnpm install`
- [ ] 清理并重装：`rm -rf node_modules && pnpm install`

### tygo 生成失败

- [ ] 检查 tygo 安装：`which tygo`
- [ ] 安装 tygo：`go install github.com/gzuidhof/tygo@latest`
- [ ] 检查 Go bin 在 PATH：`echo $PATH`
- [ ] 检查 `tygo.yaml` 配置

## 🔗 快速链接

- [架构概览](../Core/architecture-overview.md) - 完整的项目架构说明
- [Shared 包文档](../../frontend/shared/README.md) - 前端共享包说明
- [类型同步指南](./type-sync.md) - Go → TypeScript 类型同步
- [Vibe-Coding-Friendly 理念](../Core/vibe-coding-friendly.md) - 核心设计理念
- [Docker 环境指南](../../docker/README.md) - Docker 环境配置
- [主 README](../../README.md) - 项目总览

