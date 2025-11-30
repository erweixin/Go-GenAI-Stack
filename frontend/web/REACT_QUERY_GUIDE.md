# TanStack Query (React Query) 使用指南

本文档说明如何在 Go-GenAI-Stack 前端项目中使用 TanStack Query (React Query) 进行数据管理。

## 📚 目录

- [为什么使用 React Query](#为什么使用-react-query)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [最佳实践](#最佳实践)
- [示例](#示例)
- [故障排查](#故障排查)

## 为什么使用 React Query

### ✅ 优势

1. **自动缓存管理**
   - 无需手动管理 loading/error 状态
   - 自动缓存数据，减少不必要的请求
   - 智能的后台刷新

2. **更好的用户体验**
   - 乐观更新（Optimistic Updates）
   - 自动重试
   - 窗口聚焦时自动刷新
   - 网络重连时自动刷新

3. **开发者体验**
   - 更少的样板代码
   - React Query Devtools
   - TypeScript 支持

4. **性能优化**
   - 请求去重
   - 并行查询
   - 分页和无限滚动支持

### 对比传统方式

**传统方式（手动管理）**:
```typescript
function TaskList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    taskApi.list()
      .then(data => setTasks(data.tasks))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [])

  // 需要手动刷新
  const refresh = () => {
    setLoading(true)
    taskApi.list()
      .then(data => setTasks(data.tasks))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }

  // ...
}
```

**React Query 方式**:
```typescript
function TaskList() {
  const { data: tasks = [], isLoading } = useTasksQuery()

  // 自动缓存、自动刷新、自动重试
  // 就这么简单！
}
```

## 快速开始

### 1. 项目配置

React Query 已在 `src/main.tsx` 中配置：

```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 2. 创建 API 函数

```typescript
// features/task/api/task.api.ts
export const taskApi = {
  list: async (params) => api.get('/api/tasks', { params }),
  get: async (id) => api.get(`/api/tasks/${id}`),
  create: async (data) => api.post('/api/tasks', data),
  // ...
}
```

### 3. 创建 Query Hooks

```typescript
// features/task/hooks/useTasks.query.ts
import { useQuery } from '@tanstack/react-query'
import { taskApi } from '../api/task.api'

export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters) => [...taskKeys.lists(), filters],
}

export function useTasksQuery(filters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskApi.list(filters),
    select: (data) => data.tasks,
  })
}
```

### 4. 创建 Mutation Hooks

```typescript
// features/task/hooks/useTasks.mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '../api/task.api'
import { taskKeys } from './useTasks.query'

export function useTaskCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => taskApi.create(data),
    onSuccess: () => {
      // 使任务列表失效，触发重新获取
      queryClient.invalidateQueries({
        queryKey: taskKeys.lists()
      })
      toast.success('创建成功')
    },
  })
}
```

### 5. 在组件中使用

```typescript
function TasksPage() {
  // ✅ 查询数据
  const { data: tasks = [], isLoading } = useTasksQuery()

  // ✅ 创建任务
  const createMutation = useTaskCreateMutation()

  const handleCreate = () => {
    createMutation.mutate({
      title: 'New Task'
    })
  }

  return (
    <div>
      <Button onClick={handleCreate}>
        创建任务
      </Button>

      {isLoading ? (
        <Spinner />
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  )
}
```

## 核心概念

### Query Keys

Query Keys 用于唯一标识查询，应该：

1. **层级化设计**
```typescript
export const taskKeys = {
  all: ['tasks'],                    // 所有任务相关
  lists: () => [...taskKeys.all, 'list'],  // 所有列表查询
  list: (filters) => [...taskKeys.lists(), filters], // 特定筛选的列表
  details: () => [...taskKeys.all, 'detail'],
  detail: (id) => [...taskKeys.details(), id],
}
```

2. **包含影响数据的参数**
```typescript
// ✅ Good - 筛选条件影响数据
['tasks', 'list', { status: 'pending' }]

// ❌ Bad - 缺少筛选条件
['tasks', 'list']
```

### 查询（Queries）

用于获取数据：

```typescript
const { data, isLoading, isError, error, refetch } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => taskApi.list(),
  staleTime: 5 * 60 * 1000,  // 5 分钟
  gcTime: 30 * 60 * 1000,    // 30 分钟
})
```

### 变更（Mutations）

用于修改数据：

```typescript
const mutation = useMutation({
  mutationFn: (data) => taskApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})

mutation.mutate({ title: 'New Task' })
```

### 缓存失效

使查询缓存失效，触发重新获取：

```typescript
// 失效所有任务查询
queryClient.invalidateQueries({ queryKey: ['tasks'] })

// 失效特定筛选的任务列表
queryClient.invalidateQueries({ queryKey: ['tasks', 'list', filters] })

// 移除缓存（删除场景）
queryClient.removeQueries({ queryKey: ['tasks', 'detail', taskId] })
```

## 最佳实践

### 1. 统一 Query Keys 管理

```typescript
// ✅ Good - 集中管理
export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters) => [...taskKeys.lists(), filters],
}

