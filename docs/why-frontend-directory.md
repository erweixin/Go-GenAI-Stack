# 为什么使用 `frontend/` 目录？

## 🤔 两种方案对比

### 方案一：平铺式（之前的方案）

```
go-genai-stack/
├── backend/
├── web/
├── mobile/
├── shared/
└── scripts/
```

### 方案二：嵌套式（当前方案）★ 推荐

```
go-genai-stack/
├── backend/
├── frontend/        # 前端 Monorepo
│   ├── web/
│   ├── mobile/
│   └── shared/
└── scripts/
```

## ✅ 方案二的优势

### 1. **清晰的职责分离**

| 角色 | 关注目录 | 优势 |
|------|---------|------|
| 后端开发者 | `backend/` | 只需关注后端代码 |
| 前端开发者 | `frontend/` | 只需关注前端代码，无需理解后端结构 |
| 全栈开发者 | 两者都看 | 边界清晰，不会混淆 |

### 2. **符合业界惯例**

大多数全栈项目采用类似结构：

```
# Next.js 全栈项目
project/
├── apps/
│   ├── web/
│   └── api/

# Nx Monorepo
project/
├── apps/
│   ├── frontend/
│   └── backend/

# Turborepo
project/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── api/
```

### 3. **前端 Monorepo 独立管理**

```bash
# 前端开发者可以独立工作
cd frontend
pnpm install      # 只安装前端依赖
pnpm dev          # 启动前端
pnpm test         # 测试前端
pnpm build        # 构建前端
```

**好处**：
- 前端依赖管理独立
- 可以有独立的前端 CI/CD Pipeline
- 前端 package.json 更清晰
- 符合前端团队的工作习惯

### 4. **更好的 .gitignore 管理**

```
# 前端所有生成文件都在 frontend/ 下
frontend/node_modules/
frontend/web/dist/
frontend/mobile/.expo/
frontend/shared/types/domains/*.ts  # tygo 生成

# 后端生成文件
backend/bin/
backend/tmp/
```

清晰明了，不会混淆。

### 5. **部署更灵活**

```yaml
# Docker Compose
services:
  backend:
    build: ./backend
    
  web:
    build: ./frontend/web
    
  mobile-api:  # 如果 Mobile 需要独立 API
    build: ./frontend/mobile
```

或者：

```yaml
# 前端统一部署
frontend:
  build: ./frontend
  command: pnpm build
```

### 6. **pnpm workspace 配置更直观**

**方案二（frontend/ 下）**：

```yaml
# frontend/pnpm-workspace.yaml
packages:
  - 'web'
  - 'mobile'
  - 'shared/*'
```

**方案一（根目录）**：

```yaml
# pnpm-workspace.yaml（根目录）
packages:
  - 'web'
  - 'mobile'
  - 'shared/*'
  # 后端没有 pnpm 包，但看起来像是 workspace 的一部分，容易混淆
```

### 7. **更容易理解的项目结构**

新成员看到项目结构时：

```
go-genai-stack/
├── backend/        # "哦，这是后端"
├── frontend/       # "哦，这是前端"
└── docs/          # "这是文档"
```

vs.

```
go-genai-stack/
├── backend/        # "后端"
├── web/           # "这是前端？"
├── mobile/        # "这也是前端？"
├── shared/        # "这是前端还是后端的共享？"
└── scripts/       # "这是哪个的脚本？"
```

## 📊 对比总结

| 维度 | 平铺式（方案一） | 嵌套式（方案二）★ |
|------|----------------|-----------------|
| **职责分离** | 较弱 | ✅ 强 |
| **业界惯例** | 少见 | ✅ 常见 |
| **新人理解** | 需要解释 | ✅ 直观 |
| **前端独立性** | 弱 | ✅ 强 |
| **CI/CD 分离** | 较难 | ✅ 容易 |
| **部署灵活性** | 一般 | ✅ 高 |
| **配置清晰度** | 一般 | ✅ 清晰 |

## 🎯 实际应用场景

### 场景 1：前端团队独立开发

```bash
# 前端团队克隆代码后
cd frontend
pnpm install
pnpm dev:web

# 无需关心后端，只需 API 文档和类型定义
```

### 场景 2：前端 CI/CD

```yaml
# .github/workflows/frontend.yml
name: Frontend CI

on:
  push:
    paths:
      - 'frontend/**'  # 只在前端代码变化时触发

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install
        run: cd frontend && pnpm install
      - name: Build
        run: cd frontend && pnpm build
      - name: Test
        run: cd frontend && pnpm test
```

### 场景 3：独立部署

```bash
# 部署后端
cd backend && docker build -t backend .

# 部署前端
cd frontend && docker build -t frontend .

# 或者分别部署 Web 和 Mobile
cd frontend/web && docker build -t web .
cd frontend/mobile && expo build
```

## 📝 迁移成本

从方案一迁移到方案二非常简单：

```bash
# 1. 创建 frontend 目录
mkdir frontend

# 2. 移动文件
mv web frontend/
mv mobile frontend/
mv shared frontend/

# 3. 移动 pnpm-workspace.yaml
mv pnpm-workspace.yaml frontend/

# 4. 更新配置
# - tygo.yaml: shared/types → frontend/shared/types
# - .cursorrules: 更新路径
# - scripts/sync_types.sh: 更新输出提示
```

## 🎉 结论

**方案二（`frontend/` 目录）更适合 Go-GenAI-Stack**，原因：

1. ✅ **清晰的前后端分离**
2. ✅ **符合业界惯例**
3. ✅ **前端独立管理**
4. ✅ **更好的可扩展性**
5. ✅ **新人友好**

## 🔗 相关文档

- [目录结构详解](./directory-structure-frontend.md)
- [Monorepo 设置指南](./monorepo-setup.md)
- [类型同步指南](./type-sync.md)

