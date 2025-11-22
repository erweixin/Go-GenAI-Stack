# Go-GenAI-Stack 目录结构（Frontend 组织版）

## 📁 完整目录结构

```
go-genai-stack/
├── README.md                                   # 项目主文档
├── package.json                               # 根 package.json（全局脚本）
├── tygo.yaml                                  # tygo 配置（生成到 frontend/shared/types）
├── .gitignore
├── .cursorrules                               # Cursor AI 规则
│
├── backend/                                    # 后端服务（Go + Hertz + Eino）
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── domains/                               # DDD 领域（Vibe-friendly）
│   │   ├── chat/                             # 聊天领域
│   │   │   ├── README.md                     # 领域说明
│   │   │   ├── glossary.md                   # 领域术语
│   │   │   ├── rules.md                      # 业务规则
│   │   │   ├── events.md                     # 领域事件
│   │   │   ├── usecases.yaml                 # 用例声明（AI 可读）
│   │   │   ├── ai-metadata.json              # AI 元数据
│   │   │   ├── model/                        # 领域模型
│   │   │   ├── handlers/                     # 用例实现
│   │   │   ├── http/dto/                     # DTO（tygo 来源）★
│   │   │   └── tests/
│   │   │
│   │   ├── llm/                              # LLM 领域
│   │   │   └── http/dto/                     # ★
│   │   │
│   │   ├── monitoring/                        # 监控领域
│   │   │   └── http/dto/                     # ★
│   │   │
│   │   └── shared/                           # 领域间共享
│   │
│   ├── infra/                                 # 基础设施
│   ├── shared/                                # 后端共享代码
│   ├── go.mod
│   └── go.sum
│
├── frontend/                                   # 【前端 Monorepo】独立管理
│   ├── package.json                           # 前端根 package.json
│   ├── pnpm-workspace.yaml                    # pnpm workspace 配置
│   │
│   ├── web/                                   # React Web 应用
│   │   ├── src/
│   │   │   ├── features/                     # 功能模块（对齐后端领域）
│   │   │   │   ├── chat/                     # 聊天功能 ← backend/domains/chat
│   │   │   │   │   ├── api/                  # API 调用
│   │   │   │   │   │   └── chatApi.ts        # 使用 @go-genai-stack/types
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── stores/
│   │   │   │   │   └── types.ts              # Web UI 特有类型
│   │   │   │   │
│   │   │   │   ├── llm/                      # LLM 功能
│   │   │   │   └── monitoring/               # 监控功能
│   │   │   │
│   │   │   ├── components/ui/                # shadcn/ui 组件
│   │   │   ├── types/                        # Web 全局类型
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   │
│   │   ├── public/
│   │   ├── package.json                      # 依赖 @go-genai-stack/*
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── mobile/                                # React Native 移动应用
│   │   ├── src/
│   │   │   ├── features/                     # 功能模块
│   │   │   │   ├── chat/
│   │   │   │   │   ├── api/                  # 使用 @go-genai-stack/types
│   │   │   │   │   ├── components/
│   │   │   │   │   └── types.ts              # Mobile UI 特有类型
│   │   │   │   │
│   │   │   │   ├── llm/
│   │   │   │   └── monitoring/
│   │   │   │
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   └── types/
│   │   │
│   │   ├── app/                               # Expo Router
│   │   ├── assets/
│   │   ├── package.json                      # 依赖 @go-genai-stack/*
│   │   ├── tsconfig.json
│   │   └── app.json
│   │
│   └── shared/                                # 【前端共享包】pnpm workspace
│       ├── README.md                         # Shared 包总览
│       │
│       ├── types/                            # API 接口类型（tygo 生成）★★★
│       │   ├── domains/
│       │   │   ├── chat.ts                   # ← tygo 生成自 backend/domains/chat/http/dto
│       │   │   ├── llm.ts                    # ← tygo 生成
│       │   │   └── monitoring.ts             # ← tygo 生成
│       │   │
│       │   ├── index.ts                      # 统一导出
│       │   ├── package.json                  # @go-genai-stack/types
│       │   ├── tsconfig.json
│       │   └── README.md
│       │
│       ├── utils/                            # 工具函数（跨 Web/Mobile）
│       │   ├── format.ts                     # 格式化函数
│       │   ├── validation.ts                 # 验证函数
│       │   ├── storage.ts                    # 存储抽象
│       │   ├── index.ts
│       │   ├── package.json                  # @go-genai-stack/utils
│       │   ├── tsconfig.json
│       │   └── README.md
│       │
│       └── constants/                        # 常量定义（跨 Web/Mobile）
│           ├── api-endpoints.ts              # API 路径
│           ├── error-codes.ts                # 错误码
│           ├── models.ts                     # LLM 模型
│           ├── index.ts
│           ├── package.json                  # @go-genai-stack/constants
│           ├── tsconfig.json
│           └── README.md
│
├── scripts/                                   # 项目脚本
│   ├── sync_types.sh                         # 类型同步（→ frontend/shared/types）
│   ├── dev_all.sh
│   └── test_all.sh
│
└── docs/                                      # 项目文档
    ├── vibe-coding-ddd-structure.md
    ├── ai_workflow.md
    ├── type-sync.md
    ├── monorepo-setup.md
    └── ...
```

