# Application 层（跨领域编排）扩展指南

> 📌 **重要提示**：Application 层是**高级扩展**，仅在需要跨领域编排时才添加。
> 
> **单领域操作不需要 Application 层**，直接在 Handler 中调用 Repository 即可。

---

## 📖 什么是 Application 层？

**Application 层**（应用层）负责编排多个领域之间的交互，实现跨领域的业务流程。

### 职责

- ✅ **编排领域服务**：协调多个领域完成复杂业务流程
- ✅ **事务管理**：管理跨领域的事务边界
- ✅ **适配外部接口**：将 HTTP 请求适配到领域操作
- ✅ **数据组合**：组合多个领域的数据返回给客户端

### 不属于 Application 层

- ❌ 业务逻辑实现（属于 Domain Layer）
- ❌ 技术基础设施（属于 Infrastructure Layer）
- ❌ HTTP 路由和中间件（属于 HTTP Layer）

---

## 🤔 何时需要 Application 层？

### ❌ 不需要（单领域操作）

**场景**：只涉及一个领域的操作

```go
// ❌ 不需要 Application 层
// domains/task/handlers/create_task.handler.go
func CreateTaskHandler(service *HandlerService) app.HandlerFunc {
    return func(ctx context.Context, c *app.RequestContext) {
        // 直接调用 Repository
        task, err := service.taskRepo.Create(ctx, ...)
        c.JSON(200, task)
    }
}
```

**特点**：
- 只操作 Task 领域
- 不涉及其他领域
- 业务逻辑简单清晰

### ✅ 需要（跨领域编排）

**场景 1：创建任务并发送通知**

涉及领域：
1. **Task 领域**：创建任务
2. **User 领域**：获取用户信息
3. **Notification 领域**：发送通知

```go
// ✅ 需要 Application 层编排
// application/services/task_orchestrator.go
type TaskOrchestrator struct {
    taskRepo    repository.TaskRepository      // Task 领域
    userService *user.Service                  // User 领域
    notifyService *notification.Service        // Notification 领域
}

func (o *TaskOrchestrator) CreateTaskWithNotification(ctx context.Context, req *CreateTaskRequest) error {
    // 1. Task Domain: 创建任务
    task, err := o.taskRepo.Create(ctx, ...)
    if err != nil {
        return err
    }
    
    // 2. User Domain: 获取用户信息
    user, err := o.userService.GetUser(ctx, req.UserID)
    if err != nil {
        return err
    }
    
    // 3. Notification Domain: 发送通知
    err = o.notifyService.Send(ctx, &notification.SendRequest{
        UserID:  user.ID,
        Email:   user.Email,
        Subject: "新任务已创建",
        Body:    fmt.Sprintf("任务 '%s' 已创建", task.Title),
    })
    if err != nil {
        // 记录日志但不中断
        log.Printf("Failed to send notification: %v", err)
    }
    
    return nil
}
```

**场景 2：订单支付流程**

涉及领域：
1. **Order 领域**：创建订单
2. **Inventory 领域**：扣减库存
3. **Payment 领域**：处理支付
4. **Notification 领域**：发送确认邮件

```go
// application/services/order_orchestrator.go
func (o *OrderOrchestrator) PlaceOrder(ctx context.Context, req *PlaceOrderRequest) (*PlaceOrderResponse, error) {
    // 1. Order: 创建订单
    order, err := o.orderRepo.Create(ctx, ...)
    
    // 2. Inventory: 扣减库存（带补偿）
    err = o.inventoryService.Reserve(ctx, order.Items)
    if err != nil {
        // 补偿：取消订单
        o.orderRepo.Cancel(ctx, order.ID)
        return nil, err
    }
    
    // 3. Payment: 处理支付（带补偿）
    payment, err := o.paymentService.Charge(ctx, order.TotalAmount)
    if err != nil {
        // 补偿：释放库存 + 取消订单
        o.inventoryService.Release(ctx, order.Items)
        o.orderRepo.Cancel(ctx, order.ID)
        return nil, err
    }
    
    // 4. Notification: 发送确认邮件
    o.notificationService.Send(ctx, ...)
    
    return &PlaceOrderResponse{OrderID: order.ID}, nil
}
```

