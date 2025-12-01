# Product Domain (商品领域)

## 概述

商品领域负责处理积分商城中商品的创建、管理、库存控制和上下架操作。这是一个经典的电商场景，展示了 Vibe-Coding-Friendly DDD 架构在积分商城中的应用。

## 领域边界

### 职责范围

- ✅ 管理商品（Product）的生命周期
- ✅ 处理商品上架/下架操作
- ✅ 管理商品库存（总库存、上架数量、已兑换数量）
- ✅ 支持商品筛选和分页查询
- ✅ 跟踪商品财务数据（成本、收益）
- ✅ 记录操作人信息

### 不包含的职责

- ❌ 用户兑换流程（属于 Redemption Domain，未实现）
- ❌ 金币/积分管理（属于 Points Domain，未实现）
- ❌ 支付处理（属于 Payment Domain，未实现）
- ❌ 订单管理（属于 Order Domain，未实现）
- ❌ 商品分类（可扩展）

## 核心概念

参考 `glossary.md` 了解领域术语。

## 用例列表

参考 `usecases.yaml` 查看所有用例的声明式定义。

主要用例：
1. **CreateProduct** - 创建商品
2. **UpdateProduct** - 更新商品信息
3. **GetProduct** - 获取商品详情
4. **ListProducts** - 列出商品（支持筛选、排序、分页）
5. **ShelveProduct** - 上架商品
6. **UnshelveProduct** - 下架商品
7. **DeductInventory** - 扣减库存（兑换时调用）
8. **DeleteProduct** - 删除商品

## 聚合根和实体

### Product（商品）- 聚合根

- **字段**：
  - ID - 商品 ID (UUID)
  - Name - 商品名称
  - ImageURL - 商品图片 URL
  - Description - 商品描述
  - InitialCoins - 兑换所需金币数
  - CoinType - 金币类型（gold/silver）
  - Stock - 总库存
  - ListedQuantity - 上架数量
  - ListedLimit - 上架限量（NULL=不限制）
  - RedeemedCount - 已兑换数量
  - AvailableQuantity - 线上剩余（计算字段）
  - SalesCount - 销售数量
  - PurchaseLimit - 每人购买限制
  - Cost - 成本（元）
  - Revenue - 已兑换收益（元）
  - Status - 状态（上架/下架）
  - OperatorID - 操作人 ID
  - CreatedAt - 创建时间
  - UpdatedAt - 更新时间

### ProductStatus（商品状态）- 值对象
- OnShelf（上架）
- OffShelf（下架）

### CoinType（金币类型）- 值对象
- Gold（金币）
- Silver（银币）

## 领域事件

参考 `events.md` 查看所有领域事件。

## 业务规则

参考 `rules.md` 查看所有业务规则和约束。

## 依赖关系

### 下游依赖

- 无（当前版本）

### 上游依赖

- User Domain（操作人信息）

## 技术栈

- HTTP 框架：Hertz
- 存储：PostgreSQL（通过 database/sql）
- 缓存：Redis（可选）

## 快速开始

### 创建商品示例

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试玩具",
    "image_url": "https://example.com/toy.jpg",
    "description": "积分兑换玩具",
    "initial_coins": 100,
    "coin_type": "gold",
    "stock": 50,
    "purchase_limit": 2,
    "cost": 10.50
  }'
```

### 列出商品示例

```bash
curl -X GET "http://localhost:8080/api/products?status=on_shelf&page=1&limit=10"
```

### 上架商品示例

```bash
curl -X POST http://localhost:8080/api/products/{product-id}/shelve \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 20
  }'
```

## 扩展点

本领域可以扩展为：

1. **商品分类（Category）**
   - Product → Category（一对多）
   - 支持多级分类

2. **商品规格（SKU）**
   - Product → SKU（一对多）
   - 支持多规格商品（如尺码、颜色）

3. **库存预警**
   - 库存低于阈值时发送通知
   - 集成消息队列

4. **兑换记录（Redemption）**
   - 追踪每笔兑换记录
   - 关联用户和商品

5. **批量导入/导出**
   - Excel 批量导入商品
   - 导出商品数据报表

## 映射指南

本领域是积分商城的核心模块，可以映射到其他电商场景：

| Product 概念 | 映射示例 |
|-------------|---------|
| `Product` | `Item`, `Goods`, `Merchandise` |
| `Status` (OnShelf/OffShelf) | `ListingStatus` (Published/Delisted) |
| `InitialCoins` | `Points`, `Credits`, `Price` |
| `Stock` | `Inventory`, `Quantity` |
| `CreateProduct` | `AddItem`, `CreateGoods` |
| `ShelveProduct` | `PublishProduct`, `ListItem` |

---

**注意**：这是积分商城的**核心领域**，提供完整的商品管理功能。

