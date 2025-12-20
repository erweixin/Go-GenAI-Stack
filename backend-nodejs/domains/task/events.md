# Task Domain Events (任务领域事件)

> 本文档定义了 Task 领域发布的所有领域事件

**最后更新**：2025-11-23

---

## 📋 事件概述

领域事件是领域内发生的重要业务事实。本领域发布以下事件：

| 事件名称 | 触发时机 | 消费者 | 优先级 |
|---------|---------|-------|--------|
| TaskCreated | 任务创建成功后 | Analytics, Notification | 🟢 Normal |
| TaskUpdated | 任务更新成功后 | Analytics | 🟡 Low |
| TaskCompleted | 任务完成后 | Analytics, Achievement | 🔵 High |
| TaskDeleted | 任务删除后 | Analytics | 🟢 Normal |
| TaskStatusChanged | 任务状态变更后 | Notification | 🟢 Normal |
| TaskPriorityChanged | 优先级变更后 | Notification | 🟡 Low |

---

## 事件详情

### TaskCreated（任务创建）

**事件 ID**：`task.created`

**触发时机**：任务成功创建后

**发布位置**：`CreateTaskHandler` → `repository.Create()` 之后

**事件数据**：
```go
type TaskCreatedEvent struct {
    EventID     string    `json:"event_id"`      // 事件 ID (UUID)
    TaskID      string    `json:"task_id"`       // 任务 ID
    Title       string    `json:"title"`         // 任务标题
    Priority    string    `json:"priority"`      // 优先级 (low/medium/high)
    DueDate     *string   `json:"due_date"`      // 截止日期 (ISO 8601)
    Tags        []string  `json:"tags"`          // 标签列表
    CreatedAt   time.Time `json:"created_at"`    // 创建时间
    CreatedBy   string    `json:"created_by"`    // 创建者 (未实现)
}
```

**消费者**：
1. **Analytics Service**（分析服务）
   - 记录任务创建指标
   - 统计每日任务数

2. **Notification Service**（通知服务，未实现）
   - 发送任务创建通知

**幂等性**：
- 使用 EventID 保证幂等性
- 消费者应该记录已处理的 EventID

**示例代码**：
```go
// 发布事件
event := &events.TaskCreatedEvent{
    EventID:   generateEventID(),
    TaskID:    task.ID,
    Title:     task.Title,
    Priority:  string(task.Priority),
    CreatedAt: task.CreatedAt,
}

eventBus.Publish(ctx, "task.created", event)
```

**重试策略**：
- 最多重试 3 次
- 指数退避（1s, 2s, 4s）
- 失败后记录到死信队列

---

### TaskUpdated（任务更新）

**事件 ID**：`task.updated`

**触发时机**：任务字段更新后

**发布位置**：`UpdateTaskHandler` → `repository.Update()` 之后

**事件数据**：
```go
type TaskUpdatedEvent struct {
    EventID     string            `json:"event_id"`
    TaskID      string            `json:"task_id"`
    UpdatedFields map[string]interface{} `json:"updated_fields"`  // 变更的字段
    UpdatedAt   time.Time         `json:"updated_at"`
    UpdatedBy   string            `json:"updated_by"`  // 更新者 (未实现)
}
```

**UpdatedFields 示例**：
```json
{
    "title": {
        "old": "完成报告",
        "new": "完成季度报告"
    },
    "priority": {
        "old": "medium",
        "new": "high"
    }
}
```

**消费者**：
1. **Analytics Service**
   - 记录任务更新频率
   - 分析常修改的字段

**优化建议**：
- 低优先级事件，可以批量处理
- 可以按需订阅（只订阅特定字段的变更）

---

### TaskCompleted（任务完成）

**事件 ID**：`task.completed`

**触发时机**：任务状态变更为 Completed 后

**发布位置**：`CompleteTaskHandler` → `repository.Update()` 之后

**事件数据**：
```go
type TaskCompletedEvent struct {
    EventID     string    `json:"event_id"`
    TaskID      string    `json:"task_id"`
    Title       string    `json:"title"`
    Priority    string    `json:"priority"`
    CompletedAt time.Time `json:"completed_at"`
    Duration    int       `json:"duration_seconds"`  // 任务耗时（秒）
    IsOnTime    bool      `json:"is_on_time"`        // 是否按时完成
}
```

