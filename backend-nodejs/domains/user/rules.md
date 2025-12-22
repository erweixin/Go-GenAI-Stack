# User Domain Business Rules (用户领域业务规则)

> 本文档定义了 User 领域的业务约束和规则

---

## 1. 邮箱规则

### R1.1 邮箱格式验证

**规则**：邮箱必须符合 RFC 5322 标准

**验证逻辑**：

- 包含 `@` 符号
- `@` 前后都有内容
- 域名部分包含 `.`

**错误码**：`INVALID_EMAIL`

**示例**：

```go
// ✅ 有效
user@example.com
john.doe@company.co.uk

// ❌ 无效
@example.com        // 缺少用户名
user@               // 缺少域名
user@domain         // 域名无效
```

---

### R1.2 邮箱唯一性

**规则**：系统中每个邮箱只能注册一次

**实现方式**：

- 数据库唯一索引：`UNIQUE INDEX ON users(email)`
- 注册前检查：`SELECT COUNT(*) FROM users WHERE email = ?`

**错误码**：`EMAIL_ALREADY_EXISTS`

**业务含义**：

- 防止重复注册
- 保证用户身份唯一性

---

### R1.3 邮箱大小写规范化

**规则**：存储时统一转为小写

**理由**：

- 邮箱地址大小写不敏感
- 避免 `User@Example.com` 和 `user@example.com` 被视为不同账户

**实现**：

```go
email = strings.ToLower(strings.TrimSpace(email))
```

---

## 2. 密码规则

### R2.1 密码最小长度

**规则**：密码至少 8 字符

**理由**：平衡安全性和用户体验

**错误码**：`WEAK_PASSWORD`

**扩展点**：

- 未来可增加复杂度要求（大小写、数字、特殊字符）
- 可集成密码强度检测库（如 zxcvbn）

---

### R2.2 密码最大长度

**规则**：密码最多 128 字符

**理由**：

- 防止 DoS 攻击（bcrypt 哈希计算开销）
- 128 字符对正常用户已足够

**错误码**：`PASSWORD_TOO_LONG`

---

### R2.3 密码加密存储

**规则**：密码必须使用 bcrypt 哈希存储

**算法**：`bcrypt`  
**Cost 参数**：`10`

**实现**：

```go
import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
    return string(hash), err
}
```

**禁止**：

- ❌ 明文存储密码
- ❌ 使用弱哈希算法（MD5, SHA1）

---

### R2.4 密码验证

**规则**：登录时使用 bcrypt 验证密码

**实现**：

```go
func VerifyPassword(hash, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

**安全考虑**：

- 验证失败时不泄露是邮箱还是密码错误
- 统一返回 "邮箱或密码错误"

---

## 3. 用户名规则

### R3.1 用户名格式

**规则**：用户名必须是 3-30 字符的字母数字组合

**字符集**：

- 字母：`a-z`, `A-Z`
- 数字：`0-9`
- 允许：下划线 `_`

**正则表达式**：`^[a-zA-Z0-9_]{3,30}$`

**错误码**：`INVALID_USERNAME`

**示例**：

```go
// ✅ 有效
john_doe
user123
Alice_2024

