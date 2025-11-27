# Task 用例（Use Cases）

对齐后端 `backend/domains/task/usecases.yaml`

---

## 1. CreateTask - 创建任务

**触发**: 点击 "新建任务" 按钮

**输入**:
- `title` (string, required): 任务标题
- `description` (string, optional): 任务描述
- `priority` (string, required): 优先级（low, medium, high）
- `due_date` (string, optional): 截止日期（ISO 8601 格式）
- `tags` (string[], optional): 标签列表

**输出**:
- `task_id` (string): 任务 ID
- `title` (string): 任务标题
- `status` (string): 任务状态
- `created_at` (string): 创建时间

**组件**: `TaskCreateDialog`  
**Hook**: `useTaskCreate`  
**API**: `POST /api/tasks`

---

## 2. ListTasks - 列出任务

**触发**: 进入任务页面、应用筛选器

**输入** (可选):
- `status` (string): 状态筛选（pending, completed）
- `priority` (string): 优先级筛选（low, medium, high）
- `tag` (string): 标签筛选
- `page` (number): 页码
- `limit` (number): 每页数量
- `sort_by` (string): 排序字段
- `sort_order` (string): 排序方向（asc, desc）

**输出**:
- `tasks` (TaskItem[]): 任务列表
- `total_count` (number): 总数
- `page` (number): 当前页
- `limit` (number): 每页数量
- `has_more` (boolean): 是否有更多

**组件**: `TaskList`, `TaskFilters`  
**Hook**: `useTasks`  
**API**: `GET /api/tasks`

---

## 3. GetTask - 获取任务详情

**触发**: 点击任务查看详情

**输入**:
- `task_id` (string): 任务 ID

**输出**:
- `task_id` (string): 任务 ID
- `title` (string): 任务标题
- `description` (string): 任务描述
- `status` (string): 任务状态
- `priority` (string): 优先级
- `due_date` (string, optional): 截止日期
- `tags` (string[]): 标签列表
- `created_at` (string): 创建时间
- `updated_at` (string): 更新时间
- `completed_at` (string, optional): 完成时间

**组件**: `TaskDetailDialog`  
**Hook**: `useTask`  
**API**: `GET /api/tasks/:id`

---

## 4. UpdateTask - 更新任务

**触发**: 点击编辑按钮，修改任务信息

**输入**:
- `task_id` (string): 任务 ID
- `title` (string, optional): 任务标题
- `description` (string, optional): 任务描述
- `priority` (string, optional): 优先级
- `due_date` (string, optional): 截止日期
- `tags` (string[], optional): 标签列表

**输出**:
- `task_id` (string): 任务 ID
- `title` (string): 任务标题
- `status` (string): 任务状态
- `updated_at` (string): 更新时间

**组件**: `TaskEditDialog`  
**Hook**: `useTaskUpdate`  
**API**: `PUT /api/tasks/:id`

---

## 5. CompleteTask - 完成任务

**触发**: 点击完成按钮

**输入**:
- `task_id` (string): 任务 ID

**输出**:
- `task_id` (string): 任务 ID
- `status` (string): 任务状态（completed）
- `completed_at` (string): 完成时间

**组件**: `TaskItem`  
**Hook**: `useTaskComplete`  
**API**: `POST /api/tasks/:id/complete`

---

## 6. DeleteTask - 删除任务

**触发**: 点击删除按钮，确认删除

**输入**:
- `task_id` (string): 任务 ID

**输出**:
- `success` (boolean): 是否成功
- `deleted_at` (string): 删除时间

**组件**: `TaskItem`  
**Hook**: `useTaskDelete`  
**API**: `DELETE /api/tasks/:id`

---

## 流程图

```
用户操作          组件                Hook                API
--------         --------           --------            --------
点击新建    →    TaskCreateDialog  →  useTaskCreate  →  POST /tasks
进入页面    →    TaskList          →  useTasks       →  GET /tasks
点击编辑    →    TaskEditDialog    →  useTaskUpdate  →  PUT /tasks/:id
点击完成    →    TaskItem          →  useTaskComplete → POST /tasks/:id/complete
点击删除    →    TaskItem          →  useTaskDelete  →  DELETE /tasks/:id
```

## 状态流转

```
pending (待办)
   ↓
   ↓ [CompleteTask]
   ↓
completed (已完成)
```

## 错误处理

所有用例都应该处理以下错误：

- `UNAUTHORIZED` (401): 未登录
- `FORBIDDEN` (403): 无权限
- `NOT_FOUND` (404): 任务不存在
- `VALIDATION_ERROR` (400): 输入验证失败
- `SERVER_ERROR` (500): 服务器错误

错误信息通过 Hook 的 `error` 字段返回。

