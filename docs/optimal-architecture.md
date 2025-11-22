# Vibe Coding 最优架构设计

## 核心理念

**Monorepo + Domain-First + Cross-Platform Type Safety**

- **Monorepo**：统一代码库，统一版本，统一工具链
- **Domain-First**：以领域为第一等公民，而非技术栈
- **Type Safety Everywhere**：Go → TypeScript（Web）+ TypeScript（React Native）
- **AI-Friendly**：清晰的结构，显式的知识，最小的认知负担

## 目录结构

```
go-genai-stack/                                  # Monorepo 根目录
│
├── backend/                                     # 后端服务（Go + Hertz + Eino）
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── domains/                                 # 【领域层】第一等公民
│   │   ├── chat/                                # 聊天领域（自包含）
│   │   │   ├── README.md                        # ✅ 必需：领域概览
│   │   │   ├── glossary.md                      # ✅ 必需：术语表
│   │   │   ├── rules.md                         # ✅ 必需：业务规则
│   │   │   ├── events.md                        # ✅ 必需：领域事件
│   │   │   ├── usecases.yaml                    # ✅ 必需：用例声明
│   │   │   ├── ai-metadata.json                 # ✅ 必需：AI 元数据
│   │   │   │
│   │   │   ├── model/                           # 领域模型
│   │   │   │   ├── conversation.go
│   │   │   │   └── message.go
│   │   │   │
│   │   │   ├── services/                        # 领域服务
│   │   │   │   └── context_manager.go
│   │   │   │
│   │   │   ├── handlers/                        # 用例处理器
│   │   │   │   └── send_message.handler.go
│   │   │   │
│   │   │   ├── http/                            # HTTP 层
│   │   │   │   └── dto/                         # 数据传输对象
│   │   │   │       ├── send_message.go          # ← 类型同步源
│   │   │   │       └── create_conversation.go
│   │   │   │
│   │   │   ├── repository.go                    # 仓储接口
│   │   │   ├── repository_impl.go               # 仓储实现
│   │   │   └── tests/
│   │   │       └── send_message.test.go
│   │   │
│   │   ├── llm/                                 # LLM 领域
│   │   │   └── ... (同上)
│   │   │
│   │   ├── monitoring/                          # 监控领域
│   │   │   └── ...
│   │   │
│   │   └── shared/                              # 共享内核
│   │       ├── errors/
│   │       ├── events/
│   │       └── types/
│   │
│   ├── infrastructure/                          # 基础设施
│   │   ├── persistence/
│   │   ├── queue/
│   │   └── middleware/
│   │
│   ├── pkg/                                     # 工具包
│   │   ├── logger/
│   │   └── ratelimiter/
│   │
│   ├── go.mod
│   └── go.sum
│
├── web/                                         # Web 前端（React + TypeScript）
│   ├── src/
│   │   ├── features/                            # 按功能组织（Feature-First）
│   │   │   ├── chat/                            # 聊天功能
│   │   │   │   ├── README.md                    # 功能说明
│   │   │   │   ├── components/
│   │   │   │   │   ├── ChatWindow.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   └── MessageInput.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useChat.ts
│   │   │   │   │   └── useSSE.ts
│   │   │   │   ├── stores/
│   │   │   │   │   └── chatStore.ts             # Zustand store
│   │   │   │   ├── api/
│   │   │   │   │   └── chatApi.ts               # API 调用
│   │   │   │   └── types.ts                     # 功能特定类型
│   │   │   │
│   │   │   ├── llm/                             # LLM 功能
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── monitoring/                      # 监控 Dashboard
│   │   │       └── ...
│   │   │
│   │   ├── shared/                              # 共享代码
│   │   │   ├── components/                      # 共享组件
│   │   │   │   └── ui/                          # shadcn/ui 组件
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── api/
│   │   │       └── client.ts                    # Axios 实例
│   │   │
│   │   ├── types/                               # 【类型定义】自动生成
│   │   │   ├── domains/                         # 从后端 DTO 生成
│   │   │   │   ├── chat.ts                      # ← tygo 自动生成
│   │   │   │   ├── llm.ts
│   │   │   │   └── monitoring.ts
│   │   │   └── shared.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── mobile/                                      # 移动端（React Native + TypeScript）
│   ├── src/
│   │   ├── features/                            # 功能组织（与 web 对齐）
│   │   │   ├── chat/                            # 聊天功能
│   │   │   │   ├── README.md
│   │   │   │   ├── components/
│   │   │   │   │   ├── ChatScreen.tsx
│   │   │   │   │   ├── MessageList.tsx          # 使用 RN 组件
│   │   │   │   │   └── MessageInput.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useChat.ts               # 可与 web 共享逻辑
│   │   │   │   ├── stores/
│   │   │   │   │   └── chatStore.ts
│   │   │   │   └── api/
│   │   │   │       └── chatApi.ts
│   │   │   │
│   │   │   └── llm/
│   │   │       └── ...
│   │   │
│   │   ├── shared/                              # 共享代码
│   │   │   ├── components/                      # RN 基础组件
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── api/
│   │   │       └── client.ts                    # axios 或 fetch
│   │   │
│   │   ├── types/                               # 【类型定义】与 web 共享
│   │   │   ├── domains/                         # 符号链接到 web/src/types/domains
│   │   │   │   ├── chat.ts                      # ← 与 web 共享
│   │   │   │   ├── llm.ts
│   │   │   │   └── monitoring.ts
│   │   │   └── shared.ts
│   │   │
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx
│   │   │
│   │   ├── App.tsx
│   │   └── index.tsx
│   │
│   ├── android/
│   ├── ios/
│   ├── package.json
│   ├── tsconfig.json
│   ├── metro.config.js
│   └── app.json
│
├── shared/                                      # 跨项目共享（可选）
│   ├── types/                                   # TypeScript 类型（如果不用符号链接）
│   └── utils/                                   # 工具函数（如果有跨端需求）
│
├── scripts/                                     # 项目级脚本
│   ├── sync_types.sh                            # 同步所有类型
│   ├── dev_all.sh                               # 启动所有服务
│   ├── test_all.sh                              # 运行所有测试
│   └── ai_codegen.sh                            # AI 代码生成
│
├── docs/                                        # 项目文档
│   ├── architecture.md
│   ├── vibe-coding-ddd-structure.md
│   ├── ai_workflow.md
│   └── type-sync.md
│
├── .cursorrules                                 # Cursor AI 规则
├── tygo.yaml                                    # tygo 配置
├── docker-compose.yml                           # Docker 编排
├── .gitignore
└── README.md
```

