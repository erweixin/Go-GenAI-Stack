# Task Feature

## 功能概述
任务管理功能，对齐后端 `backend/domains/task` 领域。

提供任务的创建、查询、更新、完成和删除功能。

## 后端对齐
- **Backend Domain**: `backend/domains/task`
- **API Prefix**: `/api/tasks`

## 用例（Use Cases）
详见 [usecases.md](./usecases.md)

- CreateTask: 创建任务
- ListTasks: 列出任务
- GetTask: 获取任务详情
- UpdateTask: 更新任务
- CompleteTask: 完成任务
- DeleteTask: 删除任务

## 目录结构

```
task/
├── README.md              # 本文件
├── usecases.md            # 用例详细说明
├── api/                   # API 封装
│   └── task.api.ts
├── components/            # 可复用组件
│   ├── TaskList.tsx       # 任务列表
│   ├── TaskItem.tsx       # 任务项
│   ├── TaskCreateDialog.tsx
│   ├── TaskEditDialog.tsx
│   └── TaskFilters.tsx    # 筛选器
├── hooks/                 # 自定义 Hooks
│   ├── useTasks.ts        # 列表
│   ├── useTaskCreate.ts   # 创建
│   ├── useTaskUpdate.ts   # 更新
│   ├── useTaskComplete.ts # 完成
│   └── useTaskDelete.ts   # 删除
└── stores/                # 状态管理
    └── task.store.ts      # Zustand Store
```

## 组件说明

### TaskList
任务列表组件，展示任务列表，支持筛选、排序。

**Props**:
- `tasks`: 任务数组
- `loading`: 加载状态
- `onTaskClick`: 任务点击回调

### TaskItem
单个任务项组件，展示任务信息，提供操作按钮。

**Props**:
- `task`: 任务对象
- `onEdit`: 编辑回调
- `onDelete`: 删除回调
- `onComplete`: 完成回调

### TaskCreateDialog
创建任务对话框。

### TaskEditDialog
编辑任务对话框。

### TaskFilters
任务筛选器，支持按状态、优先级、标签筛选。

## Hooks 说明

### React Query Hooks ⭐

我们推荐使用 React Query hooks 进行数据管理，它提供：
- ✅ 自动缓存和刷新
- ✅ 乐观更新
- ✅ 后台自动重新获取
- ✅ Loading 和 Error 状态自动处理
- ✅ 更好的开发者体验（React Query Devtools）

#### useTasksQuery(filters?)
获取任务列表（React Query 版本）。

**参数**:
- `filters`: 筛选条件（可选）

**返回值**:
```typescript
{
  data: TaskItem[]          // 任务列表
  isLoading: boolean        // 加载状态
  isError: boolean          // 错误状态
  error: Error | null       // 错误对象
  refetch: () => void       // 手动刷新
  // ... 更多 React Query 状态
}
```

**示例**:
```typescript
const { data: tasks, isLoading } = useTasksQuery({ status: 'pending' })
```

#### useTaskQuery(taskId, enabled?)
获取单个任务详情（React Query 版本）。

**参数**:
- `taskId`: 任务 ID
- `enabled`: 是否启用查询（可选，默认 true）

**返回值**:
```typescript
{
  data: TaskItem           // 任务对象
  isLoading: boolean
  isError: boolean
  error: Error | null
}
```

#### useTaskCreateMutation()
创建任务 Hook（React Query 版本）。

**返回值**:
```typescript
{
  mutate: (data: CreateTaskRequest) => void
  mutateAsync: (data: CreateTaskRequest) => Promise<...>
  isPending: boolean       // 加载状态
  isError: boolean
  error: Error | null
}
```

**示例**:
```typescript
const { mutate: createTask, isPending } = useTaskCreateMutation()

const handleCreate = () => {
  createTask({
    title: 'New Task',
    description: 'Description'
  })
}
```

#### useTaskUpdateMutation()
更新任务 Hook（React Query 版本）。

**示例**:
```typescript
const { mutate: updateTask } = useTaskUpdateMutation()

updateTask({
  taskId: 'task-123',
  data: { title: 'Updated Title' }
})
```

#### useTaskCompleteMutation()
完成任务 Hook（React Query 版本）。

**特性**:
- ✅ 支持乐观更新（立即更新 UI）
- ✅ 失败时自动回滚

**示例**:
```typescript
const { mutate: completeTask } = useTaskCompleteMutation()

completeTask('task-123')
```

#### useTaskDeleteMutation()
删除任务 Hook（React Query 版本）。

**示例**:
```typescript
const { mutate: deleteTask } = useTaskDeleteMutation()

deleteTask('task-123')
```

## Store 说明

### task.store.ts（仅 UI 状态）

