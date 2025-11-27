# Go-GenAI-Stack Frontend (Web)

**技术栈**: React + TypeScript + Vite + TailwindCSS + Zustand

**架构模式**: Feature-First + Domain-Driven Design (Vibe-Coding-Friendly)

**测试框架**: Vitest + React Testing Library

---

## 📐 代码组织方式

### 核心思想：分层架构（Two-Layer Architecture）

```
┌─────────────────────────────────────────────────────────┐
│  Pages 层（页面组合层）                                    │
│  职责：组合 features 的组件，实现页面布局和路由            │
│  对齐：前端路由                                           │
└────────────────────┬───────────────────────────────────┘
                     │ 使用
┌────────────────────▼────────────────────────────────────┐
│  Features 层（业务功能层）                                │
│  职责：实现业务逻辑，提供可复用的组件和 Hooks             │
│  对齐：后端 backend/domains                              │
└────────────────────┬────────────────────────────────────┘
                     │ 调用
┌────────────────────▼────────────────────────────────────┐
│  Backend API                                            │
│  /api/tasks, /api/auth, /api/users                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ 目录结构

```
src/
├── features/                          ← 业务功能层（对齐后端领域）
│   ├── task/                          ← 对齐 backend/domains/task
│   │   ├── README.md                  ← 功能说明
│   │   ├── usecases.md                ← 用例列表
│   │   ├── api/                       ← API 封装
│   │   │   └── task.api.ts
│   │   ├── components/                ← 可复用组件
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskCreateDialog.tsx
│   │   │   ├── TaskEditDialog.tsx
│   │   │   └── TaskFilters.tsx
│   │   ├── hooks/                     ← 自定义 Hooks
│   │   │   ├── useTasks.ts
│   │   │   ├── useTaskCreate.ts
│   │   │   ├── useTaskUpdate.ts
│   │   │   ├── useTaskComplete.ts
│   │   │   └── useTaskDelete.ts
│   │   └── stores/                    ← 状态管理
│   │       └── task.store.ts
│   │
│   ├── auth/                          ← 对齐 backend/domains/auth
│   │   ├── README.md
│   │   ├── usecases.md
│   │   ├── api/auth.api.ts
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   └── useRegister.ts
│   │   └── stores/auth.store.ts
│   │
│   └── user/                          ← 对齐 backend/domains/user
│       ├── README.md
│       ├── usecases.md
│       ├── api/user.api.ts
│       ├── components/
│       │   ├── UserProfile.tsx
│       │   └── UserSettings.tsx
│       ├── hooks/
│       │   └── useUserProfile.ts
│       ├── stores/user.store.ts
│       └── __tests__/                 ← 测试目录
│           ├── api/user.api.test.ts
│           ├── hooks/useUserProfile.test.ts
│           └── stores/user.store.test.ts
│
├── pages/                             ← 页面组合层（对齐路由）
│   ├── TasksPage/                     ← 单一领域页面
│   │   ├── TasksPage.tsx              ← 组合 features/task 的组件
│   │   └── TasksPage.test.tsx
│   │
│   ├── DashboardPage/                 ← 跨领域页面
│   │   ├── DashboardPage.tsx          ← 组合多个 feature
│   │   ├── components/                ← 页面专属组件
│   │   │   ├── TaskSummaryCard.tsx
│   │   │   └── WelcomeSection.tsx
│   │   └── DashboardPage.test.tsx
│   │
│   ├── LoginPage/
│   │   ├── LoginPage.tsx
│   │   └── LoginPage.test.tsx
│   │
│   ├── RegisterPage/
│   │   ├── RegisterPage.tsx
│   │   └── RegisterPage.test.tsx
│   │
│   ├── ProfilePage/
│   │   ├── ProfilePage.tsx
│   │   └── ProfilePage.test.tsx
│   │
│   └── HomePage/
│       ├── HomePage.tsx
│       ├── components/
│       └── HomePage.test.tsx
│
├── components/                        ← 全局共享组件
│   └── ui/                            ← shadcn/ui 组件库
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
│
├── lib/                               ← 工具库
│   ├── api-client.ts                  ← API 客户端
│   └── utils.ts                       ← 工具函数
│
├── App.tsx                            ← 应用入口
└── main.tsx                           ← 渲染入口
```

---

## 🎯 前后端对齐关系

```
Backend Domains          Frontend Features        Frontend Pages
-----------------       ------------------       ----------------
domains/task/     ←→    features/task/     ←─    TasksPage
                                           └─    DashboardPage (部分)