**Duration 计算**：
```go
duration := task.CompletedAt.Sub(task.CreatedAt).Seconds()
```

**IsOnTime 判断**：
```go
isOnTime := task.DueDate == nil || task.CompletedAt.Before(task.DueDate)
```

**消费者**：
1. **Analytics Service**
   - 统计完成率
   - 分析任务完成时间分布
   - 计算平均耗时

2. **Achievement Service**（成就系统，未实现）
   - 解锁成就（如"连续完成 7 天任务"）
   - 计算生产力分数

3. **Notification Service**
   - 发送完成通知
   - 如果逾期完成，发送提醒

**业务价值**：
- ✅ 高价值事件，重要的业务里程碑
- ✅ 可用于计算 KPI（如任务完成率）

---

### TaskDeleted（任务删除）

**事件 ID**：`task.deleted`

**触发时机**：任务删除后

**发布位置**：`DeleteTaskHandler` → `repository.Delete()` 之后

**事件数据**：
```go
type TaskDeletedEvent struct {
    EventID   string    `json:"event_id"`
    TaskID    string    `json:"task_id"`
    Title     string    `json:"title"`
    Status    string    `json:"status"`       // 删除时的状态
    DeletedAt time.Time `json:"deleted_at"`
    DeletedBy string    `json:"deleted_by"`   // 删除者 (未实现)
    Reason    string    `json:"reason"`       // 删除原因 (可选)
}
```

**消费者**：
1. **Analytics Service**
   - 记录删除统计
   - 分析删除原因

2. **Cleanup Service**（清理服务，未实现）
   - 清理相关的附件、评论等

**软删除 vs 硬删除**：
- **软删除**：设置 DeletedAt 字段，不发布事件
- **硬删除**：物理删除记录，发布事件

---

### TaskStatusChanged（任务状态变更）

**事件 ID**：`task.status_changed`

**触发时机**：任务状态变更后（包括完成）

**发布位置**：状态变更的 handler 中

**事件数据**：
```go
type TaskStatusChangedEvent struct {
    EventID   string    `json:"event_id"`
    TaskID    string    `json:"task_id"`
    OldStatus string    `json:"old_status"`  // pending/in_progress/completed
    NewStatus string    `json:"new_status"`
    ChangedAt time.Time `json:"changed_at"`
}
```

**状态转换**：
```
pending → in_progress  (StartTask)
pending → completed    (CompleteTask)
in_progress → completed (CompleteTask)
```

**消费者**：
1. **Notification Service**
   - 状态变更通知
   - 团队成员可见性

**关系**：
- TaskStatusChanged 是更通用的事件
- TaskCompleted 是专门针对完成状态的事件
- 两者可以同时发布

---

### TaskPriorityChanged（优先级变更）

**事件 ID**：`task.priority_changed`

**触发时机**：优先级更新后

**发布位置**：`UpdateTaskHandler` → priority 字段变更时

**事件数据**：
```go
type TaskPriorityChangedEvent struct {
    EventID     string    `json:"event_id"`
    TaskID      string    `json:"task_id"`
    OldPriority string    `json:"old_priority"`  // low/medium/high
    NewPriority string    `json:"new_priority"`
    ChangedAt   time.Time `json:"changed_at"`
    Reason      string    `json:"reason"`  // 变更原因 (可选)
}
```

**消费者**：
1. **Notification Service**
   - 优先级提升通知（如 low → high）

**触发条件**：
- 仅当优先级实际变化时发布
- 从 medium → medium 不发布事件

---

## 事件总线

### 实现方式

**当前**：
- 使用内存事件总线（`domains/shared/events/bus.go`）
- 同步发布和消费

**扩展点**：
- 可以切换到 Redis Pub/Sub
- 可以切换到 Kafka
- 可以切换到 RabbitMQ

### 事件发布示例

