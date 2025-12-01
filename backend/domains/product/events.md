# Product Domain - Events (领域事件)

本文档定义了商品领域发布的所有领域事件。

---

## 事件概述

领域事件是领域内发生的重要业务事实的记录。其他领域可以订阅这些事件并做出响应。

**事件总线**：
- 当前使用内存事件总线（`domains/shared/events/bus.go`）
- 可扩展为 Redis Pub/Sub、Kafka 等

**事件格式**：
```json
{
  "event_id": "uuid",
  "event_type": "ProductCreated",
  "aggregate_id": "product-id",
  "aggregate_type": "Product",
  "payload": { ... },
  "metadata": {
    "user_id": "operator-id",
    "timestamp": "2025-12-01T10:00:00Z",
    "version": "1.0"
  }
}
```

---

## 1. ProductCreated (商品已创建)

### 触发时机
- 管理员成功创建一个新商品后

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "测试玩具",
  "initial_coins": 100,
  "coin_type": "gold",
  "stock": 50,
  "status": "off_shelf",
  "operator_id": "admin-123",
  "created_at": "2025-12-01T10:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Analytics Domain**：统计新增商品数量
- **Notification Domain**：通知运营人员（可选）
- **Audit Domain**：记录操作日志

### 业务用途
- 数据统计
- 操作审计
- 自动化流程触发

---

## 2. ProductUpdated (商品已更新)

### 触发时机
- 管理员更新商品信息后（名称、描述、价格、库存等）

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "updated_fields": [
    "name",
    "initial_coins",
    "stock"
  ],
  "old_values": {
    "name": "旧名称",
    "initial_coins": 100,
    "stock": 50
  },
  "new_values": {
    "name": "新名称",
    "initial_coins": 120,
    "stock": 100
  },
  "operator_id": "admin-123",
  "updated_at": "2025-12-01T11:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Cache Domain**：清除缓存
- **Audit Domain**：记录变更日志
- **Notification Domain**：通知关注用户（价格变动）

### 业务用途
- 缓存失效
- 变更追踪
- 价格监控

---

## 3. ProductShelved (商品已上架)

### 触发时机
- 管理员将商品上架后

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "测试玩具",
  "listed_quantity": 20,
  "available_quantity": 20,
  "initial_coins": 100,
  "operator_id": "admin-123",
  "shelved_at": "2025-12-01T12:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Search Domain**：更新搜索索引
- **Cache Domain**：预热缓存
- **Notification Domain**：推送新品上架通知
- **Analytics Domain**：统计上架商品

### 业务用途
- 搜索索引同步
- 用户通知
- 运营数据统计

---

## 4. ProductUnshelved (商品已下架)

### 触发时机
- 管理员将商品下架后

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "测试玩具",
  "reason": "库存不足",
  "operator_id": "admin-123",
  "unshelved_at": "2025-12-01T13:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Search Domain**：从搜索索引中移除
- **Cache Domain**：清除缓存
- **Analytics Domain**：记录下架时间

### 业务用途
- 搜索结果清理
- 缓存失效
- 运营分析

---

## 5. InventoryDeducted (库存已扣减)

### 触发时机
- 用户成功兑换商品，库存被扣减后

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_name": "测试玩具",
  "deducted_quantity": 1,
  "redeemed_count": 5,
  "available_quantity": 15,
  "user_id": "user-456",
  "redemption_id": "redemption-789",
  "deducted_at": "2025-12-01T14:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Inventory Domain**：更新库存统计
- **Analytics Domain**：销售数据分析
- **Notification Domain**：库存预警（剩余库存 < 阈值）
- **Points Domain**：更新用户金币余额

### 业务用途
- 库存监控
- 销售统计
- 自动补货触发

---

## 6. ProductSoldOut (商品已售罄)

### 触发时机
- 商品线上剩余库存为 0 时

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_name": "测试玩具",
  "total_redeemed": 50,
  "sold_out_at": "2025-12-01T15:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Notification Domain**：通知运营人员补货
- **Search Domain**：标记为售罄
- **Analytics Domain**：记录售罄时间

### 业务用途
- 补货提醒
- 热门商品识别
- 运营优化

---

## 7. ProductDeleted (商品已删除)

### 触发时机
- 管理员删除商品后

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_name": "测试玩具",
  "operator_id": "admin-123",
  "deleted_at": "2025-12-01T16:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Search Domain**：从搜索索引中删除
- **Cache Domain**：清除所有相关缓存
- **Audit Domain**：记录删除操作

### 业务用途
- 数据清理
- 操作审计

---

## 8. LowStockAlert (库存预警) [可选]

### 触发时机
- 商品库存低于预警阈值时

### 事件负载 (Payload)
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "product_name": "测试玩具",
  "current_stock": 5,
  "threshold": 10,
  "alert_level": "warning",
  "alert_at": "2025-12-01T17:00:00Z"
}
```

### 订阅者 (Subscribers)
- **Notification Domain**：发送预警通知
- **Inventory Domain**：触发自动补货流程

### 业务用途
- 预防缺货
- 自动化补货

---

## 事件订阅示例

### 示例 1：缓存失效

```go
// Cache Domain 订阅 ProductUpdated 事件
func (c *CacheService) OnProductUpdated(event *ProductUpdatedEvent) error {
    // 清除商品缓存
    key := fmt.Sprintf("product:%s", event.ProductID)
    return c.redis.Del(ctx, key)
}
```

### 示例 2：搜索索引同步

```go
// Search Domain 订阅 ProductShelved 事件
func (s *SearchService) OnProductShelved(event *ProductShelvedEvent) error {
    // 添加到搜索索引
    doc := SearchDocument{
        ID:    event.ProductID,
        Name:  event.Name,
        Price: event.InitialCoins,
    }
    return s.elasticsearch.Index(doc)
}
```

### 示例 3：库存预警

```go
// Notification Domain 订阅 InventoryDeducted 事件
func (n *NotificationService) OnInventoryDeducted(event *InventoryDeductedEvent) error {
    // 检查是否需要预警
    if event.AvailableQuantity < n.lowStockThreshold {
        return n.SendAlert("库存预警", event.ProductName)
    }
    return nil
}
```

---

## 事件版本控制

### 版本策略
- 事件负载使用版本号（`version: "1.0"`）
- 向后兼容：新增字段，不删除旧字段
- 破坏性变更：发布新版本事件（如 `ProductCreatedV2`）

### 示例
```json
{
  "event_type": "ProductCreated",
  "version": "1.0",
  "payload": { ... }
}
```

---

## 事件持久化

### 事件存储
- **Event Store**：可选，存储所有事件用于事件溯源
- **数据库表**：`domain_events` 表记录事件历史

### Schema
```sql
CREATE TABLE domain_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
```

---

**版本**：1.0  
**最后更新**：2025-12-01

