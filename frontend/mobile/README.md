# Go-GenAI-Stack Mobile

【WIP】基于 React Native (Expo) 的跨平台移动应用。

## 技术栈

- **框架**: React Native 0.81.5 + Expo ~54.0.25
- **语言**: TypeScript 5.9.2
- **架构**: New Architecture Enabled
- **状态管理**: TBD
- **路由**: TBD (计划使用 React Navigation v7)
- **样式方案**: TBD (计划参考 Bluesky ALF)

## 快速开始

```bash
# 安装依赖（在 frontend 根目录执行）
pnpm install

# 启动开发服务器
pnpm --filter @go-genai-stack/mobile start

# iOS 模拟器
pnpm --filter @go-genai-stack/mobile ios

# Android 模拟器
pnpm --filter @go-genai-stack/mobile android

# Web 预览
pnpm --filter @go-genai-stack/mobile web
```

## 项目结构

```
mobile/
├── src/
│   ├── features/          # 功能模块（对齐后端领域）
│   │   ├── auth/         # 认证
│   │   ├── chat/         # 聊天
│   │   └── task/         # 任务管理
│   ├── components/       # 通用组件
│   │   └── ui/          # UI 组件库
│   ├── navigation/       # 路由配置
│   ├── hooks/           # 通用 Hooks
│   ├── stores/          # 状态管理
│   ├── services/        # API 服务
│   ├── utils/           # 工具函数
│   ├── i18n/            # 国际化
│   ├── styles/          # 样式主题
│   └── types/           # 类型定义
├── assets/              # 静态资源
├── App.tsx             # 应用入口
└── app.json            # Expo 配置
```

## 开发规范

### 目录命名
- **功能模块**: 小写 + 连字符（`features/task/`）
- **组件文件**: PascalCase（`TaskItem.tsx`）
- **工具文件**: camelCase（`formatDate.ts`）
- **类型文件**: 小写 + `.types.ts`（`task.types.ts`）

### 共享资源
本项目通过 pnpm workspace 共享以下包：
- `@go-genai-stack/types` - 类型定义（与后端同步）
- `@go-genai-stack/constants` - 常量（API 端点、错误码等）
- `@go-genai-stack/utils` - 通用工具函数

---

## 🚧 开发路线图 (TODO)

### 📊 阶段 1: 监控与日志

- [ ] **错误监控与日志系统**
  - [ ] 集成 Sentry 错误监控
  - [ ] 实现错误边界（Error Boundary）
  - [ ] 配置 Source Maps 上传
  - [ ] 实现结构化日志（debug/info/warn/error）
  - [ ] 日志本地持久化与上传
  - [ ] 性能监控（启动时间、API 耗时、FPS）

- [ ] **环境配置管理**
  - [ ] 多环境配置（dev/staging/prod）
  - [ ] 环境变量管理
  - [ ] API 端点配置

---

### 🎨 阶段 2: 样式系统（参考 Bluesky ALF）