## 关键设计决策

### 1. Monorepo vs Multi-Repo

**选择：Monorepo**

**理由**：
- ✅ 统一版本管理（backend、web、mobile 版本一致）
- ✅ 共享类型定义（一次生成，多端使用）
- ✅ 原子化提交（接口变更和前端调整在同一个 PR）
- ✅ AI 友好（Cursor 可以看到完整上下文）
- ✅ 简化 CI/CD（一次构建，部署所有服务）

**工具选择**：
- 使用简单的目录结构（不需要 Turborepo/Nx 的复杂性）
- 使用脚本管理（`scripts/dev_all.sh`）

### 2. 类型同步策略

#### Backend → Web

```yaml
# tygo.yaml
packages:
  - path: "backend/domains/chat/http/dto"
    output_path: "web/src/types/domains/chat.ts"
```

#### Web → Mobile（符号链接）

```bash
# mobile/src/types/domains -> web/src/types/domains
cd mobile/src/types
ln -s ../../../web/src/types/domains ./domains
```

或者使用 npm workspace（如果使用 pnpm/yarn workspace）。

**优势**：
- ✅ Single Source of Truth：Go Code
- ✅ 零维护成本：修改后端，前端和移动端自动获得类型
- ✅ 编译期检查：TypeScript 发现类型不匹配

### 3. 前端架构：Feature-First（功能优先）

**传统方式**（技术分层）：
```
src/
  components/
  hooks/
  stores/
  pages/
```

**Vibe Coding 方式**（功能优先）：
```
src/
  features/
    chat/
      components/
      hooks/
      stores/
      api/
```

**为什么？**
- ✅ AI 更容易理解（"chat 功能的所有代码都在这里"）
- ✅ 高内聚（相关代码在一起）
- ✅ 易于删除（删除整个功能目录即可）
- ✅ 对齐后端领域（chat 领域 → chat 功能）

### 4. Web vs Mobile 代码共享

#### 可共享的：
- ✅ 类型定义（`types/`）
- ✅ API 调用逻辑（`api/`）
- ✅ Store 逻辑（`stores/`）
- ✅ Hooks 逻辑（`hooks/`，大部分）
- ✅ 工具函数（`utils/`）

