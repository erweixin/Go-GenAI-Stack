# Task Domain Glossary (任务领域术语表)

> 本文档定义了 Task 领域的统一语言（Ubiquitous Language）

---

## 核心术语

### Task（任务）

**定义**：需要完成的工作项或待办事项

**类型**：聚合根（Aggregate Root）

**属性**：

- 有唯一标识（TaskID）
- 有标题和描述
- 有状态（待办/进行中/已完成）
- 有优先级
- 可以有截止日期

**生命周期**：

```
创建 → 待办(Pending) → 进行中(InProgress) → 已完成(Completed)
       ↓
     删除(Deleted)
```

**业务规则**：

- 任务标题不能为空（`TASK_TITLE_EMPTY`）
- 已完成的任务不能再更新状态（`TASK_ALREADY_COMPLETED`）

**相关事件**：

- `TaskCreated` - 任务创建时
- `TaskUpdated` - 任务更新时
- `TaskCompleted` - 任务完成时
- `TaskDeleted` - 任务删除时

---

### TaskStatus（任务状态）

**定义**：任务所处的生命周期阶段

**类型**：值对象（Value Object）/ 枚举

**可选值**：

- `Pending` - 待办：任务已创建但未开始
- `InProgress` - 进行中：任务正在执行
- `Completed` - 已完成：任务已完成

**状态转换规则**：

```
Pending → InProgress  (开始任务)
InProgress → Completed  (完成任务)
Pending → Completed  (直接完成)
```

**不允许的转换**：

- ❌ Completed → Pending
- ❌ Completed → InProgress

**示例**：

```go
type TaskStatus string

const (
    StatusPending    TaskStatus = "pending"
    StatusInProgress TaskStatus = "in_progress"
    StatusCompleted  TaskStatus = "completed"
)
```

---

### Priority（优先级）

**定义**：任务的重要程度

**类型**：值对象（Value Object）/ 枚举

**可选值**：

- `Low` - 低优先级
- `Medium` - 中优先级
- `High` - 高优先级

**业务含义**：

- **High（高）**：紧急重要，需要立即处理
- **Medium（中）**：正常优先级
- **Low（低）**：可以延后处理

**排序规则**：

- 列表默认按优先级降序排列（High → Medium → Low）
- 相同优先级按创建时间排序

**示例**：

```go
type Priority string

const (
    PriorityLow    Priority = "low"
    PriorityMedium Priority = "medium"
    PriorityHigh   Priority = "high"
)
```

---

### Tag（标签）

**定义**：用于分类和组织任务的标识

**类型**：值对象（Value Object）

**属性**：

- Name - 标签名称（如 "工作", "个人", "学习"）
- Color - 颜色代码（用于 UI 展示）

**业务规则**：

- 一个任务可以有多个标签
- 标签名称不能为空
- 标签名称应该唯一（同一任务内）

**示例**：

```go
type Tag struct {
    Name  string
    Color string  // 如 "#FF5733"
}
```

---

### DueDate（截止日期）

**定义**：任务需要完成的目标日期

**类型**：值对象（Value Object）

**业务规则**：

- 截止日期不能早于创建日期
- 可以为空（表示无截止日期）

**相关概念**：

- **逾期（Overdue）**：当前日期 > 截止日期 且 状态 ≠ Completed

---

## 领域操作

### CreateTask（创建任务）

**定义**：创建一个新的任务

**输入**：

- Title（必填）
- Description（可选）
- Priority（可选，默认 Medium）
- DueDate（可选）
- Tags（可选）

**输出**：

- 新创建的 Task 对象
- TaskCreated 事件

**前置条件**：

- 标题不能为空

**后置条件**：

- Task 状态为 Pending
- 生成唯一的 TaskID
- 记录 CreatedAt 时间戳

---

### UpdateTask（更新任务）

**定义**：修改任务的属性

**可更新字段**：

- Title
- Description
- Priority
- DueDate
- Tags

**不可更新字段**：

- TaskID
- Status（通过专门的状态变更方法）
- CreatedAt
- CompletedAt

**业务规则**：

- 已完成的任务不能更新（除非重新打开）

---

### CompleteTask（完成任务）

**定义**：将任务标记为已完成

**状态变更**：

- Status: Pending/InProgress → Completed
- 记录 CompletedAt 时间戳

**业务规则**：

- 已完成的任务不能再次完成

**触发事件**：

- TaskCompleted

---

### DeleteTask（删除任务）

**定义**：删除任务（物理删除或软删除）

**实现方式**：

- 物理删除：从数据库中移除记录
- 软删除：设置 DeletedAt 字段

**业务规则**：

- 删除后不可恢复（如果物理删除）

**触发事件**：

- TaskDeleted

---

### ListTasks（列出任务）

**定义**：查询任务列表，支持筛选和分页

**筛选条件**：

- Status（按状态筛选）
- Priority（按优先级筛选）
- Tags（按标签筛选）
- DueDate（按截止日期范围筛选）
- Keyword（按标题/描述搜索）

**排序选项**：

- CreatedAt（创建时间）
- DueDate（截止日期）
- Priority（优先级）

**分页参数**：

- Page（页码，从 1 开始）
- Limit（每页数量，默认 20，最大 100）

---

## 错误码

### TASK_TITLE_EMPTY

**说明**：任务标题不能为空

**场景**：CreateTask, UpdateTask

**HTTP 状态码**：400 Bad Request

---

### TASK_NOT_FOUND

**说明**：任务不存在

**场景**：GetTask, UpdateTask, CompleteTask, DeleteTask

**HTTP 状态码**：404 Not Found

---

### TASK_ALREADY_COMPLETED

**说明**：任务已完成，不能再次完成

**场景**：CompleteTask

**HTTP 状态码**：400 Bad Request

---

### INVALID_DUE_DATE

**说明**：截止日期无效（早于创建日期）

**场景**：CreateTask, UpdateTask

**HTTP 状态码**：400 Bad Request

---

## 领域事件

### TaskCreated

**触发时机**：成功创建任务后

**数据**：

- TaskID
- Title
- Priority
- CreatedAt

**消费者**：

- Analytics（统计）
- Notification（通知）

---

### TaskCompleted

**触发时机**：任务标记为完成后

**数据**：

- TaskID
- Title
- CompletedAt

**消费者**：

- Analytics（完成率统计）
- Achievement（成就系统）

---

## 扩展术语（未实现）

以下术语是潜在的扩展点，当前版本未实现：

- **TaskList（任务列表）**：任务的容器，用于分组
- **Subtask（子任务）**：任务的细分工作项
- **TaskDependency（任务依赖）**：任务之间的依赖关系
- **Assignee（负责人）**：任务的执行者
- **TaskComment（任务评论）**：任务的讨论和备注
- **Attachment（附件）**：任务相关的文件
- **Recurrence（重复任务）**：周期性任务

---

**维护说明**：

- 添加新术语时，更新本文档
- 术语定义应该清晰、简洁
- 使用业务语言，避免技术术语
- 保持与代码中的命名一致

**最后更新**：2025-11-23
