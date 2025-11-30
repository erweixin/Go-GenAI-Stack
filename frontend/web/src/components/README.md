# 组件库文档

## 概览

本项目使用 **shadcn/ui** 作为核心组件库，基于 Tailwind CSS 4 和 Radix UI 构建。

## 组件列表

### 自定义组件 (5 个)
- `ConfirmDialog` - 确认对话框（替代 window.confirm）⭐ 新增
- `ErrorBoundary` - 错误边界
- `PageLoader` - 页面加载器
- `ProtectedRoute` - 路由保护
- `ThemeToggle` - 主题切换

### shadcn/ui 组件 (33 个)

### 基础组件
- `button` - 按钮
- `input` - 输入框
- `label` - 标签
- `textarea` - 文本域

### 布局组件
- `card` - 卡片
- `separator` - 分隔符
- `scroll-area` - 滚动区域

### 反馈组件
- `alert` - 警告框
- `badge` - 徽章
- `skeleton` - 骨架屏
- `progress` - 进度条
- `spinner` - 加载指示器（自定义）
- `empty` - 空状态（自定义）
- `sonner` - Toast 通知

### 表单组件
- `form` - 表单（基于 react-hook-form）
- `checkbox` - 复选框
- `radio-group` - 单选组
- `switch` - 开关
- `select` - 选择器
- `slider` - 滑块

### 导航组件
- `tabs` - 标签页
- `breadcrumb` - 面包屑
- `dropdown-menu` - 下拉菜单

### 弹层组件
- `dialog` - 对话框
- `popover` - 弹出层
- `tooltip` - 工具提示
- `sheet` - 侧边面板

### 数据展示
- `table` - 表格
- `avatar` - 头像
- `accordion` - 手风琴
- `collapsible` - 折叠面板
- `command` - 命令面板
- `calendar` - 日历

## 主题系统

### 主题切换

使用 `ThemeProvider` 和 `useTheme` hook：

```tsx
import { ThemeProvider } from '@/components/theme-provider'
import { useTheme } from '@/components/theme-provider'

// 在 App 根组件中包裹
<ThemeProvider defaultTheme="system" storageKey="go-genai-stack-theme">
  <App />
</ThemeProvider>

// 在组件中使用
function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      切换到暗黑模式
    </button>
  )
}
```

### 主题切换组件

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />
```

### CSS 变量

所有颜色使用 OKLCH 格式定义在 `src/index.css` 中：

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... 更多颜色 */
}

.dark {
  --background: oklch(0.21 0.034 264.665);
  --foreground: oklch(0.985 0.002 247.839);
  /* ... 暗黑模式颜色 */
}
```

## Typography 系统

导入并使用预定义的排版组件：

```tsx
import { H1, H2, H3, P, Lead, Muted, InlineCode } from '@/components/typography'

<H1>这是标题</H1>
<Lead>这是引导文字</Lead>
<P>这是段落文字</P>
<Muted>这是次要文字</Muted>
<InlineCode>代码片段</InlineCode>
```

## 动画工具类

在 `src/index.css` 中定义了常用动画：

```tsx
<div className="fade-in">淡入动画</div>
<div className="slide-in-from-top">从上滑入</div>
<div className="slide-in-from-bottom">从下滑入</div>
<div className="slide-in-from-left">从左滑入</div>
<div className="slide-in-from-right">从右滑入</div>
<div className="scale-in">缩放进入</div>
<div className="animate-in">通用进入动画</div>
<div className="animate-out">通用退出动画</div>
```

## 使用示例

### 表单示例

```tsx
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LoginForm() {
  const { register, handleSubmit } = useForm()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>登录</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>
            <Button type="submit">提交</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 加载和空状态

```tsx
import { Loading } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

// 加载状态
<Loading text="正在加载数据..." />

// 空状态
<Empty
  title="暂无任务"
  description="点击下方按钮创建您的第一个任务"
  action={<Button>创建任务</Button>}
/>
```

### Toast 通知

```tsx
import { toast } from 'sonner'

// 显示通知
toast.success('操作成功！')
toast.error('操作失败，请重试')
toast.loading('处理中...')
toast.info('提示信息')

// 需要在 App 中添加 <Toaster />
import { Toaster } from '@/components/ui/sonner'
```

### 确认对话框（ConfirmDialog）⭐ 推荐

替代原生 `window.confirm()`，提供更好的用户体验：

```tsx
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'

function TaskList() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deleteMutation = useTaskDeleteMutation()
  
  const handleDelete = (taskId: string) => {
    setDeleteId(taskId)
  }
  
  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
    }
  }
  
  return (
    <>
      <Button onClick={() => handleDelete('task-123')} variant="destructive">
        删除任务
      </Button>
      
      {/* 确认对话框 */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="确认删除"
        description="确定要删除这个任务吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </>
  )
}
```

**特性**：
- ✅ 支持加载状态（禁用按钮）
- ✅ 支持自定义按钮文本
- ✅ 支持 destructive variant（红色警告样式）
- ✅ 完全类型安全
- ✅ 可复用

**Props**：
```typescript
interface ConfirmDialogProps {
  open: boolean                    // 是否打开
  onOpenChange: (open: boolean) => void  // 打开/关闭回调
  onConfirm: () => void            // 确认回调
  title: string                    // 标题
  description?: string             // 描述（可选）
  confirmText?: string             // 确认按钮文本（默认："确认"）
  cancelText?: string              // 取消按钮文本（默认："取消"）
  variant?: 'default' | 'destructive'  // 样式变体（默认："default"）
  loading?: boolean                // 加载状态（默认：false）
}
```

## 添加新组件

使用 shadcn CLI 添加新组件：

```bash
npx shadcn@latest add [component-name]
```

查看所有可用组件：
https://ui.shadcn.com/docs/components

## 自定义样式

所有组件都支持通过 `className` 自定义：

```tsx
<Button className="custom-class">按钮</Button>
```

使用 `cn()` 工具函数合并类名：

```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class', className)}>
  内容
</div>
```

## 最佳实践

1. **使用主题变量**：优先使用 `bg-background`, `text-foreground` 等主题变量，而不是固定颜色
2. **语义化颜色**：使用 `text-muted-foreground`, `text-destructive` 等语义化类名
3. **响应式设计**：使用 Tailwind 的响应式前缀 `md:`, `lg:` 等
4. **无障碍**：所有组件都基于 Radix UI，默认支持 WAI-ARIA
5. **类型安全**：所有组件都有完整的 TypeScript 类型定义

## 配置文件

- `components.json` - shadcn/ui 配置
- `src/index.css` - 全局样式和主题变量
- `vite.config.js` - Vite 配置（包含 Tailwind 插件）
- `tsconfig.json` - TypeScript 配置（包含路径别名）

## 相关资源

- [shadcn/ui 官方文档](https://ui.shadcn.com)
- [Radix UI 文档](https://www.radix-ui.com)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