domains/auth/     ←→    features/auth/     ←─    LoginPage
                                           └─    RegisterPage

domains/user/     ←→    features/user/     ←─    ProfilePage
                                          └─    DashboardPage (部分)
```

**对齐规则**：
1. **Backend Domain** ↔ **Frontend Feature** = 1:1 对应
2. **Frontend Page** 可以使用 1 个或多个 **Frontend Feature**
3. **Feature** 提供可复用的组件和逻辑
4. **Page** 只负责组合和布局（薄层，< 100 行）

---

## 📦 Feature 层详解

### Feature 的职责

**✅ Feature 应该包含**：
- **API 层** (`api/`): 封装后端 API 调用
- **组件层** (`components/`): 可复用的 UI 组件
- **Hooks 层** (`hooks/`): 业务逻辑封装
- **Store 层** (`stores/`): 状态管理（Zustand）
- **文档** (`README.md`, `usecases.md`): 功能说明和用例

**❌ Feature 不应该包含**：
- 页面路由配置
- 页面专属的布局组件
- 跨 feature 的组合逻辑

### Feature 的目录结构（标准模板）

```
features/{domain}/
├── README.md              # 功能概述、使用说明
├── usecases.md            # 用例列表（对齐后端 usecases.yaml）
├── api/                   # API 封装层
│   └── {domain}.api.ts    # API 调用（对齐后端 API）
├── components/            # UI 组件层（可复用）
│   ├── {Domain}List.tsx
│   ├── {Domain}Item.tsx
│   └── {Domain}Dialog.tsx
├── hooks/                 # 业务逻辑层
│   ├── use{Domain}s.ts    # 列表 Hook
│   ├── use{Domain}Create.ts
│   └── use{Domain}Update.ts
└── stores/                # 状态管理层
    └── {domain}.store.ts  # Zustand Store
```

### Feature 使用示例

#### 1. API 层（api/task.api.ts）

```typescript
import { api } from '@/lib/api-client'
import type { CreateTaskRequest, CreateTaskResponse } from '@go-genai-stack/types'

/**
 * Task API
 * 对齐后端 backend/domains/task
 */
export const taskApi = {
  create: (data: CreateTaskRequest) => 
    api.post<CreateTaskResponse>('/api/tasks', data),
    
  list: (params?) => 
    api.get('/api/tasks', { params }),
  
  // ...其他方法
}
```

#### 2. Store 层（stores/task.store.ts）

```typescript
import { create } from 'zustand'

interface TaskState {
  tasks: TaskItem[]
  loading: boolean
  setTasks: (tasks: TaskItem[]) => void
  // ...其他状态和方法
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  setTasks: (tasks) => set({ tasks }),
}))
```

#### 3. Hooks 层（hooks/useTasks.ts）

```typescript
import { useEffect } from 'react'
import { useTaskStore } from '../stores/task.store'
import { taskApi } from '../api/task.api'

/**
 * 任务列表 Hook
 * 用例：ListTasks
 */
export function useTasks() {
  const { tasks, setTasks, setLoading } = useTaskStore()

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true)
      const response = await taskApi.list()
      setTasks(response.tasks)
      setLoading(false)
    }
    loadTasks()
  }, [])

  return { tasks }
}
```

#### 4. 组件层（components/TaskList.tsx）

```typescript
import type { TaskItem } from '@go-genai-stack/types'

interface TaskListProps {
  tasks: TaskItem[]
  loading?: boolean
  onTaskClick?: (task: TaskItem) => void
}

/**
 * 任务列表组件
 * 可在多个页面复用
 */