- [ ] **设计系统规划**
  - [ ] 学习 [Bluesky ALF](https://github.com/bluesky-social/social-app) 样式架构
  - [ ] 定义 Design Tokens（颜色、间距、字体、圆角）
  - [ ] 规划亮色/暗色主题

- [ ] **样式方案选型**
  - [ ] 评估并选择：StyleSheet / Tamagui / NativeWind
  - [ ] 安装选定的样式库

- [ ] **实现基础架构**
  - [ ] 构建 Atoms 层（`<Text>`, `<View>`, `<Touchable>`）
  - [ ] 构建 Primitives 层（`<Button>`, `<Input>`, `<Card>`）
  - [ ] 实现主题系统（`ThemeProvider` + `useTheme`）
  - [ ] 实现暗色模式切换

---

### 🧭 阶段 3: 导航路由（React Navigation v7）

- [ ] **基础集成**
  - [ ] 安装 React Navigation v7 核心依赖
  - [ ] 配置 `NavigationContainer` + TypeScript 类型
  - [ ] 配置深链接（Deep Linking）

- [ ] **导航实现**
  - [ ] 实现 `BottomTabNavigator`（参考 Bluesky）
  - [ ] 实现 Stack Navigator（页面堆栈）
  - [ ] 实现 Modal Navigator
  - [ ] 实现 PostThread 样式导航示例

- [ ] **增强功能**
  - [ ] 导航状态持久化
  - [ ] 页面转场动画
  - [ ] 手势返回（iOS/Android 统一）

---

### 🌍 阶段 4: 国际化（i18n）

- [ ] **i18n 基础设施**
  - [ ] 安装 i18next + react-i18next + expo-localization
  - [ ] 配置 i18n（系统语言检测、语言切换、持久化）
  - [ ] 组织翻译文件结构

- [ ] **工具函数**
  - [ ] `useTranslation` Hook
  - [ ] 日期/时间本地化
  - [ ] 数字/货币格式化
  - [ ] 复数规则处理

---

### 💾 阶段 5: 存储与状态管理

- [ ] **本地存储**
  - [ ] 选型（AsyncStorage / MMKV / SQLite）
  - [ ] 实现存储抽象层
  - [ ] 数据序列化/反序列化

- [ ] **状态管理**
  - [ ] 选型（Zustand / Jotai / Redux Toolkit）
  - [ ] 实现全局状态（App Config、Theme）
  - [ ] 状态持久化中间件
  - [ ] 状态迁移机制

- [ ] **缓存策略**
  - [ ] 集成 TanStack Query
  - [ ] 配置 API 缓存策略
  - [ ] 实现缓存清理机制

---

### 🧩 阶段 6: UI 组件库

- [ ] **基础组件**
  - [ ] 表单组件（`<TextInput>`, `<Select>`, `<Checkbox>`, `<Switch>`）
  - [ ] 反馈组件（`<Toast>`, `<Alert>`, `<Modal>`, `<Skeleton>`）
  - [ ] 布局组件（`<Header>`, `<BottomSheet>`）

- [ ] **动画与手势**
  - [ ] 集成 Reanimated + Gesture Handler
  - [ ] 实现常用动画（淡入淡出、滑动、弹簧）
  - [ ] 实现手势交互（滑动删除、拖拽排序）

---

### 🔌 阶段 7: 网络层

- [ ] **HTTP 客户端**
  - [ ] 基于 axios 或 fetch
  - [ ] 请求/响应拦截器
  - [ ] 请求重试机制
  - [ ] 网络状态检测

- [ ] **WebSocket**（可选）
  - [ ] 实现 WebSocket 客户端
  - [ ] 断线重连 + 心跳检测

---

### 🧪 阶段 8: 测试基建

- [ ] **单元测试**
  - [ ] 配置 Jest + Testing Library
  - [ ] 组件测试 + Hook 测试
  - [ ] 测试覆盖率 > 80%

- [ ] **E2E 测试**（可选）
  - [ ] 配置 Detox 或 Maestro
  - [ ] 关键路径测试

---

### ⚙️ 阶段 9: 工程化

- [ ] **代码质量**
  - [ ] ESLint + Prettier 配置
  - [ ] TypeScript 严格模式
  - [ ] Husky + lint-staged

- [ ] **调试工具**
  - [ ] Flipper 集成
  - [ ] 开发者菜单（环境切换）

- [ ] **CI/CD**（可选）
  - [ ] 自动化测试
  - [ ] 自动化构建与部署
  - [ ] 代码静态分析

---

### 📱 阶段 10: 平台适配

- [ ] **iOS 适配**
  - [ ] 安全区域适配
  - [ ] 深色模式
  - [ ] iPad 支持

- [ ] **Android 适配**
  - [ ] 多分辨率适配
  - [ ] 深色主题
  - [ ] 低端机优化

---

## 📈 优先级建议

### 🔴 第一阶段（1-2 周）- 核心基建

快速搭建基础架构：

1. **监控与日志**（阶段 1）
   - Sentry 错误监控
   - 基础日志系统

2. **样式系统**（阶段 2）
   - 参考 Bluesky ALF
   - Design Tokens + 主题

3. **路由方案**（阶段 3）
   - React Navigation v7
   - TabsNavigator

### 🟡 第二阶段（2-4 周）- 核心功能

完善核心功能：

4. **国际化**（阶段 4）
   - i18n 基础设施

5. **存储与状态**（阶段 5）
   - 状态管理（Zustand/Jotai）
   - 本地存储
   - TanStack Query 缓存

6. **UI 组件库**（阶段 6）
   - 基础组件
   - 动画与手势

### 🟢 第三阶段（1-2 个月）- 完善体验

提升应用质量：

7. **网络层**（阶段 7）
   - HTTP 客户端
   - 请求重试

8. **测试基建**（阶段 8）
   - 单元测试
   - 测试覆盖率

9. **工程化**（阶段 9）
   - 代码质量工具
   - CI/CD（可选）

10. **平台适配**（阶段 10）
    - iOS/Android 基础适配

---

## 📚 参考资源

### 核心框架
- [Expo 文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- [React Navigation v7](https://reactnavigation.org/docs/7.x/getting-started)

### 开源参考项目
- [Bluesky Social App](https://github.com/bluesky-social/social-app) - 完整的 RN 应用参考
  - [ALF 设计系统](https://github.com/bluesky-social/social-app/tree/main/src/alf)
  - [UI Primitives](https://github.com/bluesky-social/social-app/tree/main/src/view/com/util)

### 样式与动画
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [Tamagui](https://tamagui.dev/) / [NativeWind](https://www.nativewind.dev/)

### 状态管理与数据
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) / [Jotai](https://jotai.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [MMKV](https://github.com/mrousavy/react-native-mmkv)

### 监控与测试
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Flipper](https://fbflipper.com/)

### 国际化
- [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)

---

## 🎯 质量目标

- **启动时间**: 冷启动 < 2s
- **帧率**: 保持 60 FPS
- **包体积**: < 50MB
- **崩溃率**: < 0.5%
- **测试覆盖率**: > 80%

---

## 🤝 贡献指南

1. 遵循项目根目录的 `.github/CONTRIBUTING.md`
2. 遵循 Cursor AI Rules (根目录 `.cursorrules`)
3. 保持前端功能与后端领域对齐
4. 编写测试覆盖新功能
5. 更新相关文档
6. 提交前运行 `pnpm lint` 和 `pnpm test`

## 📊 相关文档

- [INFRASTRUCTURE-CHECKLIST.md](./INFRASTRUCTURE-CHECKLIST.md) - 完整的基础设施对比清单
- [项目根目录 README](../../README.md) - 项目整体说明
- [后端 README](../../backend/README.md) - 后端架构文档

## 📄 License

MIT