```go
// 在 handler 中发布事件
func (s *HandlerService) CreateTaskHandler(ctx context.Context, c *app.RequestContext) {
    // ... 创建任务逻辑
    
    // 发布事件
    event := &events.TaskCreatedEvent{
        EventID:   uuid.New().String(),
        TaskID:    task.ID,
        Title:     task.Title,
        Priority:  string(task.Priority),
        CreatedAt: task.CreatedAt,
    }
    
    // Extension point: 发布到事件总线
    // eventBus.Publish(ctx, "task.created", event)
    
    // 当前：记录日志
    log.Printf("Event: task.created, TaskID: %s", task.ID)
}
```

### 事件消费示例

```go
// 在 Analytics Service 中消费事件
func (s *AnalyticsService) HandleTaskCreated(ctx context.Context, event *events.TaskCreatedEvent) error {
    // 记录指标
    s.metricsCollector.Increment("tasks.created.total")
    s.metricsCollector.Gauge("tasks.created.by_priority", 1, map[string]string{
        "priority": event.Priority,
    })
    
    return nil
}
```

---

## 事件版本管理

### 版本化策略

**问题**：事件结构变更如何兼容？

**解决方案**：
1. **版本号**：在事件中添加 `version` 字段
2. **向后兼容**：只添加字段，不删除字段
3. **多版本并存**：同时支持 v1 和 v2

**示例**：
```go
type TaskCreatedEvent struct {
    Version   string  `json:"version"`  // "v1", "v2"
    EventID   string  `json:"event_id"`
    // ... 其他字段
    
    // v2 新增字段
    Category  *string `json:"category,omitempty"`  // 使用指针表示可选
}
```

---

## 事件存储（未实现）

**Event Sourcing**：
- 将所有事件存储到事件库
- 可以重放事件重建状态
- 提供完整的审计日志

**表结构**：
```sql
CREATE TABLE domain_events (
    event_id      UUID PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    aggregate_id  VARCHAR(100) NOT NULL,  -- TaskID
    aggregate_type VARCHAR(50) NOT NULL,   -- "Task"
    event_data    JSONB NOT NULL,
    occurred_at   TIMESTAMP NOT NULL,
    version       INTEGER NOT NULL
);
```

---

## 监控和告警

### 事件指标

应该监控的指标：
- 事件发布速率（events/sec）
- 事件处理延迟（ms）
- 事件失败率（%）
- 死信队列大小

### 告警规则

- 🔴 事件失败率 > 5%
- 🟡 事件处理延迟 > 5s
- 🔴 死信队列积压 > 1000

---

## 测试

### 事件测试清单

- [ ] 测试事件发布（是否正确发布）
- [ ] 测试事件格式（JSON 序列化）
- [ ] 测试事件消费（消费者是否正确处理）
- [ ] 测试事件幂等性（重复消费不会出错）
- [ ] 测试事件失败重试
- [ ] 测试事件顺序（如果需要）

### 测试示例

```go
func TestTaskCreatedEvent_Published(t *testing.T) {
    // 创建 mock 事件总线
    eventBus := NewMockEventBus()
    
    // 创建任务
    handler := NewHandlerService(repo, eventBus)
    handler.CreateTaskHandler(ctx, req)
    
    // 验证事件被发布
    events := eventBus.GetPublishedEvents("task.created")
    assert.Equal(t, 1, len(events))
    
    // 验证事件数据
    event := events[0].(*TaskCreatedEvent)
    assert.Equal(t, "Test Task", event.Title)
}
```

---

## 最佳实践

### DO（推荐）

- ✅ 事件名称使用过去时（TaskCreated 而非 CreateTask）
- ✅ 事件数据包含时间戳
- ✅ 事件 ID 使用 UUID 保证唯一性
- ✅ 事件数据尽量小（避免包含大对象）
- ✅ 异步处理事件（不阻塞主流程）
- ✅ 事件消费要幂等
- ✅ 记录事件处理日志

### DON'T（避免）

- ❌ 不要在事件中包含敏感信息（密码、Token）
- ❌ 不要在事件中包含可变的数据（URL、配置）
- ❌ 不要依赖事件的顺序（除非使用有序队列）
- ❌ 不要在事件处理中调用同步 API
- ❌ 不要在事件处理中抛出异常（应该捕获并记录）

---

**维护说明**：
- 添加新事件时，更新本文档
- 事件结构变更应该版本化
- 定期审查事件消费者
- 监控事件处理性能

**最后更新**：2025-11-23

