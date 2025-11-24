# User Domain Events (用户领域事件)

> 本文档定义了 User 领域的所有领域事件

---

## 事件概述

领域事件（Domain Events）用于通知系统中其他部分"用户领域发生了什么"。

### 事件命名规范
- 使用过去时态（UserCreated, not UserCreate）
- 以领域名称开头（User...）
- 描述已经发生的事实

### 事件传播
- 使用事件总线（Event Bus）发布
- 其他领域可订阅感兴趣的事件
- 支持异步处理

---

## 1. UserCreated (用户创建事件)

### 触发时机
用户注册成功，用户记录已保存到数据库

### Payload
```go
type UserCreatedEvent struct {
    UserID      string    `json:"user_id"`
    Email       string    `json:"email"`
    Username    string    `json:"username,omitempty"`
    Status      string    `json:"status"`      // "inactive"
    CreatedAt   time.Time `json:"created_at"`
    Timestamp   time.Time `json:"timestamp"`   // 事件发生时间
}
```

### 订阅者（潜在）
- **Email Service** - 发送欢迎邮件和验证链接
- **Analytics Service** - 记录新用户指标
- **Notification Service** - 通知管理员（如启用）

### 使用场景
```go
// 用户注册成功后
eventBus.Publish(ctx, UserCreatedEvent{
    UserID:    user.ID,
    Email:     user.Email,
    Username:  user.Username,
    Status:    string(user.Status),
    CreatedAt: user.CreatedAt,
    Timestamp: time.Now(),
})
```

---

## 2. UserUpdated (用户资料更新事件)

### 触发时机
用户更新个人资料（用户名、全名、头像等）

### Payload
```go
type UserUpdatedEvent struct {
    UserID       string            `json:"user_id"`
    UpdatedFields map[string]interface{} `json:"updated_fields"`  // 哪些字段被更新
    UpdatedAt    time.Time         `json:"updated_at"`
    Timestamp    time.Time         `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Cache Service** - 清除用户缓存
- **Search Service** - 更新用户搜索索引
- **Audit Service** - 记录变更日志

### 使用场景
```go
// 用户资料更新后
eventBus.Publish(ctx, UserUpdatedEvent{
    UserID: user.ID,
    UpdatedFields: map[string]interface{}{
        "username": newUsername,
        "full_name": newFullName,
    },
    UpdatedAt: user.UpdatedAt,
    Timestamp: time.Now(),
})
```

---

## 3. PasswordChanged (密码修改事件)

### 触发时机
用户成功修改密码

### Payload
```go
type PasswordChangedEvent struct {
    UserID      string    `json:"user_id"`
    Email       string    `json:"email"`
    ChangedAt   time.Time `json:"changed_at"`
    Timestamp   time.Time `json:"timestamp"`
    IPAddress   string    `json:"ip_address,omitempty"`  // 操作来源 IP
}
```

### 订阅者（潜在）
- **Email Service** - 发送密码修改通知邮件
- **Auth Service** - 撤销所有现有 JWT Token
- **Security Service** - 记录安全日志

### 安全注意
- ⚠️ **不要**包含密码或密码哈希
- ✅ 包含 IP 地址用于安全审计

### 使用场景
```go
// 密码修改成功后
eventBus.Publish(ctx, PasswordChangedEvent{
    UserID:    user.ID,
    Email:     user.Email,
    ChangedAt: time.Now(),
    Timestamp: time.Now(),
    IPAddress: clientIP,
})
```

---

## 4. UserActivated (用户激活事件)

### 触发时机
用户邮箱验证成功，状态从 `Inactive` 变为 `Active`

