# Auth Domain Glossary (认证领域术语表)

> 本文档定义了 Auth 领域的统一语言（Ubiquitous Language）

---

## 核心术语

### JWT (JSON Web Token)

**定义**：基于 JSON 的开放标准（RFC 7519）的轻量级令牌

**结构**：
```
Header.Payload.Signature
```

**示例**：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwiZXhwIjoxNjcwMDAwMDAwfQ.abc123...
```

**组成部分**：
1. **Header**：算法和令牌类型
2. **Payload**：Claims（声明）
3. **Signature**：签名（防篡改）

**特点**：
- 自包含：Token 本身包含用户信息
- 无状态：服务器不需要存储 Session
- 可验证：通过签名验证 Token 未被篡改

---

### Access Token（访问令牌）

**定义**：短期有效的令牌，用于 API 认证

**类型**：JWT

**过期时间**：1 小时（默认）

**Claims**：
- `user_id`: 用户 ID
- `email`: 邮箱
- `type`: "access"
- `iss`: Issuer（签发者）
- `exp`: 过期时间
- `iat`: 签发时间

**用途**：
- 在 HTTP 请求头中携带：`Authorization: Bearer <token>`
- 每次 API 请求时验证身份

**安全考虑**：
- 过期时间短，减少泄露风险
- 不存储敏感信息（如密码）

---

### Refresh Token（刷新令牌）

**定义**：长期有效的令牌，用于获取新的 Access Token

**类型**：JWT

**过期时间**：7 天（默认）

**Claims**：
- `user_id`: 用户 ID
- `type`: "refresh"
- `iss`: Issuer
- `exp`: 过期时间
- `iat`: 签发时间

**用途**：
- 当 Access Token 过期时，使用 Refresh Token 获取新的 Access Token
- 避免用户频繁登录

**安全考虑**：
- 只用于 `/api/auth/refresh` 端点
- 不能用于普通 API 认证
- 可以撤销（加入黑名单）

---

### Claims（声明）

**定义**：JWT Payload 中的键值对，描述实体（通常是用户）的属性

**类型**：
1. **Registered Claims**（注册声明）：
   - `iss`（Issuer）：签发者
   - `sub`（Subject）：主题
   - `aud`（Audience）：受众
   - `exp`（Expiration Time）：过期时间
   - `iat`（Issued At）：签发时间

2. **Public Claims**（公共声明）：
   - 自定义字段，如 `user_id`, `email`, `role`

3. **Private Claims**（私有声明）：
   - 特定应用的自定义字段

---

### Authentication（认证）

**定义**：验证用户身份的过程

**流程**：
```
用户提供凭据（邮箱 + 密码）→ 服务器验证 → 颁发 Token
```

**方式**：
- 邮箱 + 密码
- OAuth2（Google、GitHub 等）
- 多因素认证（MFA）

**结果**：
- 成功：返回 Access Token 和 Refresh Token
- 失败：返回 401 Unauthorized

---

### Authorization（授权）

**定义**：验证用户是否有权限访问特定资源

**与认证的区别**：
- **认证**：你是谁？
- **授权**：你能做什么？

**实现**：
- 基于角色（RBAC）：用户 → 角色 → 权限
- 基于属性（ABAC）：根据属性动态判断

**扩展点**：
- 当前版本仅实现认证
- 授权功能在 RBAC Domain（未实现）

---

### Register（注册）

**定义**：创建新用户账户的过程

**输入**：
- 邮箱
- 密码
- 用户名（可选）
- 全名（可选）

**输出**：
- 用户 ID
- Access Token
- Refresh Token

**业务规则**：
- 邮箱必须唯一
- 密码至少 8 字符
- 用户名 3-30 字符（如果提供）

---

### Login（登录）

**定义**：验证用户凭据并建立会话的过程

**输入**：
- 邮箱
- 密码

**输出**：
- 用户 ID
- Access Token
- Refresh Token

**步骤**：
1. 验证邮箱格式
2. 根据邮箱获取用户
3. 验证密码
4. 检查用户状态
5. 生成 Token
6. 记录登录时间

---

### Logout（登出）

**定义**：撤销用户会话，使 Token 失效

**方式**：
1. **客户端删除 Token**（简单方式）
2. **服务器撤销 Token**（黑名单方式）

**黑名单实现**（扩展点）：
- 将 Token 存入 Redis 黑名单
- Middleware 检查 Token 是否在黑名单中
- 黑名单 TTL = Token 过期时间

---

### Token Refresh（令牌刷新）

**定义**：使用 Refresh Token 获取新的 Access Token

**流程**：
```
Client → POST /api/auth/refresh → Verify Refresh Token → Generate New Access Token
```

**Why**：
- Access Token 短期有效（1 小时）
- 避免用户频繁登录
- 提升安全性（泄露风险小）

---

### Token Revocation（令牌撤销）

**定义**：使 Token 失效的过程

**场景**：
- 用户登出
- 用户修改密码
- 检测到异常活动

**实现**：
- 使用 Redis 存储黑名单
- Key: `token_blacklist:{token_id}`
- TTL: Token 过期时间

---

### Credentials（凭据）

**定义**：用于验证用户身份的信息

**类型**：
- **邮箱 + 密码**：传统方式
- **OAuth Token**：第三方登录
- **API Key**：应用级认证

**安全考虑**：
- 永远不存储明文密码
- 使用 HTTPS 传输凭据
- 验证失败时不泄露具体原因

---

### Session（会话）

**定义**：用户与系统交互的一段时间

**传统方式**：
- 服务器存储 Session（如 Redis）
- 客户端携带 Session ID（Cookie）

**JWT 方式**：
- 无状态：服务器不存储 Session
- Token 本身包含会话信息

**对比**：
| 特性 | Session | JWT |
|------|---------|-----|
| 存储位置 | 服务器 | 客户端 |
| 可扩展性 | 差（需要共享 Session） | 好（无状态） |
| 撤销能力 | 容易 | 困难（需要黑名单） |

---

### Bearer Token

**定义**：携带在 HTTP 请求头中的令牌

**格式**：
```
Authorization: Bearer <token>
```

**Why "Bearer"**：
- Bearer = 持有者
- 任何持有 Token 的人都可以访问资源
- 因此 Token 必须保密

---

### JWT Secret（JWT 密钥）

**定义**：用于签名和验证 JWT 的密钥

**算法**：
- HS256：HMAC with SHA-256（对称加密）
- RS256：RSA with SHA-256（非对称加密）

**密钥管理**：
- 从环境变量读取：`JWT_SECRET`
- 必须使用强随机字符串
- 定期轮换密钥（扩展点）

**示例**：
```bash
JWT_SECRET=your-256-bit-secret-key-here
```

---

### Token Expiry（令牌过期）

**定义**：Token 有效期结束的时间

**字段**：`exp`（Expiration Time）

**过期时间**：
- Access Token：1 小时
- Refresh Token：7 天

**处理**：
- Access Token 过期 → 使用 Refresh Token 刷新
- Refresh Token 过期 → 重新登录

---

## 领域操作术语

### Verify Token（验证令牌）

**定义**：检查 Token 的有效性

**验证项**：
1. **签名**：Token 未被篡改
2. **过期时间**：Token 未过期
3. **Issuer**：Token 由本系统签发
4. **Type**：Token 类型正确（access/refresh）
5. **黑名单**：Token 未被撤销（扩展点）

---

### Generate Token（生成令牌）

**定义**：创建 JWT Token

**步骤**：
1. 构建 Claims
2. 设置过期时间
3. 使用密钥签名
4. 返回 Token 字符串

---

### Extract Claims（提取声明）

**定义**：从 JWT Token 中解析 Claims

**输入**：Token 字符串  
**输出**：Claims 对象

**用途**：
- 获取 User ID
- 检查 Token 类型
- 验证过期时间

---

## 错误码术语

### INVALID_CREDENTIALS
**含义**：邮箱或密码错误  
**场景**：登录  
**HTTP 状态码**：401

### EMAIL_ALREADY_EXISTS
**含义**：邮箱已被注册  
**场景**：注册  
**HTTP 状态码**：400

### INVALID_TOKEN
**含义**：Token 无效或已过期  
**场景**：Token 验证  
**HTTP 状态码**：401

### INVALID_REFRESH_TOKEN
**含义**：Refresh Token 无效  
**场景**：刷新 Token  
**HTTP 状态码**：401

---

## 参考资料

- [用例定义](./usecases.yaml)
- [业务规则](./rules.md)
- [领域事件](./events.md)
- [README](./README.md)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)

