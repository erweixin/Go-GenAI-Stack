# Node.js 后端迁移计划

## 当前进度

- ✅ **Task 领域** - 已完成（6 个用例，完整三层架构）

## 迁移优先级

### 阶段 1: 基础领域（高优先级）

#### 1.1 User 领域 ⭐ 下一步
**原因**：Auth 领域依赖 User，必须先完成

**用例**：
- `GetUserProfile` - 获取用户资料
- `UpdateUserProfile` - 更新用户资料
- `ChangePassword` - 修改密码

**技术要点**：
- 密码哈希：使用 `bcrypt` (Node.js: `bcryptjs`)
- 用户状态管理：Active/Inactive/Banned
- 邮箱验证状态

**依赖**：
- 数据库：`users` 表（已存在）
- 无其他领域依赖

---

#### 1.2 Auth 领域 ⭐ 第二步
**原因**：为其他领域提供认证保护

**用例**：
- `Register` - 用户注册
- `Login` - 用户登录
- `RefreshToken` - 刷新 Token

**技术要点**：
- JWT Token 生成：使用 `jsonwebtoken`
- Access Token：1 小时有效期
- Refresh Token：7 天有效期
- 密码验证：调用 User 领域

**依赖**：
- User 领域（必须先完成）
- JWT 密钥配置

---

### 阶段 2: 集成与完善

#### 2.1 Task 领域认证集成
**工作**：
- 添加 JWT 中间件
- 从 Token 提取 `user_id`
- 移除硬编码的 `default-user`
- 实现真正的用户隔离

**影响**：
- 所有 Task Handler 需要更新
- 添加认证中间件

---

### 阶段 3: 扩展领域（可选）

#### 3.1 Chat 领域（如果存在）
#### 3.2 LLM 领域（如果存在）

---

## 技术栈映射

| Go 后端 | Node.js 后端 |
|---------|-------------|
| `golang.org/x/crypto/bcrypt` | `bcryptjs` |
| `github.com/golang-jwt/jwt/v5` | `jsonwebtoken` |
| `github.com/google/uuid` | `crypto.randomUUID()` |
| `database/sql` | `kysely` |

---

## 迁移检查清单

### User 领域
- [ ] 复制显式知识文件
- [ ] 创建 User 模型（包含密码哈希验证）
- [ ] 实现 UserRepository（Kysely）
- [ ] 实现 UserService（3 个用例）
- [ ] 创建 DTO 和 Handlers
- [ ] 注册路由
- [ ] 集成到主应用

### Auth 领域
- [ ] 复制显式知识文件
- [ ] 实现 JWTService（Token 生成/验证）
- [ ] 实现 AuthService（3 个用例）
- [ ] 创建 DTO 和 Handlers
- [ ] 注册路由
- [ ] 集成到主应用
- [ ] 添加 JWT 中间件

### Task 领域完善
- [ ] 添加认证中间件
- [ ] 更新所有 Handler 使用真实 `user_id`
- [ ] 测试认证流程

---

## 建议

**立即开始**：User 领域迁移

**原因**：
1. 无外部依赖，可以独立完成
2. Auth 领域依赖它
3. Task 领域需要它来实现真正的用户隔离

**预计工作量**：
- User 领域：2-3 小时
- Auth 领域：3-4 小时
- Task 集成：1 小时

---

**下一步行动**：开始迁移 User 领域？