// ❌ 无效
ab              // 太短
john-doe        // 包含连字符
user@123        // 包含特殊字符
this_is_a_very_long_username_exceeding_limit  // 太长
```

---

### R3.2 用户名唯一性

**规则**：用户名必须唯一（如果提供）

**实现**：

- 数据库唯一索引：`UNIQUE INDEX ON users(username)`
- 更新前检查

**错误码**：`USERNAME_ALREADY_EXISTS`

**特殊情况**：

- 用户名可选，可以为 NULL
- NULL 值不受唯一性约束影响

---

### R3.3 用户名可选

**规则**：注册时用户名是可选的

**默认行为**：

- 如果未提供用户名，使用邮箱作为显示名
- 用户可以后续添加/修改用户名

---

## 4. 用户状态规则

### R4.1 初始状态

**规则**：新注册用户的初始状态为 `Inactive`

**理由**：

- 需要验证邮箱后才能激活
- 防止垃圾注册

---

### R4.2 状态转换

**允许的转换**：

```
Inactive → Active    (邮箱验证成功)
Active → Banned      (管理员禁用)
Banned → Active      (管理员解封)
```

**禁止的转换**：

- ❌ `Inactive → Banned`
- ❌ `Banned → Inactive`

---

### R4.3 禁用用户限制

**规则**：状态为 `Banned` 的用户不能登录

**实现**：

```go
if user.Status == UserStatusBanned {
    return nil, ErrUserBanned
}
```

**错误码**：`USER_BANNED`

---

## 5. 个人资料规则

### R5.1 全名最大长度

**规则**：全名最多 100 字符

**理由**：覆盖大多数真实姓名场景

**错误码**：`FULL_NAME_TOO_LONG`

---

### R5.2 头像 URL 格式

**规则**：头像 URL 必须是有效的 URL

**验证**：使用 Go 的 `url.Parse()`

**错误码**：`INVALID_AVATAR_URL`

**扩展点**：

- 限制允许的域名（如只允许 CDN）
- 限制文件大小和格式

---

## 6. 邮箱验证规则

### R6.1 验证链接有效期

**规则**：邮箱验证链接有效期为 24 小时

**实现**：

- Token 包含过期时间戳
- 验证时检查是否过期

**错误码**：`VERIFICATION_LINK_EXPIRED`

---

### R6.2 验证后自动激活

**规则**：邮箱验证成功后，用户状态自动变为 `Active`

**流程**：

1. 用户点击验证链接
2. 后端验证 Token
3. 更新 `email_verified = true`
4. 更新 `status = 'active'`
5. 发布 `UserActivated` 事件

---

## 7. 密码修改规则

### R7.1 需要旧密码验证

**规则**：修改密码时必须提供正确的旧密码

**理由**：防止账户被他人篡改

**错误码**：`INVALID_OLD_PASSWORD`

---

### R7.2 新旧密码不能相同

**规则**：新密码不能与旧密码相同

**错误码**：`NEW_PASSWORD_SAME_AS_OLD`

---

### R7.3 修改密码后撤销 Token

**规则**：密码修改成功后，撤销所有现有的 JWT Token

**理由**：

- 防止旧 Token 被滥用
- 强制用户重新登录

**实现**：

- 在数据库记录密码修改时间
- JWT 验证时检查 Token 签发时间是否早于密码修改时间

---

## 8. 数据一致性规则

### R8.1 软删除（扩展点）

**规则**：删除用户时使用软删除（标记为删除，不物理删除）

**实现**：

- 添加 `deleted_at` 字段
- 查询时过滤 `deleted_at IS NULL`

**理由**：

- 保留历史数据
- 支持账户恢复

---

### R8.2 最后登录时间更新

**规则**：每次成功登录时更新 `last_login_at`

**用途**：

- 统计活跃用户
- 安全审计

---

## 9. 安全规则

### R9.1 敏感信息不返回

**规则**：API 响应中永远不返回 `password_hash`

**实现**：

```go
type UserResponse struct {
    ID        string `json:"id"`
    Email     string `json:"email"`
    Username  string `json:"username"`
    // ❌ PasswordHash string `json:"password_hash"` // 禁止
}
```

---

### R9.2 邮箱可见性

**规则**：用户邮箱仅本人可见

**实现**：

- 获取用户资料时检查权限
- 列出用户列表时不包含邮箱

---

### R9.3 密码重置需要验证

**规则**：忘记密码时必须通过邮箱验证

**流程**：

1. 用户请求重置密码
2. 发送重置链接到邮箱
3. 用户点击链接
4. 输入新密码
5. 更新密码

**错误码**：`RESET_TOKEN_INVALID`

---

## 10. 性能规则

### R10.1 数据库索引

**规则**：为常用查询字段创建索引

**必需索引**：

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

---

### R10.2 缓存用户信息（扩展点）

**规则**：频繁访问的用户信息可以缓存到 Redis

**缓存策略**：

- Key: `user:{user_id}`
- TTL: 15 分钟
- 更新时清除缓存

---

## 规则优先级

1. **安全规则** - 最高优先级，不可妥协
2. **数据一致性规则** - 保证数据完整性
3. **业务规则** - 核心业务逻辑
4. **性能规则** - 优化用户体验

---

## 参考资料

- [用例定义](./usecases.yaml)
- [领域术语](./glossary.md)
- [领域事件](./events.md)
- [README](./README.md)
