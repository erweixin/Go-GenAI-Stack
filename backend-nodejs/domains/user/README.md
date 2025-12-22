# User Domain (用户领域)

## 概述

用户领域负责管理用户的基本信息、个人资料和账户设置。这是认证系统的核心基础，与 Auth 领域紧密协作。

## 领域边界

### 职责范围

- ✅ 管理用户基本信息（用户名、邮箱、头像等）
- ✅ 处理用户资料更新
- ✅ 管理用户密码（哈希存储）
- ✅ 提供用户查询和验证
- ✅ 维护用户状态（激活/禁用）

### 不包含的职责

- ❌ JWT Token 生成和验证（属于 Auth Domain）
- ❌ OAuth2 集成（属于 Auth Domain）
- ❌ 权限和角色管理（属于 RBAC Domain，未实现）
- ❌ 用户行为分析（属于 Analytics Domain，未实现）

## 核心概念

参考 `glossary.md` 了解领域术语。

## 用例列表

参考 `usecases.yaml` 查看所有用例的声明式定义。

主要用例：
1. **GetUserProfile** - 获取用户资料
2. **UpdateUserProfile** - 更新用户资料
3. **ChangePassword** - 修改密码

## 聚合根和实体

### User（用户）- 聚合根

**字段**：
- UserID - 用户 ID (UUID)
- Email - 邮箱（唯一）
- Username - 用户名（唯一，可选）
- PasswordHash - 密码哈希
- FullName - 全名
- AvatarURL - 头像 URL
- Status - 状态（Active, Inactive, Banned）
- EmailVerified - 邮箱是否已验证
- CreatedAt - 创建时间
- UpdatedAt - 更新时间
- LastLoginAt - 最后登录时间

**业务方法**：
- `NewUser(email, password)` - 创建新用户
- `VerifyPassword(password)` - 验证密码
- `UpdatePassword(newPassword)` - 更新密码
- `Activate()` - 激活用户
- `Deactivate()` - 禁用用户

### UserStatus（用户状态）- 值对象

- Active（激活）- 正常使用
- Inactive（未激活）- 注册但未验证邮箱
- Banned（禁用）- 被管理员禁用

## 领域事件

参考 `events.md` 查看所有领域事件。

主要事件：
- `UserCreated` - 用户注册时
- `UserUpdated` - 用户资料更新时
- `PasswordChanged` - 密码修改时
- `UserActivated` - 用户激活时
- `UserDeactivated` - 用户禁用时

## 业务规则

参考 `rules.md` 查看所有业务规则和约束。

核心规则：
- 邮箱必须唯一且格式有效
- 密码最少 8 字符
- 用户名 3-30 字符，仅字母数字
- 密码使用 bcrypt 哈希存储

## 依赖关系

### 下游依赖
- 无

### 上游依赖
- **Auth Domain**：用户注册时创建用户记录

### 领域间通信

**遵循"分布式友好但不分布式"原则**：

- ✅ **事件发布**：User 领域在关键操作后发布事件
  - `UserUpdatedEvent` - 用户资料更新
  - `PasswordChangedEvent` - 密码修改
- ✅ **查询接口**：提供 `UserQueryService` 供其他领域使用（只读）
  - `getUser()` - 根据 ID 获取用户
  - `getUserByEmail()` - 根据邮箱获取用户
  - `userExists()` - 检查用户是否存在
  - `emailExists()` - 检查邮箱是否已注册
- ✅ **事件订阅**：可以订阅其他领域的事件（示例：订阅 `TaskCreated` 事件）
- ❌ **禁止**：不直接调用其他领域的 Service

**示例**：
```typescript
// ✅ 正确：发布事件通知其他领域
await this.eventBus.publish(ctx, new UserUpdatedEvent({ ... }));

// ✅ 正确：订阅其他领域的事件
this.eventBus.subscribe('TaskCreated', async (ctx, event) => {
  // 处理任务创建事件（如更新用户统计）
});

// ❌ 错误：直接调用其他领域的 Service
const task = await this.taskService.getTask(ctx, { taskId }); // ❌
```

参考：[事件总线使用指南](../shared/events/README.md)

## 与 Auth Domain 的关系

```
┌──────────────────────────────────────────────┐
│  Auth Domain (认证领域)                       │
│  ┌──────────────────────────────────────┐   │
│  │ Register   → 调用 User.Create        │   │
│  │ Login      → 调用 User.VerifyPassword│   │
│  │ JWT Token Generation                 │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│  User Domain (用户领域)                       │
│  ┌──────────────────────────────────────┐   │
│  │ User Model                           │   │
│  │ User Repository                      │   │
│  │ User Service                         │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## 数据库 Schema

参考 `database/schema.sql`：

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ
);
```

## 安全考虑

1. **密码存储**：
   - 使用 bcrypt 哈希
   - Cost 参数：10（平衡安全和性能）
   - 永远不返回 password_hash 字段

2. **敏感数据**：
   - 邮箱、手机号等敏感信息需要访问控制
   - 用户只能访问/修改自己的资料

3. **输入验证**：
   - 邮箱格式验证
   - 用户名字符限制
   - 防止 SQL 注入（使用参数化查询）

## 扩展点

### 1. 社交账号绑定（未实现）
- 绑定 Google、GitHub、微信等账号
- 支持多个社交账号登录

### 2. 邮箱验证（未实现）
- 发送验证邮件
- 验证码验证

### 3. 用户偏好设置（未实现）
- 主题、语言等个性化设置

### 4. 多因素认证（未实现）
- TOTP (Time-based One-Time Password)
- SMS 验证码

## 参考资料

- [用例定义](./usecases.yaml)
- [领域术语](./glossary.md)
- [业务规则](./rules.md)
- [领域事件](./events.md)
- [数据库 Schema](../../database/schema.sql)