---

## 🏗️ 如何实现 Application 层？

### 步骤 1：创建目录结构

```bash
mkdir -p backend/application/services
mkdir -p backend/application/dto
```

目录结构：

```
backend/application/
├── services/              # 应用服务（编排多个领域）
│   ├── task_orchestrator.go
│   └── order_orchestrator.go
├── dto/                   # 应用层 DTO（可能组合多个领域）
│   └── orchestration.go
└── README.md
```

### 步骤 2：定义应用服务

```go
// application/services/task_orchestrator.go
package services

import (
    "context"
    
    taskrepo "github.com/erweixin/go-genai-stack/domains/task/repository"
    userservice "github.com/erweixin/go-genai-stack/domains/user"
    notifyservice "github.com/erweixin/go-genai-stack/domains/notification"
)

// TaskOrchestrator 任务编排服务
//
// 职责：编排 Task、User、Notification 三个领域
type TaskOrchestrator struct {
    taskRepo      taskrepo.TaskRepository
    userService   *userservice.Service
    notifyService *notifyservice.Service
}

// NewTaskOrchestrator 创建任务编排服务
func NewTaskOrchestrator(
    taskRepo taskrepo.TaskRepository,
    userService *userservice.Service,
    notifyService *notifyservice.Service,
) *TaskOrchestrator {
    return &TaskOrchestrator{
        taskRepo:      taskRepo,
        userService:   userService,
        notifyService: notifyService,
    }
}

// CreateTaskWithNotification 创建任务并发送通知
//
// 编排流程：
// 1. 创建任务（Task Domain）
// 2. 获取用户信息（User Domain）
// 3. 发送通知（Notification Domain）
func (o *TaskOrchestrator) CreateTaskWithNotification(
    ctx context.Context,
    req *CreateTaskWithNotificationRequest,
) (*CreateTaskWithNotificationResponse, error) {
    // 实现编排逻辑
    // ...
}
```

### 步骤 3：在 Handler 中调用应用服务

```go
// domains/task/handlers/create_task_with_notification.handler.go
package handlers

import (
    "context"
    
    "github.com/cloudwego/hertz/pkg/app"
    "github.com/erweixin/go-genai-stack/application/services"
)

// CreateTaskWithNotificationHandler 创建任务并发送通知
//
// 这是一个跨领域操作，需要调用 Application 层的编排服务
func CreateTaskWithNotificationHandler(orchestrator *services.TaskOrchestrator) app.HandlerFunc {
    return func(ctx context.Context, c *app.RequestContext) {
        var req dto.CreateTaskWithNotificationRequest
        if err := c.BindAndValidate(&req); err != nil {
            c.JSON(400, map[string]interface{}{"error": err.Error()})
            return
        }
        
        // 调用 Application 层编排服务
        resp, err := orchestrator.CreateTaskWithNotification(ctx, &req)
        if err != nil {
            c.JSON(500, map[string]interface{}{"error": err.Error()})
            return
        }
        
        c.JSON(200, resp)
    }
}
```

### 步骤 4：依赖注入

在 `infrastructure/bootstrap/dependencies.go` 中注入：

```go
// InitDependencies 初始化应用依赖
func InitDependencies(
    dbConn *postgres.Connection,
    redisConn *redis.Connection,
) *AppContainer {
    db := dbConn.DB()
    
    // 1. 初始化各领域 Repository
    taskRepo := taskrepo.NewTaskRepository(db)
    userRepo := userrepo.NewUserRepository(db)
    
    // 2. 初始化各领域 Service
    userService := userservice.NewService(userRepo)
    notifyService := notifyservice.NewService(redisConn)
    
    // 3. 初始化 Application 层编排服务
    taskOrchestrator := appservices.NewTaskOrchestrator(
        taskRepo,
        userService,
        notifyService,
    )
    
    return &AppContainer{
        TaskOrchestrator: taskOrchestrator,
    }
}
```

