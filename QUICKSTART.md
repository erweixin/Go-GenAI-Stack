# Go-GenAI-Stack 快速开始指南

## 🎉 恭喜！认证系统已实现

你的项目现在已经是一个**开箱即用**的完整 Starter，包含：

✅ 完整的用户认证系统（注册、登录、Token 刷新）  
✅ 后端 DDD 架构（User Domain + Auth Domain）  
✅ 前端 React + TypeScript + Tailwind CSS  
✅ JWT Token 管理和自动刷新  
✅ 美观的 UI 组件和响应式设计  

---

## 🚀 30 秒快速启动

### 1. 启动数据库（Docker）

```bash
cd docker
docker-compose up -d postgres
```

### 2. 应用数据库迁移

```bash
cd backend
./scripts/schema.sh apply
```

### 3. 配置环境变量

创建 `backend/.env` 文件：

```bash
# JWT 配置（必需）
JWT_SECRET=your-super-secret-key-change-this-in-production-32-chars-min

# 数据库配置
APP_DATABASE_HOST=localhost
APP_DATABASE_PORT=5432
APP_DATABASE_USER=genai
APP_DATABASE_PASSWORD=genai_password
APP_DATABASE_DATABASE=go_genai_stack
```

创建 `frontend/web/.env` 文件：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

### 4. 启动后端

```bash
cd backend
go run cmd/server/main.go
```

### 5. 启动前端

```bash
cd frontend/web
pnpm install  # 首次运行
pnpm dev
```

### 6. 打开浏览器

访问：http://localhost:5173/login

🎊 现在你可以注册、登录并使用完整的认证系统了！

---

## 📁 项目结构总览

```
Go-GenAI-Stack/
├── backend/
│   ├── domains/
│   │   ├── user/              # 用户领域（资料管理）
│   │   │   ├── model/         # User 实体
│   │   │   ├── repository/    # 数据访问
│   │   │   ├── service/       # 业务逻辑
│   │   │   └── handlers/      # HTTP 接口
│   │   │
│   │   ├── auth/              # 认证领域（登录注册）
│   │   │   ├── service/       # JWT + Auth Service
│   │   │   └── handlers/      # 登录/注册接口
│   │   │
│   │   └── task/              # 任务领域（示例）
│   │
│   ├── infrastructure/
│   │   ├── config/            # 配置管理
│   │   ├── middleware/        # 认证中间件（JWT 验证）
│   │   └── database/          # 数据库 Schema
│   │
│   └── cmd/server/main.go     # 入口文件
│
├── frontend/
│   └── web/
│       ├── src/
│       │   ├── components/ui/ # UI 组件（Button, Input, Card）
│       │   ├── services/      # API 服务
│       │   ├── stores/        # Zustand Store
│       │   ├── pages/         # 页面（Login, Register, Home）
│       │   └── lib/           # 工具函数
│       │
│       └── package.json
│
└── docker/                    # Docker 配置
```

---

## 🔐 API 接口

### 认证接口（无需认证）

```bash
# 注册
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "username": "john_doe",
  "full_name": "John Doe"
}

# 登录
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# 刷新 Token
POST /api/auth/refresh
{
  "refresh_token": "your_refresh_token"
}
```

### 用户接口（需要认证）

```bash
# 获取当前用户资料
GET /api/users/me
Authorization: Bearer YOUR_ACCESS_TOKEN

# 更新用户资料
PUT /api/users/me
Authorization: Bearer YOUR_ACCESS_TOKEN
{
  "username": "new_username",
  "full_name": "New Name"
}

# 修改密码
POST /api/users/me/change-password
Authorization: Bearer YOUR_ACCESS_TOKEN
{
  "old_password": "old_password",
  "new_password": "new_password"
}
```

---

## 🎨 前端页面

### 1. 登录页面
- **路径**：`/login`
- **功能**：邮箱 + 密码登录
- **特性**：表单验证、错误提示、加载状态

