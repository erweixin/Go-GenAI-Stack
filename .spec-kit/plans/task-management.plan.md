# Task Management Domain Implementation Plan

**版本**: 1.0  
**创建日期**: 2025-12-19  
**状态**: ✅ 已实现  
**基于规范**: [task-management.spec.md](../specs/task-management.spec.md)

---

## 1. 架构设计

### 1.1 领域划分

**Task Domain** 是一个独立的领域，采用 DDD 三层架构：

```
domains/task/
├── model/              # 领域模型层
│   └── task.go        # Task 聚合根
├── service/           # 领域服务层（核心业务逻辑）
│   └── task_service.go
├── repository/        # 仓储层（数据访问）
│   ├── interface.go
│   └── task_repo.go
├── handlers/          # HTTP 适配层
│   ├── create_task.handler.go
│   ├── update_task.handler.go
│   ├── complete_task.handler.go
│   ├── delete_task.handler.go
│   ├── get_task.handler.go
│   └── list_tasks.handler.go
└── http/              # HTTP 接口层
    ├── dto/           # 数据传输对象
    │   └── task.go
    └── router.go      # 路由注册
```

### 1.2 技术栈

- **语言**: Go 1.23+
- **框架**: CloudWeGo Hertz
- **数据库**: PostgreSQL 16+ (database/sql, 不使用 ORM)
- **缓存**: Redis 7+ (可选)

### 1.3 设计模式

- **Repository Pattern**: 数据访问抽象
- **Service Layer Pattern**: 业务逻辑封装
- **DTO Pattern**: 数据传输对象
- **Domain Events**: 领域事件发布

---

## 2. 数据模型设计

### 2.1 数据库表结构

```sql
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'medium',
    due_date TIMESTAMP,
    tags JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed')),
    CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'))
);

-- 索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

### 2.2 领域模型

```go
// model/task.go
type Task struct {
    ID          string
    Title       string
    Description string
    Status      TaskStatus
    Priority    Priority
    DueDate     *time.Time
    Tags        []string
    CreatedAt   time.Time
    UpdatedAt   time.Time
    CompletedAt *time.Time
}

type TaskStatus string
const (
    TaskStatusPending    TaskStatus = "pending"
    TaskStatusInProgress TaskStatus = "in_progress"
    TaskStatusCompleted  TaskStatus = "completed"
)

type Priority string
const (
    PriorityLow    Priority = "low"
    PriorityMedium Priority = "medium"
    PriorityHigh   Priority = "high"
)
```

---

## 3. API 设计

### 3.1 RESTful API 规范

| 端点 | 方法 | 功能 | 请求体 | 响应 |
|------|------|------|--------|------|
| `/api/tasks` | POST | 创建任务 | `CreateTaskRequest` | `CreateTaskResponse` |
| `/api/tasks` | GET | 获取任务列表 | Query Params | `ListTasksResponse` |
| `/api/tasks/:id` | GET | 获取任务详情 | - | `GetTaskResponse` |
| `/api/tasks/:id` | PUT | 更新任务 | `UpdateTaskRequest` | `UpdateTaskResponse` |
| `/api/tasks/:id/complete` | POST | 完成任务 | - | `CompleteTaskResponse` |
| `/api/tasks/:id` | DELETE | 删除任务 | - | `DeleteTaskResponse` |

### 3.2 DTO 定义

```go
// http/dto/task.go

// 创建任务请求
type CreateTaskRequest struct {
    Title       string   `json:"title" binding:"required,max=200,min=1"`
    Description string   `json:"description" binding:"max=5000"`
    Priority    string   `json:"priority" binding:"omitempty,oneof=low medium high"`
    DueDate     string   `json:"due_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
    Tags        []string `json:"tags" binding:"omitempty,max=10,dive,max=50"`
}

// 创建任务响应
type CreateTaskResponse struct {
    TaskID    string `json:"task_id"`
    Title     string `json:"title"`
    Status    string `json:"status"`
    CreatedAt string `json:"created_at"`
}

// 更新任务请求
type UpdateTaskRequest struct {
    Title       *string   `json:"title" binding:"omitempty,max=200,min=1"`
    Description *string   `json:"description" binding:"omitempty,max=5000"`
    Priority    *string   `json:"priority" binding:"omitempty,oneof=low medium high"`
    DueDate     *string   `json:"due_date" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
    Tags        *[]string `json:"tags" binding:"omitempty,max=10,dive,max=50"`
}

// 任务列表查询参数
type ListTasksQuery struct {
    Status      string `query:"status" binding:"omitempty,oneof=pending in_progress completed"`
    Priority    string `query:"priority" binding:"omitempty,oneof=low medium high"`
    Tag         string `query:"tag"`
    DueDateFrom string `query:"due_date_from" binding:"omitempty,datetime=2006-01-02"`
    DueDateTo   string `query:"due_date_to" binding:"omitempty,datetime=2006-01-02"`
    Keyword     string `query:"keyword" binding:"omitempty,max=100"`
    SortBy      string `query:"sort_by" binding:"omitempty,oneof=created_at due_date priority"`
    SortOrder   string `query:"sort_order" binding:"omitempty,oneof=asc desc"`
    Page        int    `query:"page" binding:"omitempty,min=1"`
    Limit       int    `query:"limit" binding:"omitempty,min=1,max=100"`
}
```

---

## 4. 业务逻辑实现

### 4.1 Service 层设计

```go
// service/task_service.go

type TaskService struct {
    taskRepo repository.TaskRepository
    eventBus events.EventBus
}

