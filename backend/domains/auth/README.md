# Auth Domain (认证领域)

## 概述

认证领域负责用户的身份认证和授权，包括注册、登录、Token 管理等功能。这是安全的核心模块，与 User 领域紧密协作。

## 领域边界

### 职责范围

- ✅ 用户注册（Register）
- ✅ 用户登录（Login）
- ✅ JWT Token 生成和验证
- ✅ Refresh Token 刷新
- ✅ 登出（Logout，扩展点）
- ✅ Token 撤销管理（扩展点）

### 不包含的职责

- ❌ 用户资料管理（属于 User Domain）
- ❌ 权限和角色管理（属于 RBAC Domain，未实现）
- ❌ 邮件发送（属于 Notification Domain，未实现）
- ❌ 审计日志（属于 Audit Domain，未实现）

## 核心概念

参考 `glossary.md` 了解领域术语。

## 用例列表

参考 `usecases.yaml` 查看所有用例的声明式定义。

主要用例：
1. **Register** - 用户注册
2. **Login** - 用户登录
3. **RefreshToken** - 刷新访问令牌
4. **Logout** - 登出（扩展点）

## 核心服务

### JWTService（JWT 服务）

**职责**：
- 生成 Access Token 和 Refresh Token
- 验证 Token 有效性
- 解析 Token 中的 Claims

**Token 类型**：
- **Access Token**：短期有效（1 小时），用于 API 认证
- **Refresh Token**：长期有效（7 天），用于刷新 Access Token

### AuthService（认证服务）

**职责**：
- 实现注册和登录业务逻辑
- 调用 User Domain 创建和验证用户
- 生成和管理 Token

## JWT Token 设计

### Access Token

**Claims**：
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "type": "access",
  "iss": "go-genai-stack",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**过期时间**：1 小时  
**用途**：API 认证

### Refresh Token

**Claims**：
```json
{
  "user_id": "uuid",
  "type": "refresh",
  "iss": "go-genai-stack",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**过期时间**：7 天  
**用途**：刷新 Access Token

### Token 验证流程

```
Client → API → Auth Middleware → Verify JWT → Extract UserID → Handler
```

1. 客户端在请求头中携带 Token：`Authorization: Bearer <token>`
2. Auth Middleware 验证 Token 签名和过期时间
3. 提取 UserID 并存储到 Context
4. Handler 从 Context 获取 UserID

## 安全特性

### 1. 密码安全

- **哈希算法**：bcrypt (Cost: 10)
- **盐值**：bcrypt 自动生成
- **验证失败**：统一返回 "邮箱或密码错误"（不泄露具体原因）

### 2. Token 安全

- **签名算法**：HS256 (HMAC with SHA-256)
- **密钥管理**：从环境变量读取 JWT_SECRET
- **过期时间**：Access Token 短期有效，Refresh Token 相对长期
- **Token 类型**：在 Claims 中标记 type 字段

### 3. 防暴力破解（扩展点）

- 使用 Rate Limiting 中间件限制登录频率
- 记录失败尝试次数
- IP 黑名单

### 4. Token 撤销（扩展点）

- 使用 Redis 存储撤销的 Token
- 登出时将 Token 加入黑名单
- Middleware 检查 Token 是否在黑名单中

## 与 User Domain 的关系

```
┌──────────────────────────────────────────────┐
│  Auth Domain (认证领域)                       │
│  ┌──────────────────────────────────────┐   │
│  │ Register   → 调用 User.NewUser       │   │
│  │ Login      → 调用 User.VerifyPassword│   │
│  │ JWT Token Generation                 │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                   ↓ 依赖
┌──────────────────────────────────────────────┐
│  User Domain (用户领域)                       │
│  ┌──────────────────────────────────────┐   │
│  │ User Model                           │   │
│  │ User Repository                      │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**依赖关系**：
- Auth Domain **依赖** User Domain
- Auth 调用 User Domain 的 Repository 和 Model
- Auth 不修改 User 的内部实现

## API 接口

### 1. 注册

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "john_doe",
  "full_name": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### 2. 登录

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### 3. 刷新 Token

**Endpoint**: `POST /api/auth/refresh`

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

## 配置

### 环境变量

```bash
# JWT 密钥（必需）
JWT_SECRET=your-secret-key-here

# JWT 过期时间（可选）
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d

# JWT Issuer（可选）
JWT_ISSUER=go-genai-stack
```

### 默认值

参考 `infrastructure/config/config.go`：

```go
type JWTConfig struct {
    Secret              string
    AccessTokenExpiry   time.Duration  // 1 hour
    RefreshTokenExpiry  time.Duration  // 7 days
    Issuer              string         // "go-genai-stack"
}
```

## 扩展点

### 1. OAuth2 集成（未实现）

- 支持 Google、GitHub、微信等第三方登录
- 统一用户身份管理

### 2. Email 验证（未实现）

- 注册后发送验证邮件
- 验证后激活账户

### 3. 密码重置（未实现）

- 忘记密码流程
- 邮件发送重置链接

### 4. Token 黑名单（未实现）

- 使用 Redis 存储撤销的 Token
- 登出时加入黑名单

### 5. 多因素认证（未实现）

- TOTP (Google Authenticator)
- SMS 验证码

## 安全最佳实践

1. ✅ **永远不返回明文密码**
2. ✅ **使用 bcrypt 哈希密码**
3. ✅ **JWT 密钥使用强随机字符串**
4. ✅ **Token 过期时间合理设置**
5. ✅ **HTTPS 传输 Token**
6. ✅ **验证失败时不泄露具体原因**
7. ⏳ **添加 Rate Limiting（待实现）**
8. ⏳ **记录登录失败尝试（待实现）**
9. ⏳ **支持 Token 撤销（待实现）**

## 参考资料

- [用例定义](./usecases.yaml)
- [领域术语](./glossary.md)
- [业务规则](./rules.md)
- [领域事件](./events.md)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