### Payload
```go
type UserActivatedEvent struct {
    UserID       string    `json:"user_id"`
    Email        string    `json:"email"`
    ActivatedAt  time.Time `json:"activated_at"`
    Timestamp    time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Email Service** - 发送激活成功邮件
- **Analytics Service** - 统计激活率
- **Marketing Service** - 触发欢迎流程

### 使用场景
```go
// 邮箱验证成功后
eventBus.Publish(ctx, UserActivatedEvent{
    UserID:      user.ID,
    Email:       user.Email,
    ActivatedAt: time.Now(),
    Timestamp:   time.Now(),
})
```

---

## 5. UserDeactivated (用户禁用事件)

### 触发时机
管理员禁用用户账户，状态变为 `Banned`

### Payload
```go
type UserDeactivatedEvent struct {
    UserID         string    `json:"user_id"`
    Email          string    `json:"email"`
    DeactivatedBy  string    `json:"deactivated_by"`  // 操作管理员 ID
    Reason         string    `json:"reason,omitempty"`
    DeactivatedAt  time.Time `json:"deactivated_at"`
    Timestamp      time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Email Service** - 通知用户账户被禁用
- **Auth Service** - 撤销所有 Token
- **Audit Service** - 记录管理操作

### 使用场景
```go
// 管理员禁用用户后
eventBus.Publish(ctx, UserDeactivatedEvent{
    UserID:        user.ID,
    Email:         user.Email,
    DeactivatedBy: adminID,
    Reason:        "违反社区规则",
    DeactivatedAt: time.Now(),
    Timestamp:     time.Now(),
})
```

---

## 6. UserDeleted (用户删除事件)

### 触发时机
用户账户被删除（软删除或硬删除）

### Payload
```go
type UserDeletedEvent struct {
    UserID     string    `json:"user_id"`
    Email      string    `json:"email"`
    DeletedBy  string    `json:"deleted_by"`   // 用户自己 or 管理员
    DeletedAt  time.Time `json:"deleted_at"`
    Timestamp  time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Data Cleanup Service** - 清理用户关联数据
- **Email Service** - 发送确认邮件
- **Analytics Service** - 统计流失率

### 注意事项
- 确保级联删除或匿名化关联数据
- 遵守 GDPR 等隐私法规

---

## 7. EmailVerificationRequested (邮箱验证请求事件)

### 触发时机
用户请求发送邮箱验证链接

### Payload
```go
type EmailVerificationRequestedEvent struct {
    UserID          string    `json:"user_id"`
    Email           string    `json:"email"`
    VerificationURL string    `json:"verification_url"`
    ExpiresAt       time.Time `json:"expires_at"`
    Timestamp       time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Email Service** - 发送验证邮件

### 使用场景
```go
// 用户注册或重新请求验证时
eventBus.Publish(ctx, EmailVerificationRequestedEvent{
    UserID:          user.ID,
    Email:           user.Email,
    VerificationURL: verifyURL,
    ExpiresAt:       time.Now().Add(24 * time.Hour),
    Timestamp:       time.Now(),
})
```

---

## 8. PasswordResetRequested (密码重置请求事件)

### 触发时机
用户请求重置密码（忘记密码）

### Payload
```go
type PasswordResetRequestedEvent struct {
    UserID    string    `json:"user_id"`
    Email     string    `json:"email"`
    ResetURL  string    `json:"reset_url"`
    ExpiresAt time.Time `json:"expires_at"`
    Timestamp time.Time `json:"timestamp"`
    IPAddress string    `json:"ip_address,omitempty"`
}
```

### 订阅者（潜在）
- **Email Service** - 发送密码重置邮件
- **Security Service** - 记录重置请求（防止滥用）

### 安全注意
- 重置链接有效期：1 小时
- 记录 IP 地址防止暴力攻击

---

## 9. LoginSucceeded (登录成功事件)

### 触发时机
用户成功登录

### Payload
```go
type LoginSucceededEvent struct {
    UserID     string    `json:"user_id"`
    Email      string    `json:"email"`
    LoginAt    time.Time `json:"login_at"`
    IPAddress  string    `json:"ip_address,omitempty"`
    UserAgent  string    `json:"user_agent,omitempty"`
    Timestamp  time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Analytics Service** - 统计活跃用户
- **Security Service** - 检测异常登录（如异地登录）

---

## 10. LoginFailed (登录失败事件)

### 触发时机
用户登录失败（邮箱或密码错误）

### Payload
```go
type LoginFailedEvent struct {
    Email      string    `json:"email"`
    Reason     string    `json:"reason"`       // "invalid_email" or "invalid_password"
    FailedAt   time.Time `json:"failed_at"`
    IPAddress  string    `json:"ip_address,omitempty"`
    Timestamp  time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）
- **Security Service** - 检测暴力破解攻击
- **Rate Limiter** - 限制失败次数

### 安全注意
- 不泄露是邮箱还是密码错误
- 记录 IP 用于封禁

---

## 事件总线实现

### 当前实现
使用内存事件总线（In-Memory Event Bus）：
```go
// domains/shared/events/bus.go
type EventBus interface {
    Publish(ctx context.Context, event Event) error
    Subscribe(eventType string, handler EventHandler) error
}
```

### 扩展点
未来可升级为：
- **Kafka** - 高吞吐量、持久化
- **Redis Pub/Sub** - 简单、快速
- **RabbitMQ** - 可靠消息队列

---

## 事件版本控制

### Payload 版本化
```go
type UserCreatedEvent struct {
    Version   int       `json:"version"`   // 事件版本号
    UserID    string    `json:"user_id"`
    // ...
}
```

### 向后兼容
- 添加新字段时使用 `omitempty`
- 不删除现有字段
- 字段重命名时保留旧字段

---

## 事件监控

### 指标
- 事件发布数量（按类型）
- 事件处理延迟
- 事件处理失败率

### 日志
```go
logger.Info("Event published",
    zap.String("event_type", "UserCreated"),
    zap.String("user_id", userID),
    zap.Time("timestamp", time.Now()),
)
```

---

## 参考资料

- [用例定义](./usecases.yaml)
- [领域术语](./glossary.md)
- [业务规则](./rules.md)
- [README](./README.md)
- [Event Bus 实现](../shared/events/bus.go)