任务 UI 状态管理，使用 Zustand。

**注意**：服务器数据（任务列表）已由 React Query 管理，此 Store 仅管理 UI 状态。

**状态**:
- `selectedTask`: 当前选中的任务（用于详情页、编辑对话框等）
- `filters`: 筛选条件（传递给 React Query）

**Actions**:
- `setSelectedTask`: 设置选中的任务
- `setFilters`: 设置筛选条件
- `reset`: 重置 UI 状态

## 使用示例

### 推荐：使用 React Query Hooks ⭐

```typescript
import { useState } from 'react'
import {
  useTasksQuery,
  useTaskCreateMutation,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from '@/features/task/hooks'
import { TaskList } from '@/features/task/components/TaskList'
import { Button } from '@/components/ui/button'

function TasksPage() {
  const [filters, setFilters] = useState({ status: 'pending' })

  // ✅ 使用 React Query 获取数据
  const { data: tasks = [], isLoading, refetch } = useTasksQuery(filters)

  // ✅ 使用 Mutations
  const createMutation = useTaskCreateMutation()
  const completeMutation = useTaskCompleteMutation()
  const deleteMutation = useTaskDeleteMutation()

  const handleCreate = () => {
    createMutation.mutate({
      title: 'New Task',
      description: 'Description'
    })
  }

  const handleComplete = (taskId: string) => {
    completeMutation.mutate(taskId)
  }

  const handleDelete = (taskId: string) => {
    deleteMutation.mutate(taskId)
  }

  return (
    <div>
      <Button onClick={handleCreate}>
        新建任务
      </Button>

      <TaskList
        tasks={tasks}
        loading={isLoading}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />
    </div>
  )
}
```

### 旧版示例（仍然可用）

```typescript
// 在页面中使用
import { useTasks } from '@/features/task/hooks/useTasks'
import { TaskList } from '@/features/task/components/TaskList'

function TasksPage() {
  const { tasks, loading } = useTasks()
  
  return <TaskList tasks={tasks} loading={loading} />
}
```

## React Query 配置

### Query Keys

所有 Query Keys 统一在 `hooks/useTasks.query.ts` 中定义：

```typescript
export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters) => [...taskKeys.lists(), filters],
  details: () => [...taskKeys.all, 'detail'],
  detail: (id) => [...taskKeys.details(), id],
}
```

### 缓存策略

- **staleTime**: 5 分钟 - 数据在 5 分钟内被认为是新鲜的
- **gcTime**: 30 分钟 - 未使用的缓存数据 30 分钟后被清理
- **refetchOnWindowFocus**: true - 窗口聚焦时自动刷新
- **refetchOnReconnect**: true - 网络重连时自动刷新

### 乐观更新

`useTaskCompleteMutation` 支持乐观更新：

1. 立即更新 UI（用户体验更好）
2. 发送请求到服务器
3. 如果失败，自动回滚到之前的状态

### React Query Devtools

开发环境下可以使用 React Query Devtools 查看：
- 所有 Query 的状态
- 缓存数据
- 请求时间线

在浏览器中按下浮动按钮即可打开。

## 最佳实践

### 1. 数据管理

✅ **推荐**: 使用 React Query hooks 进行数据管理
- 自动缓存
- 自动刷新
- Loading/Error 状态自动处理
- 更少的样板代码

❌ **避免**: 手动管理 loading/error 状态，手动刷新数据

### 2. Mutation 后刷新

Mutations 执行成功后会自动使相关查询失效：

```typescript
const createMutation = useTaskCreateMutation()

// 成功后自动刷新任务列表
createMutation.mutate(data)
```

### 3. 条件查询

使用 `enabled` 选项控制查询时机：

```typescript
const { data: task } = useTaskQuery(taskId, enabled: !!taskId)
```

### 4. 手动刷新

需要时可以手动刷新：

```typescript
const { refetch } = useTasksQuery()

<Button onClick={refetch}>刷新</Button>
```

## 迁移指南

### 从旧版 Hooks 迁移到 React Query

**旧版代码**:
```typescript
const { tasks, loading, error } = useTasks()
```

**新版代码**:
```typescript
const { data: tasks = [], isLoading, isError } = useTasksQuery()
```

**主要变化**:
- `loading` → `isLoading`
- `error` → `isError` / `error`
- 返回的 `data` 已经是任务数组（已通过 `select` 处理）

## 注意事项

- 所有 API 调用通过 `api/task.api.ts` 进行
- 推荐使用 React Query hooks 进行数据管理
- 组件尽量保持无状态，状态通过 props 传入
- 业务逻辑封装在 hooks 中
- Mutation 会自动处理 toast 提示