// CreateTask 创建任务
func (s *TaskService) CreateTask(ctx context.Context, input CreateTaskInput) (*CreateTaskOutput, error) {
    // 1. 验证输入
    if err := s.validateCreateInput(input); err != nil {
        return nil, err
    }
    
    // 2. 生成任务 ID
    taskID := generateTaskID()
    
    // 3. 创建任务实体
    task := model.NewTask(taskID, input.Title, input.Description, ...)
    
    // 4. 保存任务
    if err := s.taskRepo.Create(ctx, task); err != nil {
        return nil, fmt.Errorf("failed to save task: %w", err)
    }
    
    // 5. 发布事件
    s.eventBus.Publish(ctx, events.TaskCreated{TaskID: taskID, ...})
    
    return &CreateTaskOutput{Task: task}, nil
}

// UpdateTask 更新任务
func (s *TaskService) UpdateTask(ctx context.Context, input UpdateTaskInput) (*UpdateTaskOutput, error) {
    // 1. 获取任务
    task, err := s.taskRepo.GetByID(ctx, input.TaskID)
    if err != nil {
        return nil, fmt.Errorf("TASK_NOT_FOUND: %w", err)
    }
    
    // 2. 检查状态
    if task.Status == model.TaskStatusCompleted {
        return nil, fmt.Errorf("TASK_ALREADY_COMPLETED: completed task cannot be updated")
    }
    
    // 3. 更新字段
    if input.Title != nil {
        task.Title = *input.Title
    }
    // ... 其他字段
    
    // 4. 保存
    if err := s.taskRepo.Update(ctx, task); err != nil {
        return nil, fmt.Errorf("UPDATE_FAILED: %w", err)
    }
    
    // 5. 发布事件
    s.eventBus.Publish(ctx, events.TaskUpdated{TaskID: task.ID, ...})
    
    return &UpdateTaskOutput{Task: task}, nil
}
```

### 4.2 Repository 层设计

```go
// repository/task_repo.go

type TaskRepository struct {
    db *sql.DB
}

func (r *TaskRepository) Create(ctx context.Context, task *model.Task) error {
    query := `
        INSERT INTO tasks (id, title, description, status, priority, due_date, tags, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    tagsJSON, _ := json.Marshal(task.Tags)
    _, err := r.db.ExecContext(ctx, query,
        task.ID, task.Title, task.Description, task.Status, task.Priority,
        task.DueDate, tagsJSON, task.CreatedAt, task.UpdatedAt,
    )
    return err
}

func (r *TaskRepository) GetByID(ctx context.Context, id string) (*model.Task, error) {
    query := `SELECT id, title, description, status, priority, due_date, tags, created_at, updated_at, completed_at FROM tasks WHERE id = $1`
    // ... 实现
}

func (r *TaskRepository) List(ctx context.Context, filter *TaskFilter) ([]*model.Task, int, error) {
    // 构建动态查询
    // ... 实现
}
```

---

## 5. 错误处理

### 5.1 错误码定义

```go
// errors/task_errors.go

const (
    ErrTaskTitleEmpty        = "TASK_TITLE_EMPTY"
    ErrTaskDescriptionTooLong = "TASK_DESCRIPTION_TOO_LONG"
    ErrInvalidPriority       = "INVALID_PRIORITY"
    ErrInvalidDueDate        = "INVALID_DUE_DATE"
    ErrTooManyTags           = "TOO_MANY_TAGS"
    ErrTaskNotFound          = "TASK_NOT_FOUND"
    ErrTaskAlreadyCompleted  = "TASK_ALREADY_COMPLETED"
    ErrCreationFailed        = "CREATION_FAILED"
    ErrUpdateFailed          = "UPDATE_FAILED"
    ErrCompletionFailed      = "COMPLETION_FAILED"
    ErrDeletionFailed        = "DELETION_FAILED"
)
```

### 5.2 错误响应格式

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "任务不存在",
    "details": {}
  }
}
```

---

## 6. 测试策略

### 6.1 单元测试

- **Service 层测试**: 测试业务逻辑，mock Repository
- **Repository 层测试**: 使用测试数据库
- **Handler 层测试**: 测试 HTTP 适配，mock Service

### 6.2 集成测试

- API 端到端测试
- 数据库操作测试
- 错误场景测试

### 6.3 测试覆盖率目标

- Service 层: > 90%
- Repository 层: > 80%
- Handler 层: > 70%
- 整体: > 80%

---

## 7. 性能优化

### 7.1 数据库优化

- 使用索引（status, priority, due_date, created_at）
- 查询优化（避免 N+1 查询）
- 分页查询优化

### 7.2 缓存策略

- 任务详情缓存（Redis，TTL 5 分钟）
- 任务列表缓存（可选）

---

## 8. 实现步骤

### Phase 1: 基础功能（已完成）
- [x] 数据库表结构设计
- [x] 领域模型实现
- [x] Repository 实现
- [x] Service 实现
- [x] Handler 实现
- [x] API 路由注册

### Phase 2: 高级功能（已完成）
- [x] 任务列表筛选
- [x] 任务列表排序
- [x] 任务列表分页
- [x] 关键词搜索

### Phase 3: 优化（已完成）
- [x] 错误处理完善
- [x] 单元测试
- [x] 集成测试
- [x] 性能优化

---

## 9. 验收标准

### 9.1 功能验收
- ✅ 所有 API 端点正常工作
- ✅ 所有业务规则正确执行
- ✅ 错误处理正确

### 9.2 质量验收
- ✅ 单元测试覆盖率 > 80%
- ✅ 集成测试通过
- ✅ 代码通过 lint 检查
- ✅ API 响应时间 < 200ms

---

## 10. 参考资料

- [Task Domain Specification](../specs/task-management.spec.md)
- [Task Domain usecases.yaml](../../backend/domains/task/usecases.yaml)
- [Hertz Framework Documentation](https://www.cloudwego.io/zh/docs/hertz/)