export function TaskList({ tasks, loading, onTaskClick }: TaskListProps) {
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      {tasks.map(task => (
        <div key={task.task_id} onClick={() => onTaskClick?.(task)}>
          {task.title}
        </div>
      ))}
    </div>
  )
}
```

---

## 📄 Page 层详解

### Page 的职责

**✅ Page 应该包含**：
- 页面组件（组合 feature 的组件）
- 页面专属的组件（如 WelcomeSection）
- 页面布局和样式
- 路由参数处理

**❌ Page 不应该包含**：
- 业务逻辑（应该在 feature/hooks 中）
- API 调用（应该在 feature/api 中）
- 状态管理（应该在 feature/stores 中）

### Page 目录结构

```
pages/{PageName}/
├── {PageName}.tsx         # 页面组件（主文件）
├── components/            # 页面专属组件（可选）
│   └── Section.tsx
└── {PageName}.test.tsx    # 页面测试
```

### Page 使用示例

#### 示例 1：单一领域页面（TasksPage）

```typescript
// pages/TasksPage/TasksPage.tsx
import { useTasks } from '@/features/task/hooks/useTasks'
import { TaskList } from '@/features/task/components/TaskList'
import { TaskFilters } from '@/features/task/components/TaskFilters'

/**
 * 任务管理页面
 * 
 * 职责：
 * - 组合 features/task 的组件
 * - 页面布局
 * 
 * 对应后端领域：task
 */
export default function TasksPage() {
  const { tasks, loading } = useTasks()
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">任务管理</h1>
      <TaskFilters />
      <TaskList tasks={tasks} loading={loading} />
    </div>
  )
}
```

**特点**：
- ✅ 代码简洁（< 50 行）
- ✅ 只使用一个 feature (task)
- ✅ 无业务逻辑（在 hooks 中）

#### 示例 2：跨领域页面（DashboardPage）

```typescript
// pages/DashboardPage/DashboardPage.tsx
import { useUserProfile } from '@/features/user/hooks/useUserProfile'
import { UserAvatar } from '@/features/user/components/UserAvatar'
import { useTaskStats } from '@/features/task/hooks/useTaskStats'
import { TaskStats } from '@/features/task/components/TaskStats'
import { WelcomeSection } from './components/WelcomeSection'

/**
 * 仪表盘页面（跨领域）
 * 
 * 职责：
 * - 组合多个 feature 的组件
 * - 展示概览信息
 * 
 * 使用的 features：
 * - user: 用户信息
 * - task: 任务统计
 */
export default function DashboardPage() {
  const { user } = useUserProfile()
  const { stats } = useTaskStats()
  
  return (
    <div className="container mx-auto py-6">
      <WelcomeSection user={user} />
      <div className="grid grid-cols-2 gap-4">
        <UserAvatar user={user} />
        <TaskStats stats={stats} />
      </div>
    </div>
  )
}
```

**特点**：
- ✅ 代码简洁（< 80 行）
- ✅ 使用多个 features (user + task)
- ✅ 页面专属组件放在 components/ 子目录

---

## 🔄 数据流向

```
用户操作
   ↓
Page 组件（组合层）
   ↓
Feature Hook（业务逻辑）
   ↓
Feature Store（状态管理）
   ↓
Feature API（API 调用）
   ↓
Backend API
   ↓
Feature Store（更新状态）
   ↓
Page 组件（重新渲染）
```

**示例流程**（创建任务）：

1. 用户在 `TasksPage` 点击"新建任务"按钮
2. `TaskCreateDialog` 组件显示表单
3. 用户提交表单，调用 `useTaskCreate` Hook
4. Hook 调用 `taskApi.create(data)`
5. API 发送请求到后端 `POST /api/tasks`
6. 后端返回新任务
7. Hook 调用 `taskStore.addTask(newTask)` 更新状态
8. Store 更新触发 `TaskList` 重新渲染
9. 新任务显示在列表中

---

## 🎨 组件复用规则

### 1. 页面专属组件

**使用场景**: 只在一个页面使用  
**存放位置**: `pages/{PageName}/components/`

```
pages/DashboardPage/
└── components/
    └── WelcomeSection.tsx  ← 只在 DashboardPage 使用
```

### 2. Feature 内组件

**使用场景**: 在同一 feature 的多个页面使用  
**存放位置**: `features/{domain}/components/`

```
features/task/
└── components/
    └── TaskList.tsx  ← 可在 TasksPage 和 DashboardPage 使用
