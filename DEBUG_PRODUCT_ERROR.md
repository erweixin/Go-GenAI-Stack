# 商品管理错误调试指南

## 错误信息
```
TypeError: Cannot convert object to primitive value
    at String (<anonymous>)
    at console.error (<anonymous>)
```

## 可能的原因

这个错误通常发生在以下情况：

1. **Console.error 打印对象**
   - 某个地方尝试使用 `console.error(object)` 打印对象
   - React Query 或其他库在错误处理时可能会这样做

2. **字符串模板中的对象**
   ```javascript
   // ❌ 错误
   const obj = { foo: 'bar' }
   console.error(`Error: ${obj}`)  // 会导致 "Cannot convert object to primitive value"
   
   // ✅ 正确
   console.error('Error:', obj)
   ```

3. **AlertDialogDescription 中的对象**
   - 之前的代码可能尝试将对象作为 description 传递

## 已修复的问题

✅ **ConfirmDialog 组件**
- 已更新以支持 `React.ReactNode` 类型的 description
- 现在可以接受字符串或 JSX 元素

✅ **Alert Dialog 组件**
- 已创建缺失的 `alert-dialog.tsx` 组件

✅ **路由保护**
- 商品管理路由现在需要登录（`protected: true`）

## 调试步骤

### 1. 清除浏览器缓存
```bash
# 在浏览器中按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows) 强制刷新
```

### 2. 检查浏览器控制台
打开浏览器开发者工具（F12），查看：
- Console 标签页 - 查看完整的错误堆栈
- Network 标签页 - 查看 API 请求是否成功
- Sources 标签页 - 启用 "Pause on exceptions" 找到错误发生位置

### 3. 检查后端 API
确保后端正在运行：
```bash
cd backend
go run cmd/api/main.go
```

访问 API 端点测试：
```bash
curl http://localhost:8082/api/products
```

### 4. 重启前端开发服务器
```bash
# 停止当前服务器（Ctrl+C）
cd frontend/web
rm -rf node_modules/.vite  # 清除 Vite 缓存
pnpm dev
```

### 5. 检查具体错误位置

在浏览器控制台中，点击错误信息，查看完整的堆栈跟踪。应该会看到类似：

```
TypeError: Cannot convert object to primitive value
    at String (<anonymous>)
    at console.error (index.tsx:44)
    at ProductListPage.tsx:123
    at ...
```

记下文件名和行号，然后查看对应的代码。

### 6. 临时调试代码

在 `ProductListPage.tsx` 中添加 try-catch：

```typescript
// 在 ProductListPage 函数开始处
useEffect(() => {
  console.log('[DEBUG] ProductListPage mounted')
  console.log('[DEBUG] filters:', JSON.stringify(filters))
  console.log('[DEBUG] data:', data)
}, [filters, data])
```

### 7. 检查 React Query 配置

查看 `frontend/web/src/lib/query-client.ts`，确保错误处理正确：

```typescript
// 确保 onError 回调正确处理错误
defaultOptions: {
  queries: {
    onError: (error) => {
      console.error('[Query Error]', error)  // ✅ 正确
      // 而不是
      // console.error(`Error: ${error}`)     // ❌ 错误
    }
  }
}
```

## 快速修复

如果错误持续存在，可以尝试以下快速修复：

### 方案 1：简化 ProductListPage

临时注释掉复杂的功能，逐步添加回来找到问题：

```typescript
export default function ProductListPage() {
  return <div>商品管理 - 测试页面</div>
}
```

如果这样可以工作，说明问题在某个子组件中。

### 方案 2：检查 API 响应

确保 API 返回的数据格式正确：

```typescript
const { data, isLoading, error } = useProducts(filters)

useEffect(() => {
  if (error) {
    console.error('[API Error]', error)
    console.log('[API Error Type]', typeof error)
    console.log('[API Error Keys]', Object.keys(error))
  }
}, [error])
```

### 方案 3：使用默认导出

确保 ProductListPage 的导出正确：

```typescript
// ProductListPage.tsx
export default function ProductListPage() {
  // ...
}

// 移除底部的命名导出
// export { ProductListPage }  // ❌ 删除这行
```

## 已应用的修复

1. ✅ 创建了 `alert-dialog.tsx` 组件
2. ✅ 更新了 `ConfirmDialog` 以支持 `React.ReactNode`
3. ✅ 将商品管理路由改为需要登录保护
4. ✅ 前端开发服务器已重启

## 下一步

1. 访问 `http://localhost:5174/`
2. 登录系统
3. 点击"商品管理"卡片
4. 查看浏览器控制台的完整错误信息
5. 将错误堆栈复制给我，我会帮您进一步诊断

## 联系支持

如果问题仍然存在，请提供：
1. 完整的错误堆栈（从浏览器控制台复制）
2. 浏览器类型和版本
3. 是否能访问其他页面（如任务管理）
4. Network 标签中的 API 请求状态

