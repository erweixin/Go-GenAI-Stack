# Auth Domain Business Rules (认证领域业务规则)

> 本文档定义了 Auth 领域的业务约束和规则

---

## 1. JWT Token 规则

### R1.1 Token 过期时间

**规则**：Access Token 和 Refresh Token 必须有过期时间

**配置**：

- **Access Token**：1 小时（3600 秒）
- **Refresh Token**：7 天（604800 秒）

**理由**：

- Access Token 短期有效，减少泄露风险
- Refresh Token 长期有效，提升用户体验

**可配置**：通过环境变量调整

```bash
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d
```

---

### R1.2 Token 签名算法

**规则**：使用 HS256 算法签名 JWT

**算法**：HMAC with SHA-256（对称加密）

**理由**：

- 性能好
- 适合单体应用
- 密钥管理简单

**未来扩展**：可升级为 RS256（非对称加密）用于微服务

---

### R1.3 Token 必须包含 Type

**规则**：Token 的 Claims 中必须包含 `type` 字段

**可选值**：

- `"access"` - Access Token
- `"refresh"` - Refresh Token

**理由**：

- 防止 Token 类型混用
- Refresh Token 不能用于 API 认证

**验证**：

```go
if claims.Type != "access" {
    return ErrInvalidTokenType
}
```

---

### R1.4 Token 必须包含 Issuer

**规则**：Token 的 Claims 中必须包含 `iss` 字段

**值**：`"go-genai-stack"`

**理由**：

- 防止跨系统 Token 滥用
- 标识 Token 来源

---

### R1.5 JWT 密钥强度

**规则**：JWT_SECRET 必须是强随机字符串

**最小长度**：32 字符

**建议**：

```bash
# 生成强随机密钥
openssl rand -base64 32
```

**禁止**：

- ❌ 使用简单密码（如 "password123"）
- ❌ 使用默认值
- ❌ 硬编码在代码中

---

## 2. 注册规则

### R2.1 邮箱唯一性

**规则**：系统中每个邮箱只能注册一次

**实现**：

- 数据库唯一索引
- 注册前检查邮箱是否存在

**错误码**：`EMAIL_ALREADY_EXISTS`

---

### R2.2 密码强度

**规则**：密码至少 8 字符

**验证**：由 User Domain 的 Model 层验证

**错误码**：`WEAK_PASSWORD`

**扩展点**：

- 未来可增加复杂度要求（大小写、数字、特殊字符）
- 集成密码强度检测库（如 zxcvbn）

---

### R2.3 注册成功自动登录

**规则**：用户注册成功后，自动生成 Token

**理由**：提升用户体验，避免注册后再登录

**返回**：

- `user_id`
- `access_token`
- `refresh_token`

---

### R2.4 注册后发送验证邮件（扩展点）

**规则**：用户注册后，发送邮箱验证链接

**实现**：

- 发布 `UserCreated` 事件
- Email Service 监听事件并发送邮件

**状态**：未实现

---

## 3. 登录规则

### R3.1 验证失败统一提示

**规则**：登录失败时，统一返回 "邮箱或密码错误"

**理由**：

- 不泄露邮箱是否存在
- 防止枚举攻击

**错误码**：`INVALID_CREDENTIALS`

**示例**：

```go
// ❌ 错误：泄露邮箱是否存在
if !userExists {
    return "邮箱不存在"
}
if !passwordValid {
    return "密码错误"
}

// ✅ 正确：统一提示
if !userExists || !passwordValid {
    return "邮箱或密码错误"
}
```

---

### R3.2 检查用户状态

**规则**：登录前检查用户状态，禁用用户不能登录

**状态检查**：

- `active` → 允许登录
- `inactive` → 允许登录（但可能限制功能）
- `banned` → 拒绝登录

**错误码**：`USER_BANNED`

---

### R3.3 记录登录时间

**规则**：登录成功后，更新用户的 `last_login_at` 字段

**用途**：

- 统计活跃用户
- 安全审计

**实现**：

```go
user.RecordLogin()  // 更新 last_login_at
userRepo.Update(ctx, user)
```

---

### R3.4 登录成功发布事件

**规则**：登录成功后，发布 `LoginSucceeded` 事件

**Event Payload**：

- `user_id`
- `email`
- `login_at`
- `ip_address`
- `user_agent`

**订阅者**：

- Analytics Service - 统计活跃用户
- Security Service - 检测异常登录

---

### R3.5 登录失败次数限制（扩展点）

**规则**：同一 IP 或邮箱，登录失败超过 N 次后，暂时锁定

**配置**：

- 最大失败次数：5 次
- 锁定时间：15 分钟

**实现**：

- 使用 Redis 记录失败次数
- 使用 Rate Limiting 中间件

**状态**：未实现

---

## 4. Token 刷新规则

### R4.1 只能使用 Refresh Token 刷新

**规则**：`/api/auth/refresh` 端点只接受 Refresh Token

**验证**：

```go
if claims.Type != "refresh" {
    return ErrInvalidTokenType
}
```

**错误码**：`INVALID_REFRESH_TOKEN`

---

### R4.2 刷新时生成新的 Refresh Token

**规则**：刷新 Token 时，同时生成新的 Access Token 和 Refresh Token

