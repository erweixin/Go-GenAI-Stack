# Auth 用例（Use Cases）

对齐后端 `backend/domains/auth/usecases.yaml`

---

## 1. Register - 用户注册

**触发**: 用户访问注册页面并提交表单

**输入**:
- `email` (string, required): 邮箱
- `password` (string, required): 密码（最少8字符）
- `username` (string, optional): 用户名
- `full_name` (string, optional): 全名

**输出**:
- `user_id` (string): 用户 ID
- `email` (string): 邮箱
- `access_token` (string): 访问令牌
- `refresh_token` (string): 刷新令牌
- `expires_in` (number): 过期时间（秒）

**组件**: `RegisterForm`  
**Hook**: `useRegister`  
**API**: `POST /api/auth/register`

---

## 2. Login - 用户登录

**触发**: 用户访问登录页面并提交表单

**输入**:
- `email` (string, required): 邮箱
- `password` (string, required): 密码

**输出**:
- `user_id` (string): 用户 ID
- `email` (string): 邮箱
- `access_token` (string): 访问令牌
- `refresh_token` (string): 刷新令牌
- `expires_in` (number): 过期时间（秒）

**组件**: `LoginForm`  
**Hook**: `useLogin`  
**API**: `POST /api/auth/login`

---

## 3. RefreshToken - 刷新令牌

**触发**: Access Token 过期时自动调用

**输入**:
- `refresh_token` (string, required): 刷新令牌

**输出**:
- `access_token` (string): 新的访问令牌
- `refresh_token` (string): 新的刷新令牌
- `expires_in` (number): 过期时间（秒）

**Hook**: `useRefreshToken`  
**API**: `POST /api/auth/refresh`

---

## 4. Logout - 用户登出

**触发**: 点击登出按钮

**输入**: 无

**输出**: 无

**Hook**: `useLogout`  
**API**: `POST /api/auth/logout`

