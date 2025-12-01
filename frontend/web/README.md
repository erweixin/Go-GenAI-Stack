# Frontend Web Application - Product Management

这是积分商城商品管理模块的前端实现（React + TypeScript）。

## 已实现功能

### 商品管理
- ✅ 商品列表展示（分页、搜索、筛选）
- ✅ 商品上架/下架
- ✅ 商品删除（限下架且未兑换）
- ⏳ 商品创建/编辑（待实现）
- ⏳ 商品详情查看（待实现）

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **React Query** - 数据获取和缓存
- **Axios** - HTTP 客户端

## 目录结构

```
frontend/web/src/
├── api/
│   └── productApi.ts          # Product API 客户端
├── features/
│   └── product/
│       ├── pages/
│       │   └── ProductListPage.tsx  # 商品列表页
│       ├── components/         # 组件（待实现）
│       └── hooks/
│           └── useProducts.ts  # React Query hooks
└── ...
```

## 快速开始

### 安装依赖

```bash
cd frontend/web
npm install
```

### 开发模式

```bash
npm run dev
```

访问：http://localhost:5173

### 环境变量

创建 `.env` 文件：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/products | 获取商品列表 |
| POST | /api/products | 创建商品 |
| GET | /api/products/:id | 获取商品详情 |
| PUT | /api/products/:id | 更新商品 |
| DELETE | /api/products/:id | 删除商品 |
| POST | /api/products/:id/shelve | 上架商品 |
| POST | /api/products/:id/unshelve | 下架商品 |

## 类型定义

类型文件位于：`frontend/shared/types/domains/product.ts`

从后端 Go DTO 自动生成，确保类型一致性。

## 待实现功能

1. **商品创建/编辑表单**
   - 表单验证
   - 图片上传
   - 富文本描述

2. **商品详情页**
   - 完整信息展示
   - 操作历史

3. **批量操作**
   - 批量上架/下架
   - 批量导入/导出（Excel）

4. **高级筛选**
   - 按金币类型筛选
   - 按操作人筛选
   - 按时间范围筛选

5. **数据统计**
   - 销售统计
   - 收益分析

## 样式

当前使用基础 CSS。可以集成：
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Ant Design** / **Material-UI** - UI 组件库

## 测试

```bash
npm run test
```

## 构建

```bash
npm run build
```

构建产物：`dist/`

---

**注意**：这是一个基础实现，实际项目中需要完善表单、样式、错误处理和用户体验。