---

## 📝 最佳实践

### ✅ 应该做的

1. **编排，不实现**
   - Application 层只编排，不实现业务逻辑
   - 业务规则放在领域层

2. **事务边界**
   - 在 Application 层管理跨领域事务
   - 使用 Saga 模式处理分布式事务

3. **薄层原则**
   - Application 层应该保持简单
   - 复杂逻辑放在领域层

4. **依赖注入**
   - 通过构造函数注入领域服务
   - 不要在 Application 层创建领域对象

### ❌ 不应该做的

1. **不要在 Application 层实现业务规则**
   ```go
   // ❌ 错误：业务规则在 Application 层
   func (o *TaskOrchestrator) CreateTask(...) {
       if task.Priority == "high" && task.DueDate < time.Now() {
           // 这是业务规则，应该在 Domain Layer
       }
   }
   
   // ✅ 正确：业务规则在 Domain Layer
   // domains/task/model/task.go
   func (t *Task) Validate() error {
       if t.Priority == "high" && t.DueDate.Before(time.Now()) {
           return errors.New("high priority task cannot have past due date")
       }
       return nil
   }
   ```

2. **不要直接访问数据库**
   ```go
   // ❌ 错误：直接访问数据库
   func (o *TaskOrchestrator) CreateTask(...) {
       o.db.Exec("INSERT INTO tasks ...")
   }
   
   // ✅ 正确：通过领域的仓储接口
   func (o *TaskOrchestrator) CreateTask(...) {
       o.taskRepo.Create(...)
   }
   ```

3. **不要跨领域直接调用**
   ```go
   // ❌ 错误：跨领域直接调用
   func (o *TaskOrchestrator) CreateTask(...) {
       // 直接调用另一个领域的 Repository
       user := o.userRepo.FindByID(...)
   }
   
   // ✅ 正确：通过领域的 Service
   func (o *TaskOrchestrator) CreateTask(...) {
       user := o.userService.GetUser(...)
   }
   ```

---

## 🧪 测试应用层

```go
// application/services/task_orchestrator_test.go
package services

import (
    "context"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

// MockTaskRepository Mock 实现
type MockTaskRepository struct {
    mock.Mock
}

func (m *MockTaskRepository) Create(ctx context.Context, task *model.Task) error {
    args := m.Called(ctx, task)
    return args.Error(0)
}

// MockUserService Mock 实现
type MockUserService struct {
    mock.Mock
}

func (m *MockUserService) GetUser(ctx context.Context, userID string) (*user.User, error) {
    args := m.Called(ctx, userID)
    return args.Get(0).(*user.User), args.Error(1)
}

func TestTaskOrchestrator_CreateTaskWithNotification(t *testing.T) {
    // Arrange
    mockTaskRepo := new(MockTaskRepository)
    mockUserService := new(MockUserService)
    mockNotifyService := new(MockNotifyService)
    
    orchestrator := NewTaskOrchestrator(mockTaskRepo, mockUserService, mockNotifyService)
    
    // Mock 期望
    mockTaskRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
    mockUserService.On("GetUser", mock.Anything, "user-123").Return(&user.User{
        ID:    "user-123",
        Email: "test@example.com",
    }, nil)
    mockNotifyService.On("Send", mock.Anything, mock.Anything).Return(nil)
    
    // Act
    resp, err := orchestrator.CreateTaskWithNotification(ctx, &CreateTaskWithNotificationRequest{
        UserID: "user-123",
        Title:  "Test Task",
    })
    
    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, resp)
    
    // 验证所有领域服务都被调用
    mockTaskRepo.AssertExpectations(t)
    mockUserService.AssertExpectations(t)
    mockNotifyService.AssertExpectations(t)
}
```

---

## 📚 示例：完整的订单支付流程

