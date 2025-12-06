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
├── hooks/                 # React Query Hooks
│   ├── index.ts           # 统一导出
│   ├── useTasks.query.ts  # Query Hooks（查询）
│   └── useTasks.mutation.ts # Mutation Hooks（修改）
└── stores/                # 状态管理（仅 UI 状态）
    └── task.store.ts      # Zustand Store（筛选条件等）
```

## 组件说明

### TaskList

任务列表组件，展示任务列表，支持筛选、排序。

**Props**:
- `tasks`: 任务数组
- `loading`: 加载状态
- `onEdit`: 编辑回调
- `onDelete`: 删除回调
- `onComplete`: 完成回调

### TaskItem

单个任务项组件，展示任务信息，提供操作按钮。

**Props**:
- `task`: 任务对象
- `onEdit`: 编辑回调
- `onDelete`: 删除回调
- `onComplete`: 完成回调

### TaskCreateDialog

创建任务对话框，使用 React Hook Form + Zod 进行表单验证。

### TaskEditDialog

编辑任务对话框，支持更新任务信息。

### TaskFilters

任务筛选器，支持按状态、优先级、标签筛选。筛选条件存储在 `task.store.ts` 中。

## Hooks 说明

### ⭐ React Query Hooks（推荐使用）

本项目使用 **TanStack Query (React Query)** 进行服务器状态管理，提供：

- ✅ 自动缓存和刷新
- ✅ 乐观更新（Optimistic Updates）
- ✅ 后台自动重新获取
- ✅ Loading 和 Error 状态自动处理
- ✅ 请求去重和自动重试
- ✅ 更好的开发者体验（React Query Devtools）

所有 hooks 统一从 `@/features/task/hooks` 导入：

```typescript
import {
  // Query Hooks
  useTasksQuery,
  useTaskQuery,
  // Mutation Hooks
  useTaskCreateMutation,
  useTaskUpdateMutation,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from '@/features/task/hooks'
```

### Query Hooks（查询数据）

#### useTasksQuery(filters?)

获取任务列表。

**参数**:
- `filters`: 筛选条件（可选，类型：`ListTasksRequest`）

**返回值**:
```typescript
{
  data: TaskItem[]          // 任务列表（已通过 select 处理）
  isLoading: boolean        // 加载状态
  isError: boolean          // 错误状态
  error: Error | null       // 错误对象
  refetch: () => void       // 手动刷新
  // ... 更多 React Query 状态
}
```

**示例**:
```typescript
import { useTasksQuery } from '@/features/task/hooks'
import { useTaskStore } from '@/features/task/stores/task.store'

function TasksPage() {
  const { filters } = useTaskStore()
  const { data: tasks = [], isLoading } = useTasksQuery(filters)
  
  if (isLoading) return <div>加载中...</div>
  
  return <TaskList tasks={tasks} />
}
```

#### useTaskQuery(taskId, enabled?)

获取单个任务详情。

**参数**:
- `taskId`: 任务 ID
- `enabled`: 是否启用查询（可选，默认 `true`）

**返回值**:
```typescript
{
  data: GetTaskResponse     // 任务详情响应
  isLoading: boolean
  isError: boolean
  error: Error | null
}
```

**示例**:
```typescript
import { useTaskQuery } from '@/features/task/hooks'

function TaskDetailPage({ taskId }: { taskId: string }) {
  const { data: taskResponse, isLoading } = useTaskQuery(taskId)
  
  if (isLoading) return <div>加载中...</div>
  if (!taskResponse) return <div>任务不存在</div>
  
  return <div>{taskResponse.task.title}</div>
}
```

### Mutation Hooks（修改数据）

所有 Mutation Hooks 都自动处理：
- ✅ Toast 通知（成功/失败）
- ✅ 缓存失效（自动刷新相关查询）
- ✅ Loading 状态（`isPending`）

#### useTaskCreateMutation()

创建任务。

**返回值**:
```typescript
{
  mutate: (data: CreateTaskRequest) => void
  mutateAsync: (data: CreateTaskRequest) => Promise<CreateTaskResponse>
  isPending: boolean       // 加载状态
  isError: boolean
  error: Error | null
}
```

**示例**:
```typescript
import { useTaskCreateMutation } from '@/features/task/hooks'

function CreateTaskButton() {
  const { mutate: createTask, isPending } = useTaskCreateMutation()

  const handleCreate = () => {
    createTask({
      title: 'New Task',
      description: 'Task description',
      priority: 'high',
      tags: ['work'],
    })
  }

  return (
    <Button onClick={handleCreate} disabled={isPending}>
      {isPending ? '创建中...' : '创建任务'}
    </Button>
  )
}
```

**特性**:
- 成功后自动刷新任务列表
- 自动显示成功/失败 Toast 通知

#### useTaskUpdateMutation()

更新任务。

**参数格式**:
```typescript
{
  taskId: string
  data: UpdateTaskRequest
}
```

**示例**:
```typescript
import { useTaskUpdateMutation } from '@/features/task/hooks'

function EditTaskForm({ taskId }: { taskId: string }) {
  const { mutate: updateTask, isPending } = useTaskUpdateMutation()

  const handleSubmit = (data: UpdateTaskRequest) => {
    updateTask({
      taskId,
      data: {
        title: data.title,
        description: data.description,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
      <Button type="submit" disabled={isPending}>
        保存
      </Button>
    </form>
  )
}
```

**特性**:
- 成功后自动刷新任务列表和任务详情
- 自动显示成功/失败 Toast 通知

#### useTaskCompleteMutation()

完成任务，支持**乐观更新**。

**示例**:
```typescript
import { useTaskCompleteMutation } from '@/features/task/hooks'

function TaskItem({ task }: { task: TaskItem }) {
  const { mutate: completeTask, isPending } = useTaskCompleteMutation()

  const handleComplete = () => {
    completeTask(task.task_id)
  }

  return (
    <Button onClick={handleComplete} disabled={isPending || task.status === 'completed'}>
      {task.status === 'completed' ? '已完成' : '完成'}
    </Button>
  )
}
```

**特性**:
- ✅ **乐观更新**：立即更新 UI，无需等待服务器响应
- ✅ **自动回滚**：如果请求失败，自动恢复到之前的状态
- ✅ 成功后自动刷新任务列表
- ✅ 自动显示成功/失败 Toast 通知

#### useTaskDeleteMutation()

删除任务。

**示例**:
```typescript
import { useTaskDeleteMutation } from '@/features/task/hooks'
import { ConfirmDialog } from '@/components/ConfirmDialog'

function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { mutate: deleteTask, isPending } = useTaskDeleteMutation()

  const handleConfirm = () => {
    deleteTask(taskId)
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="destructive">
        删除
      </Button>
      
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleConfirm}
        title="确认删除"
        description="确定要删除这个任务吗？此操作无法撤销。"
        variant="destructive"
        loading={isPending}
      />
    </>
  )
}
```

**特性**:
- 成功后自动从缓存中移除任务
- 自动刷新任务列表
- 自动显示成功/失败 Toast 通知

## Store 说明

### task.store.ts（仅 UI 状态）

任务 UI 状态管理，使用 Zustand。

**重要**：服务器数据（任务列表）由 React Query 管理，此 Store **仅管理 UI 状态**。

**状态**:
- `filters`: 筛选条件（传递给 `useTasksQuery`）
  - `status`: 任务状态筛选
  - `priority`: 优先级筛选
  - `tags`: 标签筛选

**Actions**:
- `setFilters`: 设置筛选条件
- `resetFilters`: 重置筛选条件

**使用示例**:
```typescript
import { useTaskStore } from '@/features/task/stores/task.store'
import { useTasksQuery } from '@/features/task/hooks'

function TasksPage() {
  const { filters, setFilters } = useTaskStore()
  
  // 使用 Store 中的筛选条件
  const { data: tasks = [] } = useTasksQuery(filters)
  
  const handleFilterChange = (newFilters: ListTasksRequest) => {
    setFilters(newFilters)
    // React Query 会自动重新获取数据
  }
  
  return (
    <div>
      <TaskFilters onFilterChange={handleFilterChange} />
      <TaskList tasks={tasks} />
    </div>
  )
}
```

## 使用示例

### 完整示例：任务管理页面

```typescript
import { useState } from 'react'
import {
  useTasksQuery,
  useTaskCreateMutation,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from '@/features/task/hooks'
import { useTaskStore } from '@/features/task/stores/task.store'
import { TaskList } from '@/features/task/components/TaskList'
import { TaskCreateDialog } from '@/features/task/components/TaskCreateDialog'
import { TaskEditDialog } from '@/features/task/components/TaskEditDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'

function TasksPage() {
  const { filters } = useTaskStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ✅ 使用 React Query 获取数据
  const { data: tasks = [], isLoading } = useTasksQuery(filters)

  // ✅ 使用 Mutations
  const createMutation = useTaskCreateMutation()
  const completeMutation = useTaskCompleteMutation()
  const deleteMutation = useTaskDeleteMutation()

  const handleComplete = (taskId: string) => {
    completeMutation.mutate(taskId)
  }

  const handleDelete = (taskId: string) => {
    setDeleteConfirmId(taskId)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  return (
    <div>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        新建任务
      </Button>

      <TaskList
        tasks={tasks}
        loading={isLoading}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onEdit={setEditingTask}
      />

      {/* 创建对话框 */}
      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* 编辑对话框 */}
      {editingTask && (
        <TaskEditDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
        />
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="确认删除"
        description="确定要删除这个任务吗？此操作无法撤销。"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
```

## React Query 配置

### Query Keys

所有 Query Keys 统一在 `hooks/useTasks.query.ts` 中定义：

```typescript
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: ListTasksRequest) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}
```

**优势**:
- ✅ 类型安全
- ✅ 统一的缓存失效策略
- ✅ 易于维护

### 缓存策略

全局配置在 `src/lib/query-client.ts`：

- **staleTime**: 5 分钟 - 数据在 5 分钟内被认为是新鲜的
- **gcTime**: 30 分钟 - 未使用的缓存数据 30 分钟后被清理
- **refetchOnWindowFocus**: false - 窗口聚焦时不自动刷新（避免干扰）
- **refetchOnReconnect**: true - 网络重连时自动刷新
- **retry**: 最多 2 次，使用指数退避

### 乐观更新

`useTaskCompleteMutation` 实现了完整的乐观更新：

1. **onMutate**: 立即更新 UI，取消进行中的查询
2. **onSuccess**: 使相关查询失效，触发后台刷新
3. **onError**: 自动回滚到之前的状态
4. **onSettled**: 确保数据最终一致性

### 缓存失效策略

Mutations 执行成功后会自动使相关查询失效：

- **创建任务**: 使所有任务列表查询失效
- **更新任务**: 使任务列表和任务详情查询失效
- **完成任务**: 使任务列表和任务详情查询失效（乐观更新）
- **删除任务**: 移除任务详情缓存，使任务列表查询失效

### React Query Devtools

开发环境下可以使用 React Query Devtools 查看：

- 所有 Query 的状态（loading, success, error）
- 缓存数据
- 请求时间线
- Query Keys 结构

在浏览器中按下浮动按钮即可打开。

## 最佳实践

### 1. 数据管理

✅ **推荐**: 使用 React Query hooks 进行数据管理
- 自动缓存和刷新
- Loading/Error 状态自动处理
- 更少的样板代码
- 更好的用户体验

❌ **避免**: 
- 手动管理 loading/error 状态
- 手动刷新数据
- 使用 useState 存储服务器数据

### 2. UI 状态 vs 服务器状态

✅ **服务器状态** → React Query
- 任务列表、任务详情
- 所有从 API 获取的数据

✅ **UI 状态** → Zustand Store 或 useState
- 筛选条件（`task.store.ts`）
- 对话框打开/关闭状态
- 表单状态（使用 React Hook Form）

### 3. Mutation 后刷新

Mutations 执行成功后**自动**使相关查询失效，无需手动刷新：

```typescript
// ✅ 正确：自动刷新
const { mutate: createTask } = useTaskCreateMutation()
createTask(data) // 成功后自动刷新任务列表

// ❌ 错误：不需要手动刷新
const { mutate: createTask } = useTaskCreateMutation()
const { refetch } = useTasksQuery()
createTask(data, {
  onSuccess: () => refetch() // 不需要！
})
```

### 4. 条件查询

使用 `enabled` 选项控制查询时机：

```typescript
// 仅在 taskId 存在时查询
const { data: task } = useTaskQuery(taskId, enabled: !!taskId)
```

### 5. 错误处理

Mutations 自动处理错误并显示 Toast，但也可以自定义：

```typescript
const { mutate: createTask } = useTaskCreateMutation()

createTask(data, {
  onError: (error) => {
    // 自定义错误处理
    console.error('创建失败:', error)
    // Toast 已自动显示，无需手动调用
  },
})
```

### 6. 加载状态

使用 `isPending` 显示加载状态：

```typescript
const { mutate: createTask, isPending } = useTaskCreateMutation()

<Button onClick={handleCreate} disabled={isPending}>
  {isPending ? '创建中...' : '创建任务'}
</Button>
```

## 注意事项

- ✅ 所有 API 调用通过 `api/task.api.ts` 进行
- ✅ 推荐使用 React Query hooks 进行数据管理
- ✅ 组件尽量保持无状态，状态通过 props 传入
- ✅ 业务逻辑封装在 hooks 中
- ✅ Mutation 会自动处理 toast 提示和缓存失效
- ✅ Store 仅用于 UI 状态（如筛选条件），不存储服务器数据
- ✅ 使用 `taskKeys` 统一管理 Query Keys，确保缓存失效正确

## 相关文档

- [React Query 指南](../../../REACT_QUERY_GUIDE.md) - 详细的数据管理指南
- [组件库文档](../../components/README.md) - UI 组件使用说明
- [后端领域文档](../../../../backend/domains/task/README.md) - 后端 API 说明