**理由**：

- 增强安全性
- 旧的 Refresh Token 失效（滚动刷新）

**实现**：

```go
newAccessToken := jwt.GenerateAccessToken(userID)
newRefreshToken := jwt.GenerateRefreshToken(userID)
```

---

### R4.3 刷新前检查用户状态

**规则**：刷新 Token 前，检查用户是否被禁用

**场景**：

- 用户在 Refresh Token 有效期内被禁用
- 不应允许继续刷新

**错误码**：`USER_BANNED`

---

## 5. Token 验证规则

### R5.1 验证 Token 签名

**规则**：验证 Token 的签名是否正确

**算法**：HS256

**失败**：Token 被篡改

**错误码**：`INVALID_TOKEN`

---

### R5.2 验证 Token 过期时间

**规则**：验证 Token 的 `exp` 字段是否已过期

**实现**：

```go
if time.Now().Unix() > claims.ExpiresAt {
    return ErrTokenExpired
}
```

**错误码**：`INVALID_TOKEN`

---

### R5.3 验证 Token Issuer

**规则**：验证 Token 的 `iss` 字段是否为 "go-genai-stack"

**理由**：防止跨系统 Token 滥用

**错误码**：`INVALID_TOKEN`

---

### R5.4 检查 Token 黑名单（扩展点）

**规则**：验证 Token 是否在黑名单中

**实现**：

```go
if redis.Exists(ctx, "token_blacklist:" + tokenID) {
    return ErrTokenRevoked
}
```

**状态**：未实现

---

## 6. 登出规则

### R6.1 客户端删除 Token

**规则**：登出时，客户端删除本地存储的 Token

**实现**：

- 前端清除 localStorage 或 sessionStorage
- 前端不再携带 Token 发起请求

---

### R6.2 服务器撤销 Token（扩展点）

**规则**：登出时，将 Token 加入黑名单

**实现**：

```go
redis.Set(ctx, "token_blacklist:" + tokenID, "1", tokenTTL)
```

**TTL**：Token 过期时间

**状态**：未实现

---

## 7. 密码修改规则

### R7.1 修改密码后撤销所有 Token

**规则**：用户修改密码后，撤销所有现有 Token

**理由**：

- 防止旧 Token 被滥用
- 强制用户重新登录

**实现**（扩展点）：

- 在 User 表添加 `password_changed_at` 字段
- Token 验证时检查 Token 签发时间是否早于密码修改时间

```go
if token.IssuedAt < user.PasswordChangedAt {
    return ErrTokenInvalidAfterPasswordChange
}
```

---

## 8. 安全规则

### R8.1 HTTPS 传输

**规则**：生产环境必须使用 HTTPS 传输 Token

**理由**：防止中间人攻击（MITM）

**禁止**：在 HTTP 环境下传输 Token

---

### R8.2 不在 URL 中传递 Token

**规则**：Token 只能在 HTTP Header 中传递

**正确**：

```
Authorization: Bearer <token>
```

**错误**：

```
GET /api/users?token=<token>
```

**理由**：

- URL 会被记录在日志中
- URL 可能泄露（浏览器历史、Referrer）

---

### R8.3 Token 不包含敏感信息

**规则**：Token 的 Claims 中不包含密码、密码哈希等敏感信息

**允许**：

- `user_id`
- `email`
- `role`

**禁止**：

- ❌ `password`
- ❌ `password_hash`
- ❌ `credit_card_number`

---

### R8.4 密钥轮换（扩展点）

**规则**：定期轮换 JWT 密钥

**频率**：每 90 天

**实现**：

- 支持多个密钥（`kid` - Key ID）
- 旧 Token 仍可验证
- 新 Token 使用新密钥

**状态**：未实现

---

## 9. Rate Limiting 规则（扩展点）

### R9.1 登录频率限制

**规则**：同一 IP 或邮箱，每分钟最多尝试 5 次登录

**实现**：

- 使用 Rate Limiting 中间件
- 使用 Redis 存储请求次数

**状态**：未实现

---

### R9.2 注册频率限制

**规则**：同一 IP，每小时最多注册 3 个账户

**理由**：防止批量注册（垃圾账户）

**状态**：未实现

---

## 10. 日志和审计规则

### R10.1 记录登录事件

**规则**：记录所有登录尝试（成功和失败）

**日志内容**：

- 时间戳
- 邮箱
- IP 地址
- User Agent
- 结果（成功/失败）

**用途**：

- 安全审计
- 检测异常活动

---

### R10.2 记录 Token 生成

**规则**：记录 Token 生成事件

**日志内容**：

- 时间戳
- 用户 ID
- Token 类型（access/refresh）

**用途**：

- 审计
- 调试

---

## 规则优先级

1. **安全规则** - 最高优先级，不可妥协
2. **Token 验证规则** - 保证 Token 有效性
3. **业务规则** - 核心业务逻辑
4. **性能规则** - 优化用户体验

---

## 参考资料

- [用例定义](./usecases.yaml)
- [领域术语](./glossary.md)
- [领域事件](./events.md)
- [README](./README.md)
- [JWT Best Practices (RFC 8725)](https://tools.ietf.org/html/rfc8725)