```go
// application/services/order_orchestrator.go
package services

import (
    "context"
    "fmt"
    
    orderrepo "github.com/erweixin/go-genai-stack/domains/order/repository"
    inventoryservice "github.com/erweixin/go-genai-stack/domains/inventory"
    paymentservice "github.com/erweixin/go-genai-stack/domains/payment"
    notificationservice "github.com/erweixin/go-genai-stack/domains/notification"
)

type OrderOrchestrator struct {
    orderRepo       orderrepo.OrderRepository
    inventoryService *inventoryservice.Service
    paymentService  *paymentservice.Service
    notifyService   *notificationservice.Service
}

func (o *OrderOrchestrator) PlaceOrder(ctx context.Context, req *PlaceOrderRequest) (*PlaceOrderResponse, error) {
    // 步骤 1: 创建订单（Order Domain）
    order, err := o.orderRepo.Create(ctx, &order.Order{
        UserID:      req.UserID,
        Items:       req.Items,
        TotalAmount: req.TotalAmount,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to create order: %w", err)
    }
    
    // 步骤 2: 扣减库存（Inventory Domain）
    err = o.inventoryService.Reserve(ctx, &inventory.ReserveRequest{
        OrderID: order.ID,
        Items:   order.Items,
    })
    if err != nil {
        // 补偿：取消订单
        _ = o.orderRepo.Cancel(ctx, order.ID)
        return nil, fmt.Errorf("failed to reserve inventory: %w", err)
    }
    
    // 步骤 3: 处理支付（Payment Domain）
    payment, err := o.paymentService.Charge(ctx, &payment.ChargeRequest{
        OrderID: order.ID,
        Amount:  order.TotalAmount,
        Method:  req.PaymentMethod,
    })
    if err != nil {
        // 补偿：释放库存 + 取消订单
        _ = o.inventoryService.Release(ctx, order.ID)
        _ = o.orderRepo.Cancel(ctx, order.ID)
        return nil, fmt.Errorf("failed to charge payment: %w", err)
    }
    
    // 步骤 4: 更新订单状态（Order Domain）
    err = o.orderRepo.UpdateStatus(ctx, order.ID, "paid")
    if err != nil {
        // 这里已经扣款成功，不能轻易回滚，需要人工介入
        // 记录错误日志，触发告警
        return nil, fmt.Errorf("failed to update order status: %w", err)
    }
    
    // 步骤 5: 发送确认邮件（Notification Domain）
    // 这是非关键步骤，失败不影响主流程
    _ = o.notifyService.Send(ctx, &notification.SendRequest{
        UserID:  order.UserID,
        Type:    "order_confirmation",
        Subject: "订单确认",
        Body:    fmt.Sprintf("您的订单 %s 已确认", order.ID),
    })
    
    return &PlaceOrderResponse{
        OrderID:   order.ID,
        PaymentID: payment.ID,
        Status:    "paid",
    }, nil
}
```

---

## 🔗 相关资源

- [Vibe-Coding-Friendly DDD 架构](../Architecture/Vibe-Coding-Friendly.md)
- [领域驱动设计（DDD）](../Architecture/vibe-coding-ddd-structure.md)
- [Task 领域示例](../../backend/domains/task/README.md)

---

## 📋 总结

### 何时使用 Application 层？

| 场景 | 是否需要 Application 层 |
|------|------------------------|
| 单领域 CRUD 操作 | ❌ 不需要（直接在 Handler 中调用 Repository） |
| 单领域业务逻辑 | ❌ 不需要（业务逻辑在 Domain Layer） |
| 跨领域编排 | ✅ 需要（Application 层协调多个领域） |
| 分布式事务 | ✅ 需要（Application 层管理事务边界和补偿） |
| 复杂工作流 | ✅ 需要（Application 层编排多个步骤） |

### 记住

- 🎯 **Application 层是高级扩展**，不是必需的
- 🎯 **保持简单**，只在真正需要时才添加
- 🎯 **编排而非实现**，业务逻辑放在领域层

---

**Happy Coding!** 🚀

