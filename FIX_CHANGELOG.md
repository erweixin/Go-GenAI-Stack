# 错误修复更新日志

## 日期：2025-12-01

### 问题：TypeError: Cannot convert object to primitive value

---

## 已应用的修复

### 1. ✅ 创建缺失的 alert-dialog 组件
**文件**：`frontend/web/src/components/ui/alert-dialog.tsx`

**问题**：ConfirmDialog 依赖 `@/components/ui/alert-dialog`，但该文件不存在。

**修复**：创建了完整的 AlertDialog 组件，基于 Radix UI 的 `@radix-ui/react-alert-dialog`。

**包含的组件**：
- AlertDialog
- AlertDialogTrigger
- AlertDialogContent
- AlertDialogHeader
- AlertDialogFooter
- AlertDialogTitle
- AlertDialogDescription
- AlertDialogAction
- AlertDialogCancel

---

### 2. ✅ 更新 ConfirmDialog 支持 ReactNode
**文件**：`frontend/web/src/components/ConfirmDialog.tsx`

**问题**：`description` 属性只支持 `string` 类型，但在某些场景下需要传入 JSX 元素，导致 "Cannot convert object to primitive value" 错误。

**修复前**：
```typescript
interface ConfirmDialogProps {
  description?: string  // ❌ 只支持字符串
}

// 渲染
<AlertDialogDescription>{description}</AlertDialogDescription>
```

**修复后**：
```typescript
interface ConfirmDialogProps {
  description?: React.ReactNode  // ✅ 支持字符串和 JSX
}

// 渲染
{description && (
  typeof description === 'string' ? (
    <AlertDialogDescription>{description}</AlertDialogDescription>
  ) : (
    <div className="text-sm text-muted-foreground">{description}</div>
  )
)}
```

---

### 3. ✅ 修复 ProductListPage 导出
**文件**：`frontend/web/src/features/product/pages/ProductListPage.tsx`

**问题**：同时存在默认导出和命名导出，可能导致模块加载问题。

**修复前**：
```typescript
export default function ProductListPage() {
  // ...
}

export { ProductListPage }  // ❌ 可能导致混淆
```

**修复后**：
```typescript
export default function ProductListPage() {
  // ...
}
// ✅ 只保留默认导出
```

---

### 4. ✅ 添加路由保护
**文件**：`frontend/web/src/router/index.tsx`

**问题**：商品管理路由未启用登录保护。

**修复前**：
```typescript
{
  path: '/products',
  element: wrapPage(ProductListPage, { protected: false }),  // ❌
  errorElement: <ErrorPage />,
},
```

**修复后**：
```typescript
{
  path: '/products',
  element: wrapPage(ProductListPage, { protected: true }),  // ✅
  errorElement: <ErrorPage />,
},
```

---

## 测试步骤

### 1. 重启前端开发服务器
```bash
cd frontend/web
# 如果服务器正在运行，按 Ctrl+C 停止
pnpm dev
```

### 2. 清除浏览器缓存
- 按 `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows/Linux) 强制刷新
- 或者在开发者工具中右键刷新按钮，选择"清空缓存并硬性重新加载"

### 3. 访问商品管理页面
1. 打开 `http://localhost:5174/`
2. 登录系统
3. 点击首页的"商品管理"卡片
4. 或直接访问 `http://localhost:5174/products`

### 4. 验证功能
- ✅ 页面正常加载，无控制台错误
- ✅ 商品列表正常显示
- ✅ 创建商品对话框正常工作
- ✅ 编辑商品对话框正常工作
- ✅ 删除确认对话框正常显示
- ✅ Toast 通知正常显示

---

## 如果问题仍然存在

### 清除 Vite 缓存
```bash
cd frontend/web
rm -rf node_modules/.vite
pnpm dev
```

### 清除所有缓存并重新安装
```bash
cd frontend
rm -rf node_modules
rm -rf web/node_modules
rm pnpm-lock.yaml
pnpm install
cd web
pnpm dev
```

### 检查浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 复制完整的错误堆栈信息
4. 特别注意错误发生的文件名和行号

### 获取帮助
如果问题仍然存在，请提供：
1. 完整的错误堆栈（从浏览器控制台）
2. 浏览器类型和版本
3. Node.js 版本（`node --version`）
4. 是否能访问其他页面（如任务管理）

---

## 相关文档

- `DEBUG_PRODUCT_ERROR.md` - 详细的调试指南
- `PRODUCT_FRONTEND_COMPLETED.md` - 前端功能完成总结
- `QUICKSTART_PRODUCT_MANAGEMENT.md` - 快速启动指南
- `PRODUCT_MODULE_FINAL_SUMMARY.md` - 模块完整总结

---

## 技术细节

### 错误原因分析
"Cannot convert object to primitive value" 错误通常发生在以下情况：

1. **字符串模板中的对象**
   ```javascript
   const obj = { foo: 'bar' }
   console.error(`Error: ${obj}`)  // ❌ 会触发错误
   ```

2. **字符串拼接对象**
   ```javascript
   const obj = { foo: 'bar' }
   const message = 'Error: ' + obj  // ❌ 会触发错误
   ```

3. **JSX 作为字符串传递**
   ```typescript
   <AlertDialogDescription>
     {<div>Hello</div>}  // ❌ 如果组件期望字符串
   </AlertDialogDescription>
   ```

### 我们的修复
- ✅ 确保 `ConfirmDialog` 正确处理 `React.ReactNode` 类型
- ✅ 使用类型检查区分字符串和 JSX 元素
- ✅ 为不同类型提供不同的渲染逻辑

---

## 状态：✅ 已修复

所有已知问题均已解决。如果遇到新的问题，请参考 `DEBUG_PRODUCT_ERROR.md` 进行调试。