```

### 3. 全局共享组件

**使用场景**: 多个 feature 使用  
**存放位置**: `components/`

```
components/
└── ui/
    └── Button.tsx  ← 所有页面和 feature 都可使用
```

---

## 📚 类型定义

### 使用 Monorepo 共享类型

所有类型定义来自 `@go-genai-stack/types` 包（frontend/shared/types）：

```typescript
import type {
  TaskItem,
  CreateTaskRequest,
  CreateTaskResponse,
} from '@go-genai-stack/types'
```

**优势**：
- ✅ 前端各应用（web, mobile）共享类型
- ✅ 类型与后端 API 保持同步
- ✅ 统一的类型定义，减少重复

---

## 🧪 测试策略

### 1. Feature 测试

```typescript
// features/task/hooks/useTasks.test.ts
import { renderHook } from '@testing-library/react'
import { useTasks } from './useTasks'

test('useTasks loads tasks', async () => {
  const { result } = renderHook(() => useTasks())
  
  await waitFor(() => {
    expect(result.current.tasks).toHaveLength(5)
  })
})
```

### 2. Page 测试

```typescript
// pages/TasksPage/TasksPage.test.tsx
import { render, screen } from '@testing-library/react'
import TasksPage from './TasksPage'

test('TasksPage renders', () => {
  render(<TasksPage />)
  expect(screen.getByText('任务管理')).toBeInTheDocument()
})
```

---

## 🚀 开发指南

### 添加新功能

**场景 1**: 添加新的用例（如 "任务归档"）

1. 在 `features/task/usecases.md` 添加用例说明
2. 在 `features/task/api/task.api.ts` 添加 API 方法
3. 在 `features/task/hooks/` 创建新 Hook (`useTaskArchive.ts`)
4. 在页面中使用新 Hook

**场景 2**: 添加新的领域（如 "通知"）

1. 创建 `features/notification/` 目录
2. 参考 `features/task/` 的结构创建文件
3. 创建 README.md 和 usecases.md
4. 实现 API、Hooks、Store、Components
5. 在需要的页面中使用

### 开发工作流

```bash
# 1. 启动开发服务器
pnpm dev

# 2. 编辑代码（VS Code + Vite HMR）

# 3. 测试功能

# 4. 运行测试
pnpm test

# 5. 构建生产版本
pnpm build
```

---

## 📖 最佳实践

### ✅ DO（推荐）

1. **Feature 自包含**: 每个 feature 包含完整的功能实现
2. **Page 保持薄**: 页面组件 < 100 行，只负责组合
3. **组件可复用**: 提取可复用的组件到 feature/components/
4. **状态集中管理**: 使用 Store 管理状态，避免 prop drilling
5. **类型安全**: 使用 TypeScript，导入共享类型
6. **文档同步**: 修改功能时更新 README.md 和 usecases.md

### ❌ DON'T（避免）

1. **不要在 Page 中写业务逻辑**: 应该在 Hook 中
2. **不要在 Page 中直接调用 API**: 应该通过 Hook
3. **不要跨 Feature 导入组件**: 应该提升到 components/
4. **不要在 Feature 中包含路由逻辑**: 应该在 App.tsx 中
5. **不要重复类型定义**: 使用 @go-genai-stack/types

---

## 🧪 测试规范

### 测试框架

```
✅ Vitest              # 测试运行器（Vite 原生支持）
✅ React Testing Library  # React 组件测试
✅ @testing-library/user-event  # 用户交互模拟
✅ @vitest/coverage-v8  # 代码覆盖率
```

### 测试组织方式

**采用 Feature 内部 `__tests__` 目录模式**：

```
src/features/task/
├── api/
│   └── task.api.ts
├── components/
│   ├── TaskList.tsx
│   └── TaskItem.tsx
├── hooks/
│   ├── useTasks.ts
│   └── useTaskCreate.ts
├── stores/
│   └── task.store.ts
└── __tests__/              # ⭐ 测试目录
    ├── api/
    │   └── task.api.test.ts
    ├── components/
    │   ├── TaskList.test.tsx
    │   └── TaskItem.test.tsx
    ├── hooks/
    │   ├── useTasks.test.ts
    │   └── useTaskCreate.test.ts
    └── stores/
        └── task.store.test.ts