## 🔄 数据流关系

### 类型生成流程

```
backend/domains/{domain}/http/dto/*.go
    ↓ [tygo generate]
frontend/shared/types/domains/{domain}.ts
    ↓ [pnpm workspace: @go-genai-stack/types]
    ├─→ frontend/web/     ✓
    └─→ frontend/mobile/  ✓
```

### 工具函数流程

```
frontend/shared/utils/
    ↓ [pnpm workspace: @go-genai-stack/utils]
    ├─→ frontend/web/     ✓
    └─→ frontend/mobile/  ✓
```

### 常量流程

```
frontend/shared/constants/
    ↓ [pnpm workspace: @go-genai-stack/constants]
    ├─→ frontend/web/     ✓
    └─→ frontend/mobile/  ✓
```

## 📦 pnpm Workspace 配置

### frontend/pnpm-workspace.yaml

```yaml
packages:
  - 'web'
  - 'mobile'
  - 'shared/*'
```

### frontend/package.json

```json
{
  "name": "@go-genai-stack/frontend",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel dev",
    "dev:web": "pnpm --filter @go-genai-stack/web dev",
    "dev:mobile": "pnpm --filter @go-genai-stack/mobile start"
  }
}
```

### Web/Mobile 的 package.json

```json
{
  "dependencies": {
    "@go-genai-stack/types": "workspace:*",
    "@go-genai-stack/utils": "workspace:*",
    "@go-genai-stack/constants": "workspace:*"
  }
}
```

## 🎯 关键优势

### 1. **清晰的前后端分离**

```
backend/          ← 后端开发者关注这里
frontend/         ← 前端开发者关注这里
  ├── web/
  ├── mobile/
  └── shared/
```

- 后端和前端可以独立开发、部署
- 前端有自己的 pnpm workspace
- 职责边界清晰

### 2. **前端 Monorepo 独立管理**

```bash
# 在 frontend/ 目录下执行前端相关命令
cd frontend
pnpm install
pnpm dev
pnpm build
```

- 前端依赖管理独立
- 可以有独立的前端 CI/CD
- 符合团队习惯（前端团队只需关注 frontend/ 目录）

### 3. **类型同步自动化**

```bash
# 从根目录运行
pnpm sync

# 或
./scripts/sync_types.sh
```

tygo 自动将后端 DTO 生成到 `frontend/shared/types/`

### 4. **符合业界惯例**

大多数全栈项目都采用类似结构：

```
project/
├── backend/     ✓
├── frontend/    ✓
└── docs/
```

## 🚀 开发工作流

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
pnpm sync  # 从根目录运行
```

3. **前端使用**

```typescript
// frontend/web/src/features/chat/api/chatApi.ts
import { NewRequest } from '@go-genai-stack/types';

const request: NewRequest = {
  field: 'value',
};
```

### 使用共享工具

```typescript
// frontend/web 或 frontend/mobile
import { formatRelativeTime } from '@go-genai-stack/utils';
import { API_ENDPOINTS } from '@go-genai-stack/constants';
import type { SendMessageRequest } from '@go-genai-stack/types';
```

## 📝 类型分类

| 类型 | 位置 | 共享？ |
|------|------|--------|
| **HTTP API 接口** | `frontend/shared/types/` | ✅ Web + Mobile |
| **Web UI 状态** | `frontend/web/src/features/*/types.ts` | ❌ Web 独有 |
| **Mobile UI 状态** | `frontend/mobile/src/features/*/types.ts` | ❌ Mobile 独有 |
| **工具函数** | `frontend/shared/utils/` | ✅ Web + Mobile |
| **常量** | `frontend/shared/constants/` | ✅ Web + Mobile |

## 🎉 总结

这个目录结构的核心思想是：

1. **前后端分离**：`backend/` 和 `frontend/` 各自独立
2. **前端 Monorepo**：`frontend/` 下使用 pnpm workspace 管理 web, mobile, shared
3. **单一真理源**：后端 DTO → tygo → frontend/shared/types → Web/Mobile
4. **清晰边界**：API 类型 vs UI 类型，共享 vs 独有

这样组织既符合业界惯例，又保持了类型安全和代码复用的优势！🎯

