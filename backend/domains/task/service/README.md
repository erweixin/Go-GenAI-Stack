# Task Domain Service Layer

## 📖 概述

Domain Service 层是**业务逻辑的实现层**，位于领域层（Domain Layer）。

### 职责

- ✅ **实现业务用例**：对应 `usecases.yaml` 中定义的用例
- ✅ **封装业务逻辑**：复杂的业务流程和规则
- ✅ **协调领域对象**：Model、Repository、Event Bus 等
- ✅ **事务管理**：跨多个实体的事务操作

### 不属于这里

- ❌ HTTP 请求/响应处理（属于 Handler 层）
- ❌ 数据访问实现（属于 Repository 层）
- ❌ 简单的领域规则（应该在 Model 的方法中）

---

## 🏗️ 架构说明

### 三层架构

```
┌─────────────────────────────────────────────────┐
│  Handler Layer (handlers/)                      │  ← HTTP 适配层（薄）
│  职责：HTTP → Domain Input → HTTP               │
│       解析请求、调用 Service、构造响应          │
├─────────────────────────────────────────────────┤
│  Domain Service Layer (service/)    ⭐          │  ← 业务逻辑层（厚）
│  职责：实现业务用例                             │
│       封装复杂流程、协调领域对象                │
├─────────────────────────────────────────────────┤
│  Model Layer (model/)                           │  ← 领域模型层
│  职责：简单的领域规则和状态变更                 │
├─────────────────────────────────────────────────┤
│  Repository Layer (repository/)                 │  ← 数据访问层
│  职责：数据持久化                               │
└─────────────────────────────────────────────────┘
```

### 为什么需要 Domain Service？

**问题**：如果只有 Handler → Repository，业务逻辑会写在哪里？
- ❌ 写在 Handler 中 → Handler 变成上帝类（God Class）
- ❌ 写在 Model 中 → Model 承担过多职责
- ✅ 写在 Service 中 → **职责清晰，易于测试和维护**

---

## 📝 代码示例

### Service 层实现

```go
// task_service.go
package service

type TaskService struct {
    taskRepo repository.TaskRepository
    // eventBus events.EventBus
}

func NewTaskService(taskRepo repository.TaskRepository) *TaskService {
    return &TaskService{taskRepo: taskRepo}
}

// CreateTask 实现 CreateTask 用例
// 对应 usecases.yaml 中的步骤
func (s *TaskService) CreateTask(ctx context.Context, input CreateTaskInput) (*CreateTaskOutput, error) {
    // Step 1: ValidateInput
    if input.Title == "" {
        return nil, fmt.Errorf("TASK_TITLE_EMPTY: 任务标题不能为空")
    }

    // Step 2 & 3: CreateTaskEntity
    task, err := model.NewTask(input.Title, input.Description, input.Priority)
    if err != nil {
        return nil, err
    }

    // Step 4: SaveTask
    if err := s.taskRepo.Create(ctx, task); err != nil {
        return nil, fmt.Errorf("保存任务失败: %w", err)
    }

    // Step 5: PublishTaskCreatedEvent
    // s.eventBus.Publish(ctx, TaskCreatedEvent{...})

    return &CreateTaskOutput{Task: task}, nil
}
```

### Handler 层调用

```go
// create_task.handler.go
package handlers

func (deps *HandlerDependencies) CreateTaskHandler(ctx context.Context, c *app.RequestContext) {
    // 1. 解析 HTTP 请求
    var req dto.CreateTaskRequest
    c.BindAndValidate(&req)

    // 2. 转换为 Domain Input
    input := service.CreateTaskInput{
        Title:       req.Title,
        Description: req.Description,
        Priority:    model.Priority(req.Priority),
    }

    // 3. 调用 Domain Service（业务逻辑在这里）
    output, err := deps.taskService.CreateTask(ctx, input)
    if err != nil {
        handleDomainError(c, err)
        return
    }

    // 4. 转换为 HTTP 响应
    c.JSON(200, dto.CreateTaskResponse{
        TaskID: output.Task.ID,
        ...
    })
}
```

---

## 🎯 设计原则

### 1. 用例驱动

每个 Service 方法对应一个业务用例（usecases.yaml）：

```yaml
# usecases.yaml
CreateTask:
  steps:
    - ValidateInput
    - CreateTaskEntity
    - SaveTask
    - PublishEvent
```

```go
// Service 实现对应 yaml 中的步骤
func (s *TaskService) CreateTask(...) {
    // Step 1: ValidateInput
    // Step 2: CreateTaskEntity
    // Step 3: SaveTask
    // Step 4: PublishEvent
}
```

### 2. 输入/输出显式化

使用专用的 Input/Output 结构体：

```go
// Domain Input（不同于 HTTP DTO）
type CreateTaskInput struct {
    Title       string
    Description string
    Priority    model.Priority
    DueDate     *time.Time
}

// Domain Output
type CreateTaskOutput struct {
    Task *model.Task
}
```

**为什么不直接用 HTTP DTO？**
- HTTP DTO 包含 json tag、validation tag（技术细节）
- Domain Input/Output 是纯业务概念
- 分离关注点，降低耦合

### 3. 错误处理规范

使用 "ERROR_CODE: message" 格式：

```go
if task.Status == StatusCompleted {
    return nil, fmt.Errorf("TASK_ALREADY_COMPLETED: 已完成的任务不能更新")
}
```

