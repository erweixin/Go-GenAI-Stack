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

### useTasks()
获取任务列表，自动处理加载和错误状态。

**返回值**:
```typescript
{
  tasks: TaskItem[]
  loading: boolean
  error: string | null
  refresh: () => void
}
```

### useTaskCreate()
创建任务 Hook。

**返回值**:
```typescript
{
  createTask: (data: CreateTaskRequest) => Promise<TaskItem | null>
  loading: boolean
  error: string | null
}
```

## Store 说明

### task.store.ts
任务状态管理，使用 Zustand。

**状态**:
- `tasks`: 任务列表
- `selectedTask`: 当前选中的任务
- `loading`: 加载状态
- `error`: 错误信息
- `filters`: 筛选条件

**Actions**:
- `setTasks`: 设置任务列表
- `addTask`: 添加任务
- `updateTask`: 更新任务
- `deleteTask`: 删除任务
- `setFilters`: 设置筛选条件

## 使用示例

```typescript
// 在页面中使用
import { useTasks } from '@/features/task/hooks/useTasks'
import { TaskList } from '@/features/task/components/TaskList'

function TasksPage() {
  const { tasks, loading } = useTasks()
  
  return <TaskList tasks={tasks} loading={loading} />
}
```

## 注意事项

- 所有 API 调用通过 `api/task.api.ts` 进行
- 状态管理统一使用 `task.store.ts`
- 组件尽量保持无状态，状态通过 props 传入
- 业务逻辑封装在 hooks 中

