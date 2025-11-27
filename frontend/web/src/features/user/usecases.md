# User 用例（Use Cases）

对齐后端 `backend/domains/user/usecases.yaml`

---

## 1. GetUserProfile - 获取用户资料

**触发**: 进入个人资料页面

**输入**:
- `user_id` (string): 用户 ID（from JWT）

**输出**:
- `user_id` (string): 用户 ID
- `email` (string): 邮箱
- `username` (string): 用户名
- `full_name` (string): 全名
- `avatar_url` (string): 头像 URL
- `status` (string): 用户状态
- `email_verified` (boolean): 邮箱是否验证
- `created_at` (string): 创建时间
- `updated_at` (string): 更新时间
- `last_login_at` (string, optional): 最后登录时间

**Hook**: `useUserProfile`  
**API**: `GET /api/users/me`

---

## 2. UpdateUserProfile - 更新用户资料

**触发**: 用户修改资料并提交

**输入**:
- `username` (string, optional): 用户名
- `full_name` (string, optional): 全名
- `avatar_url` (string, optional): 头像 URL

**输出**:
- `user_id` (string): 用户 ID
- `username` (string): 用户名
- `full_name` (string): 全名
- `avatar_url` (string): 头像 URL
- `updated_at` (string): 更新时间

**Hook**: `useUserUpdate`  
**API**: `PUT /api/users/me`

---

## 3. ChangePassword - 修改密码

**触发**: 用户修改密码并提交

**输入**:
- `old_password` (string, required): 旧密码
- `new_password` (string, required): 新密码

**输出**:
- `success` (boolean): 是否成功
- `message` (string): 提示消息

**Hook**: `usePasswordChange`  
**API**: `POST /api/users/me/change-password`