Handler 层会自动解析错误码并转换为 HTTP 状态码。

### 4. 日志记录

关键操作记录日志：

```go
log.Printf("Task created: %s", task.ID)
log.Printf("Warning: failed to count tasks: %v", err)
```

---

## 📊 Service vs Model

### 何时用 Model 方法？

✅ **简单的状态变更**：

```go
// model/task.go
func (t *Task) Complete() error {
    if t.Status == StatusCompleted {
        return ErrTaskAlreadyCompleted
    }
    t.Status = StatusCompleted
    t.CompletedAt = timePtr(time.Now())
    return nil
}
```

### 何时用 Service 方法？

✅ **复杂的业务流程**：

```go
// service/task_service.go
func (s *TaskService) CompleteTask(ctx context.Context, taskID string) (*model.Task, error) {
    // 1. 从数据库获取
    task, err := s.taskRepo.FindByID(ctx, taskID)
    
    // 2. 调用 Model 方法
    if err := task.Complete(); err != nil {
        return nil, err
    }
    
    // 3. 保存到数据库
    if err := s.taskRepo.Update(ctx, task); err != nil {
        return nil, err
    }
    
    // 4. 发布事件
    // s.eventBus.Publish(...)
    
    return task, nil
}
```

**原则**：
- Model：管理单个实体的状态和规则
- Service：管理用例流程和多个对象的协作

---

## 🧪 测试策略

### Service 层测试

```go
func TestCreateTask(t *testing.T) {
    // 1. Mock Repository
    mockRepo := &MockTaskRepository{}
    service := NewTaskService(mockRepo)

    // 2. 准备输入
    input := CreateTaskInput{
        Title: "Test Task",
        Priority: PriorityMedium,
    }

    // 3. 调用 Service
    output, err := service.CreateTask(context.Background(), input)

    // 4. 验证结果
    assert.NoError(t, err)
    assert.NotNil(t, output.Task)
    assert.Equal(t, "Test Task", output.Task.Title)

    // 5. 验证 Repository 被调用
    mockRepo.AssertCalled(t, "Create")
}
```

**优势**：
- 不需要 HTTP 层，测试更快
- 专注业务逻辑，不受 HTTP 细节干扰
- 易于 Mock 依赖

---

## 🔄 与其他层的交互

### 调用链

```
HTTP Request
    ↓
Handler（薄层）
    ↓ 调用
Domain Service（厚层）
    ↓ 调用
Repository（数据访问）
    ↓ 调用
Database
```

### 依赖注入

```go
// bootstrap/dependencies.go

// 1. 创建 Repository
taskRepo := repository.NewTaskRepository(db)

// 2. 创建 Service（注入 Repository）
taskService := service.NewTaskService(taskRepo)

// 3. 创建 Handler Dependencies（注入 Service）
handlerDeps := handlers.NewHandlerDependencies(taskService)
```

**依赖方向**：Handler → Service → Repository → Database

---

## 📚 最佳实践

### ✅ DO

1. **每个用例一个方法**
   ```go
   func (s *TaskService) CreateTask(...)
   func (s *TaskService) UpdateTask(...)
   func (s *TaskService) CompleteTask(...)
   ```

2. **使用专用的 Input/Output 结构体**
   ```go
   type CreateTaskInput struct { ... }
   type CreateTaskOutput struct { ... }
   ```

3. **业务错误使用 "ERROR_CODE: message" 格式**
   ```go
   return nil, fmt.Errorf("TASK_NOT_FOUND: 任务不存在")
   ```

4. **关键操作记录日志**
   ```go
   log.Printf("Task created: %s", task.ID)
   ```

5. **事务操作使用 WithTransaction**
   ```go
   err := postgres.WithTransaction(ctx, db, func(tx *sql.Tx) error {
       // 多个数据库操作
   })
   ```

### ❌ DON'T

1. **不要在 Service 中处理 HTTP 细节**
   ```go
   // ❌ Bad
   func (s *TaskService) CreateTask(c *app.RequestContext) {
       c.JSON(200, ...)
   }
   
   // ✅ Good
   func (s *TaskService) CreateTask(input CreateTaskInput) (*CreateTaskOutput, error)
   ```

2. **不要直接返回 Repository 错误**
   ```go
   // ❌ Bad
   return s.taskRepo.Create(ctx, task)
   
   // ✅ Good
   if err := s.taskRepo.Create(ctx, task); err != nil {
       return nil, fmt.Errorf("保存任务失败: %w", err)
   }
   ```

3. **不要在 Service 中实现简单的领域规则**
   ```go
   // ❌ Bad: 应该在 Model 中
   func (s *TaskService) CompleteTask(...) {
       if task.Status == StatusCompleted {
           return ErrAlreadyCompleted
       }
       task.Status = StatusCompleted
   }
   
   // ✅ Good: 调用 Model 方法
   func (s *TaskService) CompleteTask(...) {
       if err := task.Complete(); err != nil {
           return nil, err
       }
   }
   ```

---

## 🔗 相关文档

- [Task Domain Overview](../README.md)
- [Use Cases](../usecases.yaml)
- [Business Rules](../rules.md)
- [Repository Layer](../repository/interface.go)
- [Handler Layer](../handlers/service.go)

---

**最后更新**：2025-11-23
**维护者**：Backend Team

