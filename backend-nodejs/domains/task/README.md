# Task Domain (任务领域)

## 概述

任务领域负责处理任务（Todo/Task）的创建、管理和状态变更。这是一个经典的 CRUD 场景，展示了 Vibe-Coding-Friendly DDD 架构的最佳实践。

## 领域边界

### 职责范围

- ✅ 管理任务（Task）的生命周期
- ✅ 处理任务状态变更（待办 → 进行中 → 已完成）
- ✅ 支持任务分类和优先级
- ✅ 提供任务查询和筛选
- ✅ 管理任务标签

### 不包含的职责

- ❌ 用户认证和授权（属于 User Domain，未实现）
- ❌ 通知和提醒（属于 Notification Domain，未实现）
- ❌ 团队协作和权限（属于 Team Domain，未实现）
- ❌ 数据分析和报表（属于 Analytics Domain，未实现）

## 核心概念

参考 `glossary.md` 了解领域术语。

## 用例列表

参考 `usecases.yaml` 查看所有用例的声明式定义。

主要用例：
1. **CreateTask** - 创建任务
2. **UpdateTask** - 更新任务
3. **CompleteTask** - 完成任务
4. **DeleteTask** - 删除任务
5. **ListTasks** - 列出任务（支持筛选、排序、分页）
6. **GetTask** - 获取任务详情

## 聚合根和实体

### Task（任务）- 聚合根
- **字段**：
  - TaskID - 任务 ID
  - Title - 标题
  - Description - 描述
  - Status - 状态（Pending, InProgress, Completed）
  - Priority - 优先级（Low, Medium, High）
  - DueDate - 截止日期
  - Tags - 标签列表
  - CreatedAt - 创建时间
  - UpdatedAt - 更新时间
  - CompletedAt - 完成时间

### TaskStatus（任务状态）- 值对象
- Pending（待办）
- InProgress（进行中）
- Completed（已完成）

### Priority（优先级）- 值对象
- Low（低）
- Medium（中）
- High（高）

### Tag（标签）- 值对象
- Name - 标签名称
- Color - 颜色

## 领域事件

参考 `events.md` 查看所有领域事件。

## 业务规则

参考 `rules.md` 查看所有业务规则和约束。

## 依赖关系

### 下游依赖

- 无（当前版本）

### 上游依赖

- 无

## 技术栈

- HTTP 框架：Hertz
- 存储：PostgreSQL（通过 database/sql）
- 缓存：Redis（可选）

## 快速开始

### 创建任务示例

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "完成项目文档",
    "description": "编写 README 和 API 文档",
    "priority": "high",
    "due_date": "2025-12-31"
  }'
```

### 列出任务示例

```bash
curl -X GET "http://localhost:8080/api/tasks?status=pending&priority=high&page=1&limit=10"
```

### 完成任务示例

```bash
curl -X POST http://localhost:8080/api/tasks/task-123/complete
```

## 待办事项

- [ ] 添加任务分类（Category）
- [ ] 支持任务依赖关系
- [ ] 添加任务评论功能
- [ ] 实现任务模板

## 相关文档

- [Glossary](./glossary.md) - 领域术语表
- [Rules](./rules.md) - 业务规则
- [Events](./events.md) - 领域事件
- [Use Cases](./usecases.yaml) - 用例定义

## 扩展点

本领域是一个**示例实现**，用于展示 Vibe-Coding-Friendly DDD 架构。你可以：

1. **直接使用**：如果你的项目需要任务管理功能
2. **作为参考**：学习如何实现一个完整的领域
3. **映射到你的业务**：
   - Task → Product（商品）
   - Task → Order（订单）
   - Task → Article（文章）
   - Task → Customer（客户）

## 映射指南

### 如何将 Task 映射到你的业务实体？

| Task 概念 | 映射示例 |
|-----------|---------|
| `Task` | `Product`, `Order`, `Article`, `Customer` |
| `Status` (Pending/Completed) | `OrderStatus` (Created/Shipped/Delivered) |
| `Priority` (Low/High) | `ProductCategory`, `CustomerTier` |
| `Tags` | `ProductTags`, `CustomerSegments` |
| `CreateTask` | `CreateProduct`, `CreateOrder` |
| `UpdateTask` | `UpdateProduct`, `UpdateOrder` |
| `CompleteTask` | `ShipOrder`, `PublishArticle` |

### 步骤

1. 复制 `domains/task/` 到新的领域目录
2. 全局替换：`Task` → `YourEntity`
3. 修改字段以匹配你的业务
4. 更新 `usecases.yaml` 中的用例
5. 重写业务规则（`rules.md`）
6. 更新术语表（`glossary.md`）

---

**注意**：这是一个**示例领域**，用于展示架构模式。实际项目中，请根据你的业务需求创建自己的领域。