// ❌ Bad - 分散定义
useQuery({ queryKey: ['tasks', 'list'] })
useQuery({ queryKey: ['tasks', 'lists'] })  // 拼写错误！
```

### 2. 使用 select 转换数据

```typescript
// ✅ Good - 只返回需要的数据
useQuery({
  queryKey: ['tasks'],
  queryFn: () => taskApi.list(),
  select: (data) => data.tasks,  // 只返回 tasks 数组
})

// ❌ Bad - 返回完整响应
useQuery({
  queryKey: ['tasks'],
  queryFn: () => taskApi.list(),
})
// 然后在组件中: const tasks = data?.tasks || []
```

### 3. 错误处理

```typescript
// ✅ Good - 统一处理 + 局部处理
useMutation({
  mutationFn: taskApi.create,
  onError: (error) => {
    // 全局错误处理（已在 queryClient 配置）
    toast.error(error.message)
  }
})
```

### 4. 乐观更新

```typescript
useMutation({
  mutationFn: taskApi.complete,
  // 乐观更新
  onMutate: async (taskId) => {
    await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })
    
    const previous = queryClient.getQueryData(taskKeys.detail(taskId))
    
    queryClient.setQueryData(taskKeys.detail(taskId), (old) => ({
      ...old,
      status: 'completed'
    }))
    
    return { previous }
  },
  // 失败回滚
  onError: (err, taskId, context) => {
    queryClient.setQueryData(taskKeys.detail(taskId), context.previous)
  },
  // 总是重新获取
  onSettled: (data, error, taskId) => {
    queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
  }
})
```

### 5. 条件查询

```typescript
// ✅ Good - 使用 enabled
const { data } = useTaskQuery(taskId, {
  enabled: !!taskId  // 仅在有 taskId 时查询
})

// ❌ Bad - 无条件查询可能导致错误
const { data } = useTaskQuery(taskId)  // taskId 可能为 undefined
```

## 示例

### 完整的 CRUD 示例

见 `src/features/task/` 目录：

- **查询**: `hooks/useTasks.query.ts`
- **变更**: `hooks/useTasks.mutation.ts`
- **页面示例**: `pages/TasksPageWithQuery.tsx`

### 分页示例

```typescript
export function useTasksInfiniteQuery(filters) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ pageParam = 1 }) => 
      taskApi.list({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}
```

### 依赖查询

```typescript
function TaskDetail({ taskId }) {
  // 先获取任务
  const { data: task } = useTaskQuery(taskId)
  
  // 然后获取任务的评论（依赖 task）
  const { data: comments } = useCommentsQuery(taskId, {
    enabled: !!task  // 仅在任务加载完成后查询
  })
}
```

## 配置

### 全局配置

在 `src/lib/query-client.ts` 中配置：

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 分钟
      gcTime: 1000 * 60 * 30,       // 30 分钟
      retry: 2,                      // 重试 2 次
      refetchOnWindowFocus: true,    // 窗口聚焦时刷新
      refetchOnReconnect: true,      // 重连时刷新
    },
  },
})
```

### 覆盖默认配置

```typescript
useQuery({
  queryKey: ['tasks'],
  queryFn: taskApi.list,
  staleTime: 0,  // 覆盖默认的 5 分钟
  gcTime: Infinity,  // 永不清理
  retry: false,  // 不重试
})
```

## React Query Devtools

开发环境下可以使用 Devtools 查看：

1. **Query 状态**: 查看所有查询的状态
2. **缓存数据**: 查看缓存的数据
3. **Query Inspector**: 详细查看单个查询
4. **时间线**: 查看请求时间线

打开方式：点击页面右下角的浮动图标

## 故障排查

### 数据不更新

**问题**: Mutation 后数据没有更新

**解决**:
```typescript
useMutation({
  mutationFn: taskApi.create,
  onSuccess: () => {
    // ✅ 使查询失效
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
  }
})
```

### 重复请求

**问题**: 同一个请求发送了多次

**解决**: 检查 Query Key 是否一致
```typescript
// ❌ Bad - 每次渲染都是新对象
useQuery({ queryKey: ['tasks', { status: 'pending' }] })

// ✅ Good - 使用稳定的对象
const filters = useMemo(() => ({ status: 'pending' }), [])
useQuery({ queryKey: ['tasks', filters] })
```

### 缓存过期

**问题**: 数据总是重新获取

**解决**: 调整 staleTime
```typescript
useQuery({
  queryKey: ['tasks'],
  queryFn: taskApi.list,
  staleTime: 5 * 60 * 1000,  // 5 分钟内不重新获取
})
```

## 参考资料

- [TanStack Query 官方文档](https://tanstack.com/query/latest/docs/react/overview)
- [React Query 最佳实践](https://tkdodo.eu/blog/practical-react-query)
- [项目示例代码](./src/features/task/)

## 下一步

1. 查看 `src/features/task/` 的完整示例
2. 阅读 `src/features/task/README.md` 了解详细用法
3. 尝试在自己的 feature 中使用 React Query
4. 使用 React Query Devtools 调试查询

---

**Happy Querying! 🚀**