### 2. 注册页面
- **路径**：`/register`
- **功能**：注册新账户
- **特性**：密码强度指示、密码确认、表单验证

### 3. 首页
- **路径**：`/`
- **功能**：显示用户信息、登出
- **特性**：受保护路由、自动 Token 刷新

---

## 🛠️ 技术栈

### 后端
- **语言**：Go 1.23
- **框架**：CloudWeGo Hertz
- **架构**：DDD（领域驱动设计）
- **数据库**：PostgreSQL + database/sql
- **认证**：JWT (HS256)
- **密码**：bcrypt

### 前端
- **语言**：TypeScript
- **框架**：React 19 + Vite
- **路由**：React Router v7
- **状态**：Zustand
- **HTTP**：Axios
- **UI**：Tailwind CSS + 自定义组件
- **图标**：Lucide React

---

## 📚 核心文档

1. **后端文档**
   - [User Domain README](backend/domains/user/README.md)
   - [Auth Domain README](backend/domains/auth/README.md)
   - [User Use Cases](backend/domains/user/usecases.yaml)
   - [Auth Use Cases](backend/domains/auth/usecases.yaml)

2. **前端文档**
   - [前端认证指南](frontend/web/README_AUTH.md)

3. **架构文档**
   - [Vibe Coding Friendly](docs/Core/vibe-coding-friendly.md)
   - [DDD 架构](docs/Core/architecture-overview.md)

---

## 🔒 安全特性

### 后端安全
- ✅ bcrypt 密码哈希（Cost: 10）
- ✅ JWT Token（Access: 1h, Refresh: 7d）
- ✅ Token 签名验证
- ✅ 统一错误消息（不泄露用户是否存在）
- ✅ CORS 配置

### 前端安全
- ✅ Token 存储在 localStorage
- ✅ 自动 Token 刷新
- ✅ 401 错误自动登出
- ✅ 受保护的路由
- ✅ HTTPS 传输（生产环境）

---

## 🚧 待实现功能（扩展点）

### 高优先级
- [ ] 邮箱验证（注册后发送验证链接）
- [ ] 密码重置（忘记密码流程）
- [ ] Token 黑名单（登出功能，使用 Redis）

### 中优先级
- [ ] Rate Limiting（防暴力破解）
- [ ] OAuth2 集成（Google、GitHub）
- [ ] 用户头像上传

### 低优先级
- [ ] 多因素认证（TOTP、SMS）
- [ ] 登录历史记录
- [ ] 异地登录检测

---

## 🐛 故障排查

### 后端无法启动

**检查**：
1. 数据库是否运行：`docker ps`
2. 环境变量是否配置：`JWT_SECRET`
3. 数据库迁移是否完成：`./scripts/schema.sh apply`

### 前端无法连接后端

**检查**：
1. 后端是否运行在 `http://localhost:8080`
2. `.env` 文件中的 `VITE_API_BASE_URL` 是否正确
3. 浏览器控制台是否有 CORS 错误

### Token 验证失败

**检查**：
1. `JWT_SECRET` 是否配置正确
2. Token 是否已过期
3. Token 格式是否为 `Bearer <token>`

---

## 📞 获取帮助

如果遇到问题：

1. 查看相关文档（见上方"核心文档"）
2. 检查浏览器控制台和后端日志
3. 查看 `usecases.yaml` 了解业务逻辑
4. 查看 `rules.md` 了解业务规则

---

## 🎉 下一步

现在你已经有了一个完整的认证系统！可以：

1. ✅ 自定义 UI 主题和样式
2. ✅ 添加更多业务领域（参考 Task Domain）
3. ✅ 实现邮箱验证和密码重置
4. ✅ 集成 OAuth2 登录
5. ✅ 部署到生产环境

**祝你开发愉快！** 🚀

---

## 📄 许可证

本项目采用 MIT 许可证。

