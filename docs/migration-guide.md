# 迁移指南：从传统架构到 Vibe Coding 最优架构

## 概述

本指南帮助你从现有项目结构迁移到 **Monorepo + Domain-First + Feature-First** 架构。

## 架构变化对比

| 维度 | 旧架构 | 新架构 |
|------|--------|--------|
| **代码库** | 分离的 repo | Monorepo |
| **前端目录** | `frontend/` | `web/` |
| **移动端** | 无 | `mobile/` |
| **类型同步** | `frontend/src/types/domain/` | `web/src/types/domains/` |
| **前端组织** | 技术分层 | Feature-First |

## 迁移步骤

### 步骤 1：创建新目录结构

```bash
# 在项目根目录执行

# 1. 创建新目录
mkdir -p web mobile shared scripts

# 2. 移动现有前端代码
mv frontend web
# 或者如果要重新组织：
# mv frontend web-old
# mkdir web

# 3. backend 保持不变
# backend/ 目录无需修改
```

### 步骤 2：更新 tygo 配置

```bash
# 编辑 tygo.yaml
```

```yaml
# 修改输出路径
packages:
  - path: "backend/domains/chat/http/dto"
    output_path: "web/src/types/domains/chat.ts"  # 改为 web/
    # ...
```

### 步骤 3：重新组织前端代码（可选但推荐）

#### 从技术分层到 Feature-First

**旧结构**：
```
frontend/src/
  components/
    ChatWindow.tsx
    MessageList.tsx
  hooks/
    useChat.ts
  stores/
    chatStore.ts
```

**新结构**：
```
web/src/
  features/
    chat/
      components/
        ChatWindow.tsx
        MessageList.tsx
      hooks/
        useChat.ts
      stores/
        chatStore.ts
      api/
        chatApi.ts
      README.md
```

#### 迁移脚本

```bash
#!/bin/bash
# scripts/migrate_to_feature_first.sh

# 创建 features 目录
mkdir -p web/src/features/chat/{components,hooks,stores,api}
mkdir -p web/src/features/llm/{components,hooks,stores,api}

# 移动聊天相关文件
mv web/src/components/Chat*.tsx web/src/features/chat/components/
mv web/src/components/Message*.tsx web/src/features/chat/components/
mv web/src/hooks/useChat.ts web/src/features/chat/hooks/
mv web/src/stores/chatStore.ts web/src/features/chat/stores/

# 创建 shared 目录
mkdir -p web/src/shared/{components,hooks,utils,api}

# 移动共享组件
mv web/src/components/ui web/src/shared/components/
```

### 步骤 4：更新导入路径

#### 4.1 使用 VS Code 全局替换

```
查找：from '@/components/
替换为：from '@/features/chat/components/

查找：from '@/hooks/
替换为：from '@/features/chat/hooks/

（根据实际情况调整）
```

#### 4.2 或使用 sed 批量替换

```bash
# 更新导入路径
find web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  's|@/components/Chat|@/features/chat/components/Chat|g'

find web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  's|@/hooks/useChat|@/features/chat/hooks/useChat|g'
```

### 步骤 5：初始化 Mobile 项目

```bash
# 创建 React Native 项目
cd mobile
npx react-native init GoGenAIStack --template react-native-template-typescript

# 或使用 Expo
# npx create-expo-app@latest -t with-typescript
```

### 步骤 6：设置类型共享

```bash
# 创建符号链接（推荐）
cd mobile/src
mkdir -p types
cd types
ln -s ../../../web/src/types/domains ./domains

# 验证
ls -la  # 应该看到 domains -> ../../../web/src/types/domains
```

### 步骤 7：更新脚本和配置

#### 7.1 更新 tygo 配置

已在步骤 2 完成。

#### 7.2 设置脚本权限

```bash
chmod +x scripts/*.sh
```

#### 7.3 测试类型同步

```bash
./scripts/sync_types.sh
```

检查生成的文件：
```bash
ls web/src/types/domains/
ls -la mobile/src/types/domains/  # 应该通过符号链接看到相同文件
```

### 步骤 8：更新 package.json

在项目根目录创建 `package.json`（用于统一脚本）：

```json
{
  "name": "go-genai-stack",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "./scripts/dev_all.sh",
    "sync": "./scripts/sync_types.sh",
    "test": "./scripts/test_all.sh",
    
    "dev:backend": "cd backend && go run cmd/server/main.go",
    "dev:web": "cd web && npm run dev",
    "dev:mobile": "cd mobile && npm run ios",
    
    "build:backend": "cd backend && go build -o bin/server cmd/server/main.go",
    "build:web": "cd web && npm run build",
    "build:mobile": "cd mobile && npm run build"
  }
}
```

### 步骤 9：更新 .gitignore