#### 不共享的：
- ❌ UI 组件（Web 用 shadcn/ui，RN 用原生组件）
- ❌ 路由/导航（React Router vs React Navigation）
- ❌ 样式（CSS/Tailwind vs StyleSheet）

#### 共享方式：

**方式 1：符号链接**（简单，推荐）
```bash
cd mobile/src
ln -s ../../web/src/types ./types
ln -s ../../web/src/shared/utils ./shared/utils
```

**方式 2：npm workspace**（适合大型项目）
```json
// package.json (根目录)
{
  "workspaces": [
    "web",
    "mobile",
    "shared/*"
  ]
}

// shared/types/package.json
{
  "name": "@go-genai-stack/types",
  "version": "1.0.0"
}

// web/package.json
{
  "dependencies": {
    "@go-genai-stack/types": "*"
  }
}
```

**方式 3：独立 shared 包**（最灵活）
```
shared/
  types/
    package.json
    tsconfig.json
    index.ts
  api/
    package.json
  utils/
    package.json
```

### 5. 开发工作流

#### 启动所有服务

```bash
# scripts/dev_all.sh

#!/bin/bash

# 启动后端
cd backend && go run cmd/server/main.go &

# 启动 Web
cd web && npm run dev &

# 启动 Mobile（模拟器）
cd mobile && npm run ios &  # 或 npm run android

wait
```

#### 类型同步

```bash
# scripts/sync_types.sh

#!/bin/bash
echo "🔄 Syncing types..."

# 生成 TypeScript 类型
tygo generate

# 如果使用符号链接，无需额外操作
# 如果使用独立包，需要构建
# cd shared/types && npm run build

echo "✅ Types synced!"
```

#### 测试所有项目

```bash
# scripts/test_all.sh

#!/bin/bash

echo "Testing backend..."
cd backend && go test ./...

echo "Testing web..."
cd web && npm run test

echo "Testing mobile..."
cd mobile && npm run test

echo "✅ All tests passed!"
```

## AI 协作工作流

### 添加新功能（跨端）

**用户对 Cursor 说**：
```
添加"语音输入"功能：
1. 后端添加语音转文字接口（domains/chat）
2. Web 添加录音按钮和波形显示
3. Mobile 添加语音输入界面

保持 API 一致，类型自动同步。
```

**Cursor 的操作**：

1. **后端**：
   - 修改 `backend/domains/chat/usecases.yaml` 添加 `TranscribeVoice` 用例
   - 生成 `backend/domains/chat/handlers/transcribe_voice.handler.go`
   - 创建 `backend/domains/chat/http/dto/transcribe_voice.go`

2. **自动类型同步**：
   - 运行 `tygo generate`
   - 生成 `web/src/types/domains/chat.ts`（新增 `TranscribeVoiceRequest`）
   - `mobile/src/types/domains/chat.ts` 自动同步（符号链接）

3. **Web**：
   - 创建 `web/src/features/chat/components/VoiceRecorder.tsx`
   - 创建 `web/src/features/chat/hooks/useVoiceInput.ts`
   - 更新 `web/src/features/chat/api/chatApi.ts` 添加 `transcribeVoice()` 方法
   - **类型自动提示**：`TranscribeVoiceRequest` 已存在

4. **Mobile**：
   - 创建 `mobile/src/features/chat/components/VoiceRecorder.tsx`（RN 版本）
   - 复用 `mobile/src/features/chat/hooks/useVoiceInput.ts`（与 Web 共享逻辑）
   - 复用 `mobile/src/features/chat/api/chatApi.ts`（与 Web 共享 API 调用）
   - **类型自动提示**：与 Web 相同

### 修改接口

**用户对 Cursor 说**：
```
给 SendMessageRequest 添加 voice_mode 字段（布尔类型，可选）
```

**Cursor 的操作**：

1. **修改后端**：
   ```go
   // backend/domains/chat/http/dto/send_message.go
   type SendMessageRequest struct {
       // ... 现有字段
       VoiceMode *bool `json:"voice_mode,omitempty"` // 新增
   }
   ```

2. **同步类型**：
   ```bash
   ./scripts/sync_types.sh
   ```

3. **前端自动获得类型**：
   ```typescript
   // web/src/types/domains/chat.ts（自动生成）
   export interface SendMessageRequest {
       // ... 现有字段
       voice_mode?: boolean;  // 新增
   }
   ```

4. **Mobile 自动同步**（符号链接）

5. **编译器提示**：
   - Web 和 Mobile 的 TypeScript 编译器都知道这个新字段
   - 可以安全使用