```

**优点**：
- ✅ 测试与源码在同一 feature，易于查找和维护
- ✅ 目录结构清晰，镜像源码结构
- ✅ 删除 feature 时测试一起删除
- ✅ 符合领域驱动设计原则

### 测试优先级

| 优先级 | 测试内容 | 覆盖率目标 | 说明 |
|--------|---------|-----------|------|
| **P0** | Hooks + Stores + API | **90%+** | 业务逻辑核心，最重要 |
| P1 | Components | 70%+ | UI 组件交互 |
| P2 | Pages | 60%+ | 页面组合层 |

**整体覆盖率目标**: 70%+

### 测试命令

```bash
# 运行所有测试
pnpm test

# 监听模式（开发时）
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# UI 模式（可视化界面）
pnpm test:ui

# CI 模式
pnpm test:ci
```

### 测试示例

#### Hooks 测试

```typescript
// features/task/__tests__/hooks/useTasks.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useTasks } from '../../hooks/useTasks'
import { taskApi } from '../../api/task.api'

vi.mock('../../api/task.api')

describe('useTasks', () => {
  it('应该成功加载任务列表', async () => {
    // Arrange
    const mockTasks = [
      { task_id: '1', title: 'Test', status: 'pending', priority: 'high', tags: [], created_at: '2025-11-27' }
    ]
    vi.mocked(taskApi.list).mockResolvedValue({ tasks: mockTasks, total_count: 1 })

    // Act
    const { result } = renderHook(() => useTasks())

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks).toEqual(mockTasks)
  })
})
```

#### Store 测试

```typescript
// features/task/__tests__/stores/task.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../../stores/task.store'

describe('TaskStore', () => {
  beforeEach(() => {
    useTaskStore.getState().reset()
  })

  it('应该能够添加任务', () => {
    const store = useTaskStore.getState()
    const task = { task_id: '1', title: 'New Task', status: 'pending', ... }
    
    store.addTask(task)
    
    expect(store.tasks).toHaveLength(1)
    expect(store.tasks[0]).toEqual(task)
  })
})
```

#### Component 测试

```typescript
// features/task/__tests__/components/TaskItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskItemComponent } from '../../components/TaskItem'

describe('TaskItem', () => {
  it('应该正确渲染任务信息', () => {
    const mockTask = { task_id: '1', title: 'Test Task', ... }
    render(<TaskItemComponent task={mockTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('点击完成按钮应该触发回调', () => {
    const onComplete = vi.fn()
    render(<TaskItemComponent task={mockTask} onComplete={onComplete} />)
    
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))
    
    expect(onComplete).toHaveBeenCalledWith('1')
  })
})
```

### CI/CD 集成

测试在 GitHub Actions 中自动运行：

- ✅ Push 到 main/develop 时自动测试
- ✅ Pull Request 时自动测试
- ✅ 生成覆盖率报告
- ✅ PR 自动评论覆盖率变化

详细配置见：`.github/workflows/frontend-test.yml`

---

## 🔗 相关文档

- [后端架构](../../backend/README.md) - 后端领域划分
- [类型定义](../shared/types/README.md) - 共享类型说明
- [测试方案](../../docs/FRONTEND_TESTING_PLAN.md) - 详细测试方案

---

## 📝 变更日志

### 2025-11-27: Vibe-Coding-Friendly 重构

- ✅ 采用 Feature-First + 分层架构
- ✅ 前端完全对齐后端领域（task, auth, user）
- ✅ 创建 features/ 和 pages/ 分层
- ✅ 添加显式知识（README.md, usecases.md）
- ✅ 组件瘦化（TasksPage: 431 → <100 行）
- ✅ 统一状态管理（Zustand）
- ✅ 统一 API 封装
- ✅ 引入单元测试（Vitest + React Testing Library）
- ✅ 集成 CI/CD 测试流程

**架构评分提升**: ⭐⭐☆☆☆ (2/5) → ⭐⭐⭐⭐⭐ (5/5)

---

**维护者**: AI Assistant  
**最后更新**: 2025-11-27