```bash
# 在项目根目录的 .gitignore 中添加
web/node_modules/
web/dist/
web/.vite/

mobile/node_modules/
mobile/android/build/
mobile/ios/build/
mobile/ios/Pods/

# 生成的类型文件（可选，根据团队约定）
# web/src/types/domains/
# 注意：如果提交类型文件，其他人无需运行 tygo
```

### 步骤 10：验证迁移

#### 10.1 同步类型

```bash
./scripts/sync_types.sh
```

#### 10.2 启动所有服务

```bash
npm run dev
# 或
./scripts/dev_all.sh
```

#### 10.3 运行测试

```bash
npm run test
# 或
./scripts/test_all.sh
```

## 渐进式迁移策略

如果项目较大，可以渐进式迁移：

### 阶段 1：保持旧结构，仅调整目录名

```bash
# 第 1 周：只改目录名
frontend/ → web/

# 更新 tygo.yaml 输出路径
# 更新导入路径（如果使用了绝对路径别名）
```

### 阶段 2：引入 Feature-First

```bash
# 第 2-3 周：逐个功能迁移
# 先迁移最独立的功能（如 chat）
web/src/
  components/  # 旧的保留
  features/    # 新的
    chat/      # 先迁移 chat
```

### 阶段 3：添加 Mobile

```bash
# 第 4 周：初始化 Mobile 项目
# 只复用类型和 API 调用逻辑
```

### 阶段 4：完全迁移

```bash
# 第 5 周：删除旧的技术分层目录
# 所有功能都迁移到 features/
```

## 常见问题

### Q: 导入路径别名需要更新吗？

**A**: 如果使用了路径别名（如 `@/components`），需要更新：

```typescript
// tsconfig.json 或 vite.config.ts
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],  // 新增
      "@/shared/*": ["./src/shared/*"]        // 新增
    }
  }
}
```

### Q: Mobile 的类型符号链接在 Windows 上有问题怎么办？

**A**: Windows 不支持符号链接，可以使用以下替代方案：

#### 方案 1：使用 npm workspace

```json
// package.json (根目录)
{
  "workspaces": [
    "web",
    "mobile",
    "shared/types"
  ]
}

// shared/types/package.json
{
  "name": "@go-genai-stack/types",
  "version": "1.0.0",
  "main": "index.ts"
}

// mobile/package.json
{
  "dependencies": {
    "@go-genai-stack/types": "*"
  }
}
```

#### 方案 2：复制文件（在 sync_types.sh 中）

```bash
# scripts/sync_types.sh 末尾添加
echo "Copying types to mobile..."
cp -r web/src/types/domains mobile/src/types/
```

### Q: 需要修改后端代码吗？

**A**: **不需要**。后端代码（`backend/`）完全不变，只是前端目录结构调整。

### Q: 如何处理现有的 Git 历史？

**A**: 使用 `git mv` 保留历史：

```bash
git mv frontend web
git commit -m "refactor: rename frontend to web for monorepo structure"
```

### Q: CI/CD 需要更新吗？

**A**: 需要更新路径：

```yaml
# 旧的 CI 配置
- name: Build Frontend
  run: cd frontend && npm run build

# 新的 CI 配置
- name: Build Web
  run: cd web && npm run build

- name: Build Mobile
  run: cd mobile && npm run build
```

## 迁移检查清单

- [ ] 创建新目录结构（web/, mobile/, scripts/）
- [ ] 移动前端代码（frontend/ → web/）
- [ ] 更新 tygo.yaml 配置
- [ ] 重新组织为 Feature-First（可选）
- [ ] 更新导入路径
- [ ] 初始化 Mobile 项目
- [ ] 设置类型共享（符号链接或 workspace）
- [ ] 更新脚本和配置文件
- [ ] 更新 .gitignore
- [ ] 测试类型同步
- [ ] 测试所有服务启动
- [ ] 运行测试套件
- [ ] 更新 CI/CD 配置
- [ ] 更新团队文档

## 回滚策略

如果迁移遇到问题，可以快速回滚：

```bash
# 回滚目录结构
git checkout HEAD -- .
git clean -fd

# 或者使用备份
mv web-old frontend
rm -rf web mobile
```

建议在迁移前：
1. 创建新分支：`git checkout -b refactor/monorepo`
2. 完整测试后再合并到主分支
3. 团队 code review

## 总结

迁移到 Vibe Coding 最优架构的核心价值：

| 收益 | 说明 |
|------|------|
| **统一管理** | 一个 repo，一套版本，一次构建 |
| **类型安全** | Go → TS，编译期检查，零手动维护 |
| **AI 友好** | Feature-First 让 AI 快速理解功能边界 |
| **跨端复用** | Web 和 Mobile 共享类型和逻辑 |
| **开发效率** | Monorepo 工具链，原子化提交 |

**时间投入**：
- 小型项目（< 10 个功能）：1-2 天
- 中型项目（10-30 个功能）：3-5 天
- 大型项目（> 30 个功能）：1-2 周（渐进式迁移）

**ROI**：迁移后，开发效率提升 30-50%，维护成本降低 40%。

