# 商品展示问题调试指南

## 问题描述
商品数据正确获取到了，但页面仍显示"暂无商品"。

## 已添加的调试代码

在 `ProductListPage.tsx` 中添加了调试日志：

```typescript
useEffect(() => {
  if (data) {
    console.log('[DEBUG] 商品数据:', data)
    console.log('[DEBUG] 商品列表:', data.products)
    console.log('[DEBUG] 商品数量:', data.products?.length)
  }
  if (error) {
    console.error('[DEBUG] 错误:', error)
  }
}, [data, error])
```

## 调试步骤

### 1. 打开浏览器开发者工具
- 按 F12 或 Cmd+Option+I (Mac)
- 切换到 Console 标签

### 2. 访问商品管理页面
- 打开 `http://localhost:5174/products`
- 查看控制台输出

### 3. 检查输出

**预期看到的输出**：
```
[DEBUG] 商品数据: {products: Array(N), total_count: N, page: 1, limit: 20, has_more: false}
[DEBUG] 商品列表: Array(N) [{id: "xxx", name: "xxx", ...}, ...]
[DEBUG] 商品数量: N
```

**如果看到错误**：
```
[DEBUG] 错误: AxiosError {...}
```

检查错误详情，可能的原因：
- 后端服务未启动
- 认证失败
- API 路径错误
- CORS 问题

### 4. 检查 Network 标签

切换到 Network 标签：
1. 找到 `/api/products` 请求
2. 查看 Status Code（应该是 200）
3. 查看 Response 数据结构

**预期的响应格式**：
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "商品名称",
      "image_url": "...",
      "initial_coins": 100,
      ...
    }
  ],
  "total_count": 1,
  "page": 1,
  "limit": 20,
  "has_more": false
}
```

## 可能的问题和解决方案

### 问题 1：后端未启动
**症状**：Network 标签显示请求失败或超时

**解决**：
```bash
cd backend
go run cmd/api/main.go
```

### 问题 2：认证失败（401 Unauthorized）
**症状**：响应状态码 401

**原因**：
- 未登录
- Token 过期

**解决**：
1. 刷新页面重新登录
2. 检查 localStorage 中的 token

### 问题 3：数据结构不匹配
**症状**：控制台显示 `data.products` 是 undefined

**检查**：
1. 后端返回的字段名是否正确（`products` vs `Products`）
2. 响应是否被包装在额外的层级中

**可能的后端响应格式问题**：
```json
// ❌ 错误：多了一层 data
{
  "data": {
    "products": [...]
  }
}

// ✅ 正确：直接返回
{
  "products": [...]
}
```

### 问题 4：空数组
**症状**：`data.products` 是空数组 `[]`

**检查**：
1. 数据库中是否有商品数据
2. 查询过滤条件是否过于严格

**验证数据库**：
```sql
-- 连接到 PostgreSQL
psql -h localhost -U postgres -d go_genai_stack

-- 查询商品
SELECT id, name, status, created_at FROM products;

-- 如果没有数据，插入测试数据
INSERT INTO products (
  id, name, initial_coins, coin_type, stock, 
  status, operator_id, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '测试商品',
  100,
  'gold',
  50,
  'on_shelf',
  (SELECT id FROM users LIMIT 1),  -- 使用现有用户ID
  NOW(),
  NOW()
);
```

### 问题 5：组件渲染条件
**症状**：数据存在但组件不显示

**检查 ProductTable 组件**：
```typescript
// 确认传入的 products 是否为数组
if (!Array.isArray(products)) {
  console.error('[DEBUG] products 不是数组:', typeof products, products)
}
```

## 临时解决方案

如果调试输出显示数据正确但仍然不显示，可以尝试：

### 方案 1：强制刷新组件
```typescript
// 在 ProductListPage.tsx 中
const [refreshKey, setRefreshKey] = useState(0)

// 在数据变化时强制刷新
useEffect(() => {
  if (data) {
    setRefreshKey(prev => prev + 1)
  }
}, [data])

// 在 ProductTable 上添加 key
<ProductTable
  key={refreshKey}
  products={data?.products || []}
  ...
/>
```

### 方案 2：临时显示原始数据
在 ProductListPage 中添加：
```typescript
{/* 临时调试：显示原始数据 */}
{data && (
  <div className="mt-4 p-4 bg-gray-100 rounded">
    <h3>调试信息：</h3>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
)}
```

### 方案 3：简化 ProductTable
临时替换 ProductTable：
```typescript
{/* 临时简化版 */}
{data?.products && data.products.length > 0 ? (
  <div>
    <h2>找到 {data.products.length} 个商品</h2>
    {data.products.map(p => (
      <div key={p.id}>{p.name}</div>
    ))}
  </div>
) : (
  <div>暂无商品</div>
)}
```

## 检查清单

- [ ] 后端服务正在运行（`http://localhost:8082`）
- [ ] 前端服务正在运行（`http://localhost:5174`）
- [ ] 已登录系统
- [ ] 浏览器控制台无错误
- [ ] Network 请求成功（200 OK）
- [ ] 响应数据格式正确
- [ ] `data.products` 是数组
- [ ] `data.products.length > 0`
- [ ] 数据库中有商品数据

## 下一步

请打开浏览器控制台，将看到的调试输出复制给我：
1. `[DEBUG] 商品数据:` 的完整输出
2. Network 标签中 `/api/products` 的响应内容
3. 任何错误信息

我会根据实际数据帮您进一步诊断问题。

