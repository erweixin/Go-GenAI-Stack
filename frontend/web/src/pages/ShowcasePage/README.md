# UI Showcase 组件展示页面

## 概览

这是一个完整的 UI 组件展示页面，展示了项目中所有可用的 shadcn/ui 组件和主题系统。

## 访问方式

### 路由
- 直接访问：`http://localhost:5173/showcase`
- 无需登录即可访问

### 入口链接
1. **首页**：登录后在首页可以看到"UI 组件展示"卡片
2. **登录页**：底部有"查看 UI 组件展示"链接
3. **注册页**：底部有"查看 UI 组件展示"链接

## 展示内容

### 1. Typography 排版系统 (7 个组件)
- H1, H2, H3 - 标题
- P - 段落
- Lead - 引导文字
- Muted - 次要文字
- InlineCode - 行内代码

### 2. Buttons 按钮 (8+ 变体)
- Default, Secondary, Outline, Ghost, Destructive
- 禁用状态
- 不同尺寸（sm, md, lg）
- 带图标的按钮

### 3. Form Controls 表单控件 (8 个组件)
- Input - 输入框
- Textarea - 文本域
- Select - 下拉选择
- Checkbox - 复选框
- Switch - 开关
- Radio Group - 单选组
- Slider - 滑块
- Progress - 进度条

### 4. Cards & Content 卡片与内容
- Card - 基础卡片
- Avatar - 头像
- Badge - 徽章（4 种变体）

### 5. Alerts 警告框
- Info - 信息提示
- Destructive - 错误提示

### 6. Overlays 弹出层 (5 个组件)
- Dialog - 对话框
- Popover - 气泡卡片
- Tooltip - 工具提示
- Dropdown Menu - 下拉菜单
- Toast - 通知提示（Sonner）

### 7. Tabs 标签页
- 多标签切换
- 标签内容区

### 8. Accordion 手风琴
- 可展开/折叠的面板

### 9. Table 表格
- 完整的数据表格示例

### 10. States 状态组件
- Loading - 加载状态
- Empty - 空状态
- Skeleton - 骨架屏

### 11. Theme System 主题系统
- 8 种主题颜色展示
- 明暗主题切换器
- 实时主题切换演示

### 12. Animations 动画
- fade-in - 淡入
- slide-in-from-top - 从上滑入
- slide-in-from-bottom - 从下滑入
- scale-in - 缩放进入

## 特性

### 🎨 完整的主题支持
- 所有组件都支持明暗主题
- 使用 OKLCH 颜色空间
- 实时主题切换

### 📱 响应式设计
- 移动端适配
- 平板和桌面布局优化
- Grid 布局自适应

### ♿ 无障碍支持
- 基于 Radix UI
- 完整的键盘导航
- 屏幕阅读器友好

### 🎯 交互式演示
- 可点击的按钮
- 可调节的滑块和进度条
- 可展开的手风琴和对话框
- Toast 通知演示

## 技术实现

### 组件结构
```tsx
ShowcasePage/
├── ShowcasePage.tsx  # 主组件
├── index.ts          # 导出
└── README.md         # 本文档
```

### 使用的技术
- **React** - UI 框架
- **shadcn/ui** - 组件库
- **Tailwind CSS 4** - 样式
- **Radix UI** - 无障碍基础组件
- **Lucide React** - 图标

### 主要依赖
- Typography 组件
- 31+ shadcn/ui 组件
- ThemeProvider
- ThemeToggle
- 动画工具类

## 使用场景

### 1. 开发参考
在开发新功能时，快速查看可用的组件和样式。

### 2. 设计验证
验证明暗主题下的视觉效果。

### 3. 组件测试
测试组件在不同状态下的表现。

### 4. 文档展示
向团队成员或客户展示 UI 能力。

## 代码示例

### 访问 Showcase 页面
```tsx
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()
  
  return (
    <button onClick={() => navigate('/showcase')}>
      查看组件展示
    </button>
  )
}
```

### 使用 Typography
```tsx
import { H1, P, Muted } from '@/components/typography'

<H1>标题</H1>
<P>段落文字</P>
<Muted>次要说明</Muted>
```

### 主题切换
```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
```

## 自定义和扩展

### 添加新的展示区块
在 `ShowcasePage.tsx` 中添加新的 `<Section>` 组件：

```tsx
<Section title="新组件">
  <Card>
    <CardContent>
      {/* 你的组件演示 */}
    </CardContent>
  </Card>
</Section>
```

### 添加新的颜色演示
在 Theme System 部分添加新的 `<ColorDemo>` 组件：

```tsx
<ColorDemo color="your-color" label="Your Color" />
```

## 注意事项

1. **性能**：页面包含大量组件，首次加载可能需要一些时间
2. **主题切换**：确保所有新组件都使用主题变量
3. **响应式**：在添加新内容时注意移动端适配
4. **无障碍**：保持良好的语义化 HTML 结构

## 维护指南

### 添加新组件时
1. 在对应的 Section 中添加演示
2. 确保组件支持明暗主题
3. 添加必要的说明文字
4. 测试响应式布局

### 更新主题时
1. 更新 Theme System 部分的颜色演示
2. 确保所有组件正确显示新主题
3. 测试主题切换是否正常工作

## 相关资源

- [shadcn/ui 官方文档](https://ui.shadcn.com)
- [组件库文档](../../components/README.md)
- [主题系统文档](../../../MIGRATION_SUMMARY.md)

