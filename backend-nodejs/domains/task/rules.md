# Task Domain Business Rules (任务领域业务规则)

> 本文档定义了 Task 领域的所有业务规则和约束

**最后更新**：2025-11-23

---

## 📋 规则分类

- **[验证规则](#验证规则)**：输入数据的有效性检查
- **[状态规则](#状态规则)**：状态转换的约束
- **[业务约束](#业务约束)**：业务逻辑的限制
- **[数据一致性](#数据一致性)**：数据完整性保障

---

## 验证规则

### R1.1 任务标题不能为空

**规则**：`TASK_TITLE_EMPTY`

**条件**：创建或更新任务时

**约束**：

- 标题（Title）必须非空
- 标题长度 >= 1
- 标题长度 <= 200

**错误码**：`TASK_TITLE_EMPTY`

**HTTP 状态码**：400 Bad Request

**错误消息**：`"任务标题不能为空"`

**示例**：

```go
// ❌ 错误
task := &Task{
    Title: "",  // 空标题
}

// ✅ 正确
task := &Task{
    Title: "完成项目文档",
}
```

---

### R1.2 任务描述长度限制

**规则**：`TASK_DESCRIPTION_TOO_LONG`

**条件**：创建或更新任务时

**约束**：

- 描述（Description）长度 <= 5000 字符
- 描述可以为空

**错误码**：`TASK_DESCRIPTION_TOO_LONG`

**HTTP 状态码**：400 Bad Request

---

### R1.3 优先级必须有效

**规则**：`INVALID_PRIORITY`

**条件**：创建或更新任务时

**约束**：

- Priority 必须是 `low`, `medium`, `high` 之一
- 如果未提供，默认为 `medium`

**错误码**：`INVALID_PRIORITY`

**HTTP 状态码**：400 Bad Request

**错误消息**：`"优先级无效，必须是 low, medium 或 high"`

---

### R1.4 截止日期不能早于创建日期

**规则**：`INVALID_DUE_DATE`

**条件**：创建或更新任务时

**约束**：

- 如果提供了 DueDate，必须 >= CreatedAt
- DueDate 可以为空（表示无截止日期）

**错误码**：`INVALID_DUE_DATE`

**HTTP 状态码**：400 Bad Request

**错误消息**：`"截止日期不能早于创建日期"`

**示例**：

```go
// ❌ 错误
task := &Task{
    CreatedAt: time.Date(2025, 11, 23, 10, 0, 0, 0, time.UTC),
    DueDate:   time.Date(2025, 11, 22, 10, 0, 0, 0, time.UTC),  // 早于创建日期
}

// ✅ 正确
task := &Task{
    CreatedAt: time.Date(2025, 11, 23, 10, 0, 0, 0, time.UTC),
    DueDate:   time.Date(2025, 11, 30, 10, 0, 0, 0, time.UTC),  // 晚于创建日期
}
```

---

### R1.5 标签名称不能为空

**规则**：`TAG_NAME_EMPTY`

**条件**：添加标签时

**约束**：

- 标签名称必须非空
- 标签名称长度 >= 1
- 标签名称长度 <= 50

**错误码**：`TAG_NAME_EMPTY`

**HTTP 状态码**：400 Bad Request

---

## 状态规则

### R2.1 只能从 Pending 或 InProgress 完成任务

**规则**：`TASK_ALREADY_COMPLETED`

**条件**：调用 CompleteTask 时

**约束**：

- 只有状态为 `Pending` 或 `InProgress` 的任务可以完成
- 状态为 `Completed` 的任务不能再次完成

**错误码**：`TASK_ALREADY_COMPLETED`

**HTTP 状态码**：400 Bad Request

**错误消息**：`"任务已完成，不能再次完成"`

**状态转换图**：

```
Pending ──────┐
              ├──> Completed
InProgress ───┘

Completed ──X──> Completed (不允许)
```

**示例**：

```go
// ❌ 错误
task := &Task{Status: StatusCompleted}
task.Complete()  // 报错：TASK_ALREADY_COMPLETED

// ✅ 正确
task := &Task{Status: StatusPending}
task.Complete()  // 成功
```

---

### R2.2 完成任务时记录完成时间

**规则**：`RECORD_COMPLETED_AT`

**条件**：任务状态变更为 Completed 时

**约束**：

- 必须记录 CompletedAt 时间戳
- CompletedAt 不能早于 CreatedAt
- CompletedAt 应该是当前时间

**实现**：

```go
func (t *Task) Complete() error {
    if t.Status == StatusCompleted {
        return ErrTaskAlreadyCompleted
    }

    t.Status = StatusCompleted
    t.CompletedAt = time.Now()  // 记录完成时间
    t.UpdatedAt = time.Now()

    return nil
}
```

---

### R2.3 状态变更必须合法

**规则**：`INVALID_STATUS_TRANSITION`

**条件**：更新任务状态时

**允许的状态转换**：

```
Pending → InProgress  ✅
Pending → Completed   ✅
InProgress → Completed ✅
```

**不允许的状态转换**：

```
Completed → Pending      ❌
Completed → InProgress   ❌
InProgress → Pending     ❌ (可选：是否允许暂停)
```

**错误码**：`INVALID_STATUS_TRANSITION`

**HTTP 状态码**：400 Bad Request

---

## 业务约束

### R3.1 任务 ID 必须唯一

**规则**：`TASK_ID_DUPLICATE`

**条件**：创建任务时

**约束**：

- TaskID 在系统中必须唯一
- 使用 UUID 或雪花算法生成 ID

**错误码**：`TASK_ID_DUPLICATE`

**HTTP 状态码**：409 Conflict

**实现**：

```go
func NewTask(title string) *Task {
    return &Task{
        ID:        generateUUID(),  // 生成唯一 ID
        Title:     title,
        Status:    StatusPending,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
}
```

---

### R3.2 同一任务的标签名称不能重复

**规则**：`DUPLICATE_TAG`

**条件**：添加标签时

**约束**：

- 一个任务内，标签名称必须唯一
- 不同任务可以有相同的标签

**错误码**：`DUPLICATE_TAG`

**HTTP 状态码**：400 Bad Request

**示例**：

```go
// ❌ 错误
task.Tags = []Tag{
    {Name: "工作"},
    {Name: "工作"},  // 重复
}

// ✅ 正确
task.Tags = []Tag{
    {Name: "工作"},
    {Name: "紧急"},
}
```

---

### R3.3 任务最多支持 10 个标签

**规则**：`TOO_MANY_TAGS`

**条件**：添加标签时

**约束**：

- 每个任务最多 10 个标签
- 防止标签滥用

**错误码**：`TOO_MANY_TAGS`

**HTTP 状态码**：400 Bad Request

---

## 数据一致性

### R4.1 删除任务时清理相关数据

**规则**：`CASCADE_DELETE`

**条件**：删除任务时

**约束**：

- 删除任务时，应该清理相关的标签关联
- 如果实现了子任务，应该清理子任务
- 如果实现了评论，应该清理评论

**实现方式**：

- 数据库外键级联删除
- 或应用层显式删除

---

### R4.2 更新操作必须更新 UpdatedAt

**规则**：`UPDATE_TIMESTAMP`

**条件**：任何更新操作

**约束**：

- 任何字段更新都必须更新 UpdatedAt
- UpdatedAt 应该是当前时间
- UpdatedAt >= CreatedAt

**实现**：

```go
func (t *Task) Update(title, description string) {
    t.Title = title
    t.Description = description
    t.UpdatedAt = time.Now()  // 更新时间戳
}
```

---

### R4.3 任务不存在时返回 404

**规则**：`TASK_NOT_FOUND`

**条件**：查询、更新、删除不存在的任务时

**约束**：

- 返回 404 Not Found
- 错误消息明确说明任务不存在

**错误码**：`TASK_NOT_FOUND`

**HTTP 状态码**：404 Not Found

**错误消息**：`"任务不存在：{task_id}"`

---

## 查询规则

### R5.1 列表查询必须支持分页

**规则**：`PAGINATION_REQUIRED`

**条件**：ListTasks 操作

**约束**：

- 必须提供 `page` 和 `limit` 参数
- page >= 1
- limit >= 1 且 limit <= 100
- 默认值：page=1, limit=20

**错误码**：`INVALID_PAGINATION`

**HTTP 状态码**：400 Bad Request

---

### R5.2 筛选参数必须有效

**规则**：`INVALID_FILTER`

**条件**：ListTasks 操作时使用筛选

**支持的筛选字段**：

- `status` - 必须是有效的 TaskStatus
- `priority` - 必须是有效的 Priority
- `tag` - 标签名称
- `due_date_from` - ISO 8601 格式
- `due_date_to` - ISO 8601 格式

**错误码**：`INVALID_FILTER`

**HTTP 状态码**：400 Bad Request

---

## 权限规则（未实现）

以下是潜在的权限规则，当前版本未实现：

### R6.1 用户只能访问自己的任务

**规则**：`UNAUTHORIZED_ACCESS`

**条件**：所有操作

**约束**：

- 用户只能查看、修改、删除自己创建的任务
- 管理员可以访问所有任务

**错误码**：`UNAUTHORIZED_ACCESS`

**HTTP 状态码**：403 Forbidden

---

### R6.2 共享任务的权限控制

**规则**：`SHARED_TASK_PERMISSION`

**条件**：访问共享任务时

**约束**：

- 只读权限：可以查看，不能修改
- 编辑权限：可以修改，不能删除
- 所有者权限：可以进行所有操作

---

## 测试覆盖

每个业务规则都应该有对应的测试用例：

| 规则编号 | 测试用例                           | 覆盖 |
| -------- | ---------------------------------- | ---- |
| R1.1     | TestCreateTask_EmptyTitle          | ✅   |
| R1.1     | TestUpdateTask_EmptyTitle          | ✅   |
| R1.4     | TestCreateTask_InvalidDueDate      | ✅   |
| R2.1     | TestCompleteTask_AlreadyCompleted  | ✅   |
| R2.2     | TestCompleteTask_RecordCompletedAt | ✅   |
| R3.2     | TestAddTag_Duplicate               | ✅   |
| R3.3     | TestAddTag_TooMany                 | ✅   |
| R4.3     | TestGetTask_NotFound               | ✅   |

---

## 规则变更日志

### 2025-11-23

- 初始版本
- 定义了所有核心业务规则

---

**维护说明**：

- 添加新规则时，分配唯一的规则编号
- 规则应该可测试、可验证
- 规则变更应该记录在变更日志中
- 定期审查规则的合理性
