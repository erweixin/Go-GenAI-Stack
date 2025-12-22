# Auth Domain Events (认证领域事件)

> 本文档定义了 Auth 领域的所有领域事件

---

## 事件概述

认证领域的事件主要关注用户的认证行为，如注册、登录、Token 刷新等。

---

## 1. UserRegistered (用户注册事件)

### 触发时机

用户注册成功，用户记录已保存到数据库

### Payload

```go
type UserRegisteredEvent struct {
    UserID      string    `json:"user_id"`
    Email       string    `json:"email"`
    Username    string    `json:"username,omitempty"`
    RegisteredAt time.Time `json:"registered_at"`
    Timestamp    time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Email Service** - 发送欢迎邮件和验证链接
- **Analytics Service** - 记录新用户指标
- **Notification Service** - 通知管理员（如启用）

### 使用场景

```go
// 用户注册成功后
eventBus.Publish(ctx, UserRegisteredEvent{
    UserID:       user.ID,
    Email:        user.Email,
    Username:     user.Username,
    RegisteredAt: user.CreatedAt,
    Timestamp:    time.Now(),
})
```

---

## 2. LoginSucceeded (登录成功事件)

### 触发时机

用户成功登录系统

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
- **Notification Service** - 发送登录通知（可选）

### 安全注意

- 包含 IP 地址和 User Agent 用于安全分析
- 不包含密码或 Token

### 使用场景

```go
// 登录成功后
eventBus.Publish(ctx, LoginSucceededEvent{
    UserID:    user.ID,
    Email:     user.Email,
    LoginAt:   time.Now(),
    IPAddress: c.ClientIP(),
    UserAgent: string(c.UserAgent()),
    Timestamp: time.Now(),
})
```

---

## 3. LoginFailed (登录失败事件)

### 触发时机

用户登录失败（邮箱或密码错误）

### Payload

```go
type LoginFailedEvent struct {
    Email      string    `json:"email"`
    Reason     string    `json:"reason"`       // "invalid_credentials", "user_banned"
    FailedAt   time.Time `json:"failed_at"`
    IPAddress  string    `json:"ip_address,omitempty"`
    UserAgent  string    `json:"user_agent,omitempty"`
    Timestamp  time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Security Service** - 检测暴力破解攻击
- **Rate Limiter** - 限制失败次数

### 安全注意

- 不泄露是邮箱还是密码错误
- 记录 IP 用于封禁

### 使用场景

```go
// 登录失败后
eventBus.Publish(ctx, LoginFailedEvent{
    Email:     email,
    Reason:    "invalid_credentials",
    FailedAt:  time.Now(),
    IPAddress: c.ClientIP(),
    UserAgent: string(c.UserAgent()),
    Timestamp: time.Now(),
})
```

---

## 4. TokenGenerated (Token 生成事件)

### 触发时机

生成新的 Access Token 和 Refresh Token

### Payload

```go
type TokenGeneratedEvent struct {
    UserID    string    `json:"user_id"`
    TokenType string    `json:"token_type"`  // "access", "refresh"
    ExpiresAt time.Time `json:"expires_at"`
    IssuedAt  time.Time `json:"issued_at"`
    Timestamp time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Audit Service** - 记录 Token 生成日志

### 安全注意

- ⚠️ **不要**包含 Token 内容（敏感信息）

### 使用场景

```go
// Token 生成后
eventBus.Publish(ctx, TokenGeneratedEvent{
    UserID:    userID,
    TokenType: "access",
    ExpiresAt: expiresAt,
    IssuedAt:  time.Now(),
    Timestamp: time.Now(),
})
```

---

## 5. TokenRefreshed (Token 刷新事件)

### 触发时机

使用 Refresh Token 刷新 Access Token

### Payload

```go
type TokenRefreshedEvent struct {
    UserID        string    `json:"user_id"`
    OldTokenID    string    `json:"old_token_id,omitempty"`
    NewTokenID    string    `json:"new_token_id,omitempty"`
    RefreshedAt   time.Time `json:"refreshed_at"`
    Timestamp     time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Audit Service** - 记录 Token 刷新日志
- **Security Service** - 检测异常刷新行为

### 使用场景

```go
// Token 刷新后
eventBus.Publish(ctx, TokenRefreshedEvent{
    UserID:      userID,
    RefreshedAt: time.Now(),
    Timestamp:   time.Now(),
})
```

---

## 6. TokenRevoked (Token 撤销事件)

### 触发时机

Token 被撤销（登出、密码修改、管理员操作）

### Payload

```go
type TokenRevokedEvent struct {
    UserID      string    `json:"user_id"`
    TokenID     string    `json:"token_id"`
    Reason      string    `json:"reason"`       // "logout", "password_change", "admin_action"
    RevokedBy   string    `json:"revoked_by"`   // 操作者（用户自己或管理员）
    RevokedAt   time.Time `json:"revoked_at"`
    Timestamp   time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Token Blacklist Service** - 将 Token 加入黑名单

### 使用场景

```go
// 用户登出时
eventBus.Publish(ctx, TokenRevokedEvent{
    UserID:    userID,
    TokenID:   tokenID,
    Reason:    "logout",
    RevokedBy: userID,
    RevokedAt: time.Now(),
    Timestamp: time.Now(),
})
```

---

## 7. UserLogout (用户登出事件)

### 触发时机

用户主动登出系统

### Payload

```go
type UserLogoutEvent struct {
    UserID    string    `json:"user_id"`
    LogoutAt  time.Time `json:"logout_at"`
    Timestamp time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Analytics Service** - 统计会话时长
- **Token Service** - 撤销 Token

### 使用场景

```go
// 用户登出后
eventBus.Publish(ctx, UserLogoutEvent{
    UserID:    userID,
    LogoutAt:  time.Now(),
    Timestamp: time.Now(),
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
}
```

### 订阅者（潜在）

- **Email Service** - 发送密码重置邮件

### 安全注意

- 重置链接有效期：1 小时
- 记录 IP 地址防止暴力攻击

---

## 9. AuthenticationMethodChanged (认证方式变更事件)

### 触发时机

用户修改认证方式（如启用 MFA）

### Payload

```go
type AuthenticationMethodChangedEvent struct {
    UserID       string    `json:"user_id"`
    OldMethod    string    `json:"old_method"`
    NewMethod    string    `json:"new_method"`
    ChangedAt    time.Time `json:"changed_at"`
    Timestamp    time.Time `json:"timestamp"`
}
```

### 订阅者（潜在）

- **Email Service** - 发送通知邮件
- **Audit Service** - 记录安全变更

---

## 事件监控

### 指标

- 注册数量（按天）
- 登录成功率
- 登录失败次数（按 IP、按邮箱）
- Token 刷新频率
- 异常登录检测

### 日志

```go
logger.Info("Event published",
    zap.String("event_type", "LoginSucceeded"),
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
