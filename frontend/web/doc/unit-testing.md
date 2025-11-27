# 单元测试使用指南

本文档介绍如何在 `frontend/web` 项目中编写和运行单元测试。

---

## 📋 目录

- [快速开始](#快速开始)
- [测试框架](#测试框架)
- [测试组织](#测试组织)
- [编写测试](#编写测试)
- [运行测试](#运行测试)
- [覆盖率](#覆盖率)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 快速开始

### 安装依赖

```bash
# 已在 pnpm install 时自动安装
cd frontend/web
pnpm install
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式（开发时推荐）
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# UI 模式（可视化测试）
pnpm test:ui

# CI 模式（单次运行）
pnpm test:ci
```

---

## 测试框架

我们使用以下技术栈：

| 工具 | 版本 | 用途 |
|------|------|------|
| **Vitest** | 4.0+ | 测试运行器 |
| **React Testing Library** | 16.0+ | React 组件测试 |
| **@testing-library/jest-dom** | 6.0+ | DOM 断言扩展 |
| **happy-dom** | 20.0+ | DOM 环境模拟 |

### 为什么选择这些工具？

- **Vitest**: 快速、现代化，与 Vite 无缝集成
- **React Testing Library**: 关注用户行为，而非实现细节
- **happy-dom**: 更好的 ESM 支持，比 jsdom 更快

---

## 测试组织

### 目录结构

我们使用 **Feature 内部 `__tests__` 目录** 的方式组织测试：

```
src/features/{domain}/
├── api/
│   └── {domain}.api.ts
├── hooks/
│   └── useXxx.ts
├── stores/
│   └── {domain}.store.ts
├── components/
│   └── XxxComponent.tsx
└── __tests__/                    # ✨ 测试目录
    ├── api/
    │   └── {domain}.api.test.ts
    ├── hooks/
    │   └── useXxx.test.ts
    ├── stores/
    │   └── {domain}.store.test.ts
    └── components/
        └── XxxComponent.test.tsx
```

### 命名规范

- 测试文件命名：`*.test.ts` 或 `*.test.tsx`
- 测试套件命名：使用 `describe('组件/功能名', () => {})`
- 测试用例命名：使用 `it('应该...', () => {})` 或 `test('应该...', () => {})`

---

## 编写测试

### 1. Hook 测试

```typescript
// features/task/__tests__/hooks/useTasks.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTasks } from '../../hooks/useTasks'
import { taskApi } from '../../api/task.api'

// Mock API
vi.mock('../../api/task.api')

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 重置 store 状态
  })

  it('应该成功加载任务列表', async () => {
    // Arrange
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'pending' }
    ]
    vi.mocked(taskApi.list).mockResolvedValue(mockTasks)

    // Act
    const { result } = renderHook(() => useTasks())

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.tasks).toEqual(mockTasks)
  })

  it('加载失败时应该设置错误', async () => {
    // Arrange
    const errorMessage = 'Failed to load'
    vi.mocked(taskApi.list).mockRejectedValue(new Error(errorMessage))

    // Act
    const { result } = renderHook(() => useTasks())

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
    })
  })
})
```

### 2. Store 测试

```typescript
// features/task/__tests__/stores/task.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from '../../stores/task.store'

describe('TaskStore', () => {
  beforeEach(() => {
    // 重置 store
    const store = useTaskStore.getState()
    store.tasks = []
    store.filter = 'all'
  })

  it('应该能够添加任务', () => {
    // Arrange
    const newTask = { id: '1', title: 'New Task', status: 'pending' }

    // Act
    useTaskStore.getState().addTask(newTask)

    // Assert
    const tasks = useTaskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toEqual(newTask)
  })

  it('应该能够删除任务', () => {
    // Arrange
    const task = { id: '1', title: 'Task', status: 'pending' }
    useTaskStore.getState().addTask(task)

    // Act
    useTaskStore.getState().deleteTask('1')

    // Assert
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })
})
```

### 3. Component 测试

```typescript
// features/task/__tests__/components/TaskItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskItem } from '../../components/TaskItem'

describe('TaskItem', () => {
  it('应该渲染任务信息', () => {
    // Arrange
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'pending',
      priority: 'high'
    }

    // Act
    render(<TaskItem task={task} />)

    // Assert
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('点击完成按钮应该调用回调', () => {
    // Arrange
    const task = { id: '1', title: 'Task', status: 'pending' }
    const onComplete = vi.fn()

    // Act
    render(<TaskItem task={task} onComplete={onComplete} />)
    fireEvent.click(screen.getByRole('button', { name: /complete/i }))

    // Assert
    expect(onComplete).toHaveBeenCalledWith('1')
  })
})
```

---

## 运行测试

### 开发时

```bash
# 监听模式（推荐）
pnpm test:watch

# UI 模式（可视化）
pnpm test:ui
```

### 运行特定测试

```bash
# 运行特定文件
pnpm test useTasks.test.ts

# 运行匹配模式的测试
pnpm test task

# 运行特定测试用例
pnpm test -t "应该成功加载"
```

### CI 模式

```bash
# 单次运行，生成覆盖率
pnpm test:ci
```

---

## 覆盖率

### 生成覆盖率报告

```bash
pnpm test:coverage
```

### 查看报告

```bash
# HTML 报告（自动在浏览器打开）
open coverage/index.html

# 终端查看
cat coverage/coverage-summary.txt
```

### 覆盖率目标

| 指标 | 目标 | 当前 |
|------|------|------|
| **Hooks** | 90%+ | ✅ 90%+ |
| **Stores** | 90%+ | ✅ 95%+ |
| **整体** | 70%+ | ✅ 33% (UI组件待补充) |

**注意**: 当前整体覆盖率较低是因为 UI 组件和 Pages 尚未测试。

---

## 最佳实践

### 1. AAA 模式

```typescript
it('应该做某事', () => {
  // Arrange（准备）
  const input = { ... }
  vi.mocked(api).mockResolvedValue(...)

  // Act（执行）
  const result = doSomething(input)

  // Assert（断言）
  expect(result).toBe(expected)
})
```

### 2. 使用 beforeEach 清理

```typescript
beforeEach(() => {
  vi.clearAllMocks()          // 清除 mock 调用记录
  useStore.getState().reset() // 重置 store
  localStorage.clear()        // 清除 localStorage
})
```

### 3. 异步测试使用 waitFor

```typescript
it('异步操作', async () => {
  const { result } = renderHook(() => useAsync())

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.data).toBeDefined()
})
```

### 4. Mock 外部依赖

```typescript
// ✅ Good: Mock API
vi.mock('../../api/task.api')

// ✅ Good: Mock 特定函数
vi.mocked(taskApi.list).mockResolvedValue([...])

// ❌ Bad: 不 mock，依赖真实网络
```

### 5. 测试用户行为，而非实现

```typescript
// ✅ Good: 测试用户可见的内容
expect(screen.getByText('Submit')).toBeInTheDocument()

// ❌ Bad: 测试内部状态
expect(component.state.isSubmitting).toBe(true)
```

---

## 常见问题

### Q1: 如何 mock API？

```typescript
// 在测试文件顶部
vi.mock('../../api/task.api')

// 在测试中
vi.mocked(taskApi.list).mockResolvedValue([...])
```

### Q2: 如何重置 Store？

```typescript
beforeEach(() => {
  const store = useTaskStore.getState()
  store.tasks = []
  // 或调用 reset 方法（如果有）
  store.reset()
})
```

### Q3: 测试中出现 act() 警告？

```typescript
// 使用 waitFor
await waitFor(() => {
  expect(result.current.loading).toBe(false)
})

// 或 act()
await act(async () => {
  await result.current.loadData()
})
```

### Q4: 如何测试 localStorage？

```typescript
beforeEach(() => {
  localStorage.clear()
})

it('测试', () => {
  localStorage.setItem('token', 'xxx')
  // ...
  expect(localStorage.getItem('token')).toBe('xxx')
})
```

### Q5: 如何跳过测试？

```typescript
it.skip('临时跳过的测试', () => {
  // ...
})

it.only('只运行这个测试', () => {
  // ...
})
```

---

## 相关资源

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library 查询指南](https://testing-library.com/docs/queries/about)
- [测试方案文档](../../../docs/FRONTEND_TESTING_PLAN.md)

---

**最后更新**: 2025-11-27  
**维护者**: Frontend Team