## Vibe Coding 亮点

### 1. 清晰的上下文边界

**AI 能轻松理解**：
- Backend：`domains/chat/` → 聊天领域的所有逻辑
- Web：`features/chat/` → 聊天功能的所有 UI
- Mobile：`features/chat/` → 移动端聊天功能

**跨端映射清晰**：
```
backend/domains/chat
    ↓ (API)
web/features/chat
    ↓ (共享逻辑)
mobile/features/chat
```

### 2. 类型安全的数据流

```
Go Struct (backend/domains/chat/http/dto/send_message.go)
    ↓ tygo
TypeScript Interface (web/src/types/domains/chat.ts)
    ↓ 符号链接/workspace
TypeScript Interface (mobile/src/types/domains/chat.ts)
    ↓ 使用
Web Component & Mobile Component
```

**编译期检查**：
- 后端改了字段 → 前端编译失败 → AI 知道需要修改

### 3. 一句话操作

| 用户输入 | AI 行为 |
|---------|--------|
| "添加消息编辑功能" | 修改后端、Web、Mobile 三端代码 |
| "sync types" | 同步所有类型定义 |
| "启动所有服务" | 运行 `./scripts/dev_all.sh` |
| "测试所有项目" | 运行 `./scripts/test_all.sh` |

### 4. 功能的完整性

每个功能目录是自包含的：
```
features/chat/
  components/     # UI
  hooks/          # 逻辑
  stores/         # 状态
  api/            # 接口调用
  types.ts        # 功能特定类型
  README.md       # 功能说明
```

AI 看到这个结构，就知道：
- 要修改 UI → 改 `components/`
- 要修改逻辑 → 改 `hooks/` 或 `stores/`
- 要修改 API → 改 `api/` 和后端

### 5. 领域与功能对齐

| Backend Domain | Web Feature | Mobile Feature |
|----------------|-------------|----------------|
| `domains/chat/` | `features/chat/` | `features/chat/` |
| `domains/llm/` | `features/llm/` | `features/llm/` |
| `domains/monitoring/` | `features/monitoring/` | `features/monitoring/` |

**AI 能理解映射关系**，跨端修改时能保持一致性。

## 最佳实践

### 1. 命名一致性

```
Backend:  SendMessageRequest
Web:      sendMessage()
Mobile:   sendMessage()

Backend:  domains/chat
Web:      features/chat
Mobile:   features/chat
```

### 2. README 驱动

每个重要目录都有 README：
```
backend/domains/chat/README.md        # 领域说明
web/src/features/chat/README.md      # Web 功能说明
mobile/src/features/chat/README.md   # Mobile 功能说明
```

### 3. 使用 workspace scripts

```json
// package.json (根目录)
{
  "scripts": {
    "dev": "./scripts/dev_all.sh",
    "sync": "./scripts/sync_types.sh",
    "test": "./scripts/test_all.sh",
    "build": "npm run build:backend && npm run build:web && npm run build:mobile",
    "build:backend": "cd backend && go build -o bin/server cmd/server/main.go",
    "build:web": "cd web && npm run build",
    "build:mobile": "cd mobile && npm run build"
  }
}
```

### 4. Git 工作流

```bash
# 一次提交包含三端变更
git add backend/ web/ mobile/
git commit -m "feat(chat): add voice input across all platforms"
```

## 与现有项目的迁移

### 从当前结构迁移

```bash
# 1. 创建新的目录结构
mkdir -p web mobile shared scripts

# 2. 移动现有代码
# backend/ 保持不变
# frontend/ → web/

# 3. 更新 tygo.yaml
# 输出路径改为 web/src/types/

# 4. 创建 mobile 项目
cd mobile
npx react-native init GoGenAIStack

# 5. 设置类型共享
cd mobile/src
ln -s ../../web/src/types ./types

# 6. 更新脚本
# 修改 scripts/sync_types.sh 以支持新路径
```

## 总结

**这个架构是 Vibe Coding 最优的原因**：

1. **清晰的结构**：Backend、Web、Mobile 各司其职，但共享类型和逻辑
2. **类型安全**：Go → TypeScript 全链路类型检查
3. **AI 友好**：功能优先 + 领域对齐 = AI 易于理解
4. **零摩擦**：一键同步类型，一句话跨端修改
5. **可扩展**：添加新功能或新端（如小程序）非常简单

**核心价值**：让 AI 像理解单体项目一样理解全栈 + 移动端项目。

