# User Domain Glossary (用户领域术语表)

> 本文档定义了 User 领域的统一语言（Ubiquitous Language）

---

## 核心术语

### User（用户）

**定义**：系统中的注册账户实体

**类型**：聚合根（Aggregate Root）

**属性**：

- 有唯一标识（UserID）
- 有唯一邮箱（Email）
- 有密码（PasswordHash，加密存储）
- 有个人资料（用户名、全名、头像）
- 有状态（激活/未激活/禁用）

**生命周期**：

```
注册 → 未激活(Inactive) → 激活(Active) → 禁用(Banned)
                                ↓
                              注销(Deleted)
```

**业务规则**：

- 邮箱必须唯一且格式有效（`INVALID_EMAIL`）
- 密码至少 8 字符（`WEAK_PASSWORD`）
- 用户名 3-30 字符，仅字母数字（`INVALID_USERNAME`）

**相关事件**：

- `UserCreated` - 用户注册时
- `UserUpdated` - 用户资料更新时
- `PasswordChanged` - 密码修改时

---

### Email（邮箱）

**定义**：用户的唯一电子邮件地址

**类型**：值对象（Value Object）

**格式**：RFC 5322 标准

**业务规则**：

- 必须唯一（系统级约束）
- 必须通过格式验证
- 区分大小写（存储时转为小写）

**示例**：

```go
type Email string

func NewEmail(email string) (Email, error) {
    // 转为小写
    email = strings.ToLower(strings.TrimSpace(email))

    // 格式验证
    if !isValidEmail(email) {
        return "", ErrInvalidEmail
    }

    return Email(email), nil
}
```

---

### PasswordHash（密码哈希）

**定义**：用户密码的加密存储形式

**类型**：值对象（Value Object）

**算法**：bcrypt (Cost: 10)

**业务规则**：

- 原始密码至少 8 字符
- 永远不返回给客户端
- 使用 bcrypt 哈希算法

**安全考虑**：

- 使用盐值（bcrypt 自带）
- Cost 参数平衡安全和性能
- 定期建议用户修改密码

**示例**：

```go
import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
    return string(hash), err
}

func VerifyPassword(hash, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

---

### Username（用户名）

**定义**：用户的唯一标识符（可读性强）

**类型**：值对象（Value Object）

**格式**：

- 长度：3-30 字符
- 字符集：字母数字（a-z, A-Z, 0-9）
- 可选：下划线 `_`

**业务规则**：

- 必须唯一（系统级约束）
- 不可包含空格或特殊字符
- 创建后可修改（但需唯一性检查）

**示例**：

- ✅ `john_doe`
- ✅ `user123`
- ❌ `john@doe` (包含特殊字符)
- ❌ `ab` (太短)

---

### UserStatus（用户状态）

**定义**：用户账户的当前状态

**类型**：值对象（Value Object）/ 枚举

**可选值**：

- `Active` - 激活：可以正常使用所有功能
- `Inactive` - 未激活：注册但未验证邮箱
- `Banned` - 禁用：被管理员禁用，不能登录

**状态转换规则**：

```
Inactive → Active    (邮箱验证)
Active → Banned      (管理员操作)
Banned → Active      (管理员解封)
```

**不允许的转换**：

- ❌ Inactive → Banned (必须先激活)

**示例**：

```go
type UserStatus string

const (
    UserStatusActive   UserStatus = "active"
    UserStatusInactive UserStatus = "inactive"
    UserStatusBanned   UserStatus = "banned"
)
```

---

### EmailVerified（邮箱验证状态）

**定义**：用户邮箱是否已通过验证

**类型**：值对象（Value Object）/ 布尔值

**业务含义**：

- `true` - 已验证：用户点击了验证邮件链接
- `false` - 未验证：注册后未完成验证

**相关流程**：

1. 用户注册 → EmailVerified = false
2. 发送验证邮件
3. 用户点击链接 → EmailVerified = true
4. 状态变更：Inactive → Active

**业务规则**：

- 未验证的用户可能有功能限制
- 验证链接有效期：24 小时

---

### Profile（个人资料）

**定义**：用户的公开信息集合

**类型**：实体（Entity）

**包含字段**：

- FullName（全名）
- AvatarURL（头像 URL）
- Bio（个人简介，扩展点）
- Location（所在地，扩展点）

**可见性**：

- 部分公开（如用户名、头像）
- 部分私有（如邮箱，仅本人可见）

---

## 领域操作术语

### Register（注册）

**定义**：创建一个新的用户账户

**前置条件**：

- 邮箱未被占用
- 密码符合强度要求

**后置条件**：

- 用户记录已保存到数据库
- 状态为 Inactive
- 发布 `UserCreated` 事件

---

### Login（登录）

**定义**：验证用户凭据并建立会话

**前置条件**：

- 用户已注册
- 提供正确的邮箱和密码

**后置条件**：

- 返回 JWT Token
- 记录最后登录时间

---

### VerifyPassword（密码验证）

**定义**：检查提供的密码是否与存储的哈希匹配

**算法**：bcrypt.CompareHashAndPassword

**返回**：布尔值（true/false）

---

### ChangePassword（修改密码）

**定义**：用户主动修改密码

**前置条件**：

- 提供正确的旧密码
- 新密码符合强度要求

**后置条件**：

- 密码哈希已更新
- 撤销所有现有 Token（可选）
- 发布 `PasswordChanged` 事件

---

### UpdateProfile（更新资料）

**定义**：修改用户的个人信息

**可更新字段**：

- Username
- FullName
- AvatarURL

**不可更新字段**：

- Email（需要额外的验证流程）
- UserID
- PasswordHash（使用 ChangePassword）

---

## 错误码术语

### USER_NOT_FOUND

**含义**：用户不存在  
**场景**：查询、更新、删除操作  
**HTTP 状态码**：404

### INVALID_EMAIL

**含义**：邮箱格式无效  
**场景**：注册、更新邮箱  
**HTTP 状态码**：400

### EMAIL_ALREADY_EXISTS

**含义**：邮箱已被占用  
**场景**：注册  
**HTTP 状态码**：400

### USERNAME_ALREADY_EXISTS

**含义**：用户名已被占用  
**场景**：注册、更新用户名  
**HTTP 状态码**：400

### WEAK_PASSWORD

**含义**：密码强度不足  
**场景**：注册、修改密码  
**HTTP 状态码**：400

### INVALID_PASSWORD

**含义**：密码错误  
**场景**：登录、修改密码  
**HTTP 状态码**：401

---

## 缩写和约定

- **UUID** - Universally Unique Identifier（通用唯一标识符）
- **JWT** - JSON Web Token（JSON 网络令牌）
- **bcrypt** - 密码哈希算法
- **Cost** - bcrypt 的迭代次数参数（默认 10）
- **Salt** - 密码盐值（bcrypt 自动生成）

---

## 参考资料

- [用例定义](./usecases.yaml)
- [业务规则](./rules.md)
- [领域事件](./events.md)
- [README](./README.md)
