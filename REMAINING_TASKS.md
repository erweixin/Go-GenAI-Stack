# 剩余待办事项

## ✅ 已完成的工作
- ✅ 后端 DDD 架构完整实现（Model + Repository + Service + Handler）
- ✅ 数据库 Schema 设计
- ✅ 8个 API 端点
- ✅ 前端类型定义（TypeScript）
- ✅ API 客户端和 React Query Hooks
- ✅ 商品列表页面组件
- ✅ 路由注册（刚刚完成）

---

## 📋 剩余的关键任务

### 1. 数据库迁移（⚠️ 必须完成）
由于 Docker 未运行，数据库迁移尚未执行。

**操作步骤**：
```bash
# 启动 Docker
cd docker
docker-compose up -d

# 生成并应用迁移
cd ../backend/database
make diff NAME=add_product_domain
make apply
```

**验证**：
```bash
# 连接数据库查看 products 表
docker exec -it go-genai-postgres psql -U postgres -d go_genai_stack
\d products
```

---

### 2. 前端功能补充（重要但非阻塞）

#### 2.1 商品创建/编辑表单 ⭐ 高优先级
**缺失内容**：
- 创建商品表单组件
- 编辑商品表单组件
- 表单验证
- 图片上传功能

**建议实现**：
```tsx
// frontend/web/src/features/product/components/ProductFormModal.tsx
// 统一的创建/编辑表单弹窗
```

#### 2.2 商品详情页面
**缺失内容**：
- 商品详情展示页面
- 操作历史记录

**建议实现**：
```tsx
// frontend/web/src/features/product/pages/ProductDetailPage.tsx
```

#### 2.3 导航菜单集成
**缺失内容**：
- 在主导航中添加"商品管理"链接

**操作**：
找到导航组件（可能是 `Layout.tsx` 或 `Sidebar.tsx`），添加：
```tsx
<NavLink to="/products">商品管理</NavLink>
```

#### 2.4 样式优化
**当前状态**：商品列表页面使用基础样式

**建议**：
- 集成 UI 组件库（Ant Design / Material-UI）
- 或使用 Tailwind CSS
- 添加响应式布局

#### 2.5 错误处理增强
**缺失内容**：
- 全局错误边界
- 友好的错误提示
- 网络错误重试

---

### 3. 后端功能补充（可选扩展）

#### 3.1 认证中间件集成
**当前状态**：临时从 Header 获取 OperatorID

**需要修改**：
```go
// backend/domains/product/handlers/helpers.go
func GetOperatorID(c *app.RequestContext) (string, error) {
    // 从 JWT 或 Session 获取真实用户 ID
    userID, exists := c.Get("user_id")
    if !exists {
        return "", fmt.Errorf("UNAUTHORIZED: 未登录")
    }
    return userID.(string), nil
}
```

**路由更新**：
```go
// backend/infrastructure/bootstrap/routes.go
// 添加认证中间件
producthttp.RegisterRoutes(api, container.ProductHandlerDeps, container.AuthMiddleware)
```

#### 3.2 图片上传服务
**缺失内容**：
- 图片上传 API
- 文件存储（本地/OSS）
- 图片处理（压缩、裁剪）

**建议实现**：
```go
POST /api/upload/image
```

#### 3.3 批量操作 API
**缺失内容**：
- 批量上架/下架
- 批量导入（Excel）
- 批量导出

#### 3.4 数据统计 API
**缺失内容**：
- 销售统计
- 收益分析
- 热门商品排行

---

### 4. 测试补充（推荐完成）

#### 4.1 后端测试
**当前状态**：只有一个示例测试文件

**需要添加**：
- Service 层完整测试
- Repository 层集成测试
- Handler 层 HTTP 测试

**文件**：
```
backend/domains/product/tests/
├── create_product_test.go ✅
├── update_product_test.go
├── list_products_test.go
├── shelve_product_test.go
└── repository_test.go
```

#### 4.2 前端测试
**缺失内容**：
- 组件单元测试
- Hooks 测试
- API 客户端测试

**工具**：
- Vitest
- React Testing Library

---

### 5. 生产就绪清单（部署前必须）

#### 5.1 安全
- [ ] API 认证/授权
- [ ] 输入验证和清理
- [ ] SQL 注入防护（✅ 使用参数化查询）
- [ ] XSS 防护
- [ ] CSRF 防护

#### 5.2 性能
- [ ] 数据库索引优化（✅ 基础索引已添加）
- [ ] API 响应缓存
- [ ] 前端懒加载（✅ 已实现）
- [ ] CDN 配置（静态资源）

#### 5.3 监控
- [ ] 日志记录（结构化日志）
- [ ] 错误追踪（Sentry）
- [ ] 性能监控（APM）
- [ ] 健康检查端点（✅ 已有 /health）

#### 5.4 文档
- [ ] API 文档（Swagger/OpenAPI）
- [ ] 用户手册
- [ ] 部署文档
- [ ] 运维手册

---

## 📊 优先级排序

### 🔥 必须立即完成
1. **数据库迁移** - 否则后端无法运行
2. **导航菜单集成** - 否则用户无法访问商品管理页面

### ⭐ 高优先级（本周完成）
3. **商品创建/编辑表单** - 核心功能缺失
4. **认证中间件集成** - 安全问题
5. **基础测试** - 确保代码质量

### 📌 中优先级（下周完成）
6. **商品详情页面**
7. **样式优化**
8. **图片上传服务**

### 📦 低优先级（可选扩展）
9. **批量操作**
10. **数据统计**
11. **高级筛选**

---

## 🚀 快速启动清单

在开始使用之前，确保完成以下步骤：

### 后端
```bash
# 1. 启动 Docker
cd docker && docker-compose up -d

# 2. 应用数据库迁移
cd ../backend/database
make diff NAME=add_product_domain
make apply

# 3. 启动后端
cd ..
go run cmd/server/main.go
```

### 前端
```bash
# 1. 安装依赖
cd frontend/web
npm install

# 2. 配置环境变量
echo "VITE_API_BASE_URL=http://localhost:8080" > .env

# 3. 启动开发服务器
npm run dev
```

### 验证
1. 访问 http://localhost:5173/products
2. 测试创建商品（使用 Postman 或 curl）
3. 验证列表、上架、下架、删除功能

---

## 💡 建议

### 开发顺序
1. 先完成数据库迁移（必须）
2. 添加导航链接（5分钟）
3. 实现创建/编辑表单（2小时）
4. 集成认证中间件（1小时）
5. 优化样式和体验（按需）

### 技术选型建议
- **UI 组件库**：Ant Design（完整、文档好）或 Shadcn UI（现代、可定制）
- **表单管理**：React Hook Form + Zod
- **样式方案**：Tailwind CSS
- **状态管理**：React Query（已使用）+ Zustand（全局状态）

---

## 📞 需要帮助？

如果在实施过程中遇到问题：
1. 查看 `PRODUCT_MODULE_IMPLEMENTATION.md` 了解架构设计
2. 参考 Task 领域的实现（`backend/domains/task/`）
3. 检查单元测试中的示例用法

**祝开发顺利！** 🎉

