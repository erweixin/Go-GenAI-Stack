Vibe-coding-friendly 的 DDD 是“以领域为第一等公民”的模块化 DDD：把每个 bounded context 做成自包含的、可声明化、可读性极强的领域目录，并把领域知识（README、glossary、rules、usecases.yaml、events 等）显式化以便人类与 LLM 一次 ingest、一次理解、一次修改并安全落地。

为何这样设计（动机）

LLM/AI 在处理局部完整上下文时效果最好；散落的横向层次会增加认知负担。

Vibe coding 要实现“用一句话修改系统并自动改代码/测试”，前提是 AI 能快速定位业务入口、规则和边界。

因此：把“业务知识”变成机器可读的“文档 + 声明”比把它埋在代码里更重要。

核心原则（短清单）

领域优先（Domain-first）：先按业务划分目录（user/order/payment...）。

自包含（Self-contained）：每个领域目录包含模型、用例、事件、规则、接口、实现。

显式知识（Explicit Knowledge）：README、glossary、rules.md、usecases.yaml、events.md 等。

可声明流程（Declarative UseCases）：把用例的步骤声明化，LLM 能直接读并生成/修改实现。

最小 ceremony：只保留能产生价值的抽象，去掉不必要的重复层次。

可观测与可回溯：把 AI 决策、推理轨迹、事件流记录到领域可追溯位置。

向量化友好：领域文档尽量短小、结构化，便于投入向量数据库做检索增强。

推荐目录结构（范例）
/src
  /order                     ← bounded context / domain
    README.md                ← 领域概览（首读入口）
    glossary.md              ← 领域术语（Ubiquitous Language）
    rules.md                 ← 业务规则（可直接被 LLM ingest）
    events.md                ← 领域事件清单与语义
    usecases.yaml            ← 用例声明（可声明->自动生成）
    model.ts                 ← 聚合 / 实体 / 值对象
    repository.ts            ← 仓储接口
    repository.impl.ts       ← 仓储实现（infra）
    handlers/                ← 事件 / command handlers
      createOrder.handler.ts
      cancelOrder.handler.ts
    http/
      createOrder.route.ts   ← 接口层（最小）
    cli/                     ← (可选) 领域相关脚本工具
    tests/
      createOrder.test.ts
    ai-metadata.json         ← （可选）用于 AI ingestion 的元数据
  /user
    ...
  /shared
    /lib
    /errors
  /infra
    /db
    /kafka
  /ops
    monitor.yml
    observability.md

文件与内容详解（必须有且简洁）
README.md（每个领域）

一句话业务概述（500 字以内）

主要用例列表（指向 usecases.yaml）

重要聚合与事件快速索引（链接到 model.ts / events.md）

示例片段：

Order context: handles creating/cancelling orders, reserving inventory, and publishing OrderCreated events.
Primary aggregates: Order, LineItem, PaymentRecord.
Primary usecases: CreateOrder, CancelOrder, RetryPayment.

glossary.md

领域术语表（term → definition → related events/entities）

LLM 可用作 prompt context 的短词典

rules.md

以条目形式写业务规则（条件 → 期望行为 → error codes）

尽量短、具体、可测试
示例：

- "Order must contain at least one LineItem" → error: ORDER_EMPTY
- "If inventory reserved fails, raise InventoryShortage" → recovery: notify user + create backorder

events.md

列出 Domain Events（名称、触发条件、payload、consumers）
示例：

OrderCreated
  payload: { orderId, userId, total }
  produced by: Order aggregate after successful payment
  consumed by: ShippingService, Analytics

usecases.yaml（关键）

声明式描述用例流程，用轻量 DSL 表示步骤、输入、outputs、side-effects、compensations、sensitivity（是否需要审计/AI 审核）
示例：

CreateOrder:
  description: "Create order, reserve inventory, charge payment, publish OrderCreated"
  steps:
    - name: ValidateCustomer
      type: sync
      on_fail: abort
    - name: ValidateItems
      type: sync
    - name: ReserveInventory
      type: external
      adapter: inventoryService.reserve
      on_fail: compensate: ReleaseReservedItems
    - name: ChargePayment
      type: external
      adapter: paymentService.charge
      on_fail: compensate: RefundPayment
    - name: PublishOrderCreated
      type: event


LLM 可直接读取并生成 handler skeleton、tests、orchestration code。

model.*（聚合 / POJO）

定位为领域逻辑核心，只包含必要的行为方法（行为优先于数据）

避免把所有验证写在外部 service 中——把领域不变量放在聚合方法里，方便单元化测试与 AI 理解

repository / repository.impl

仓储接口放在领域目录里，实现放在同一目录下但标注为 infra（便于迁移/替换）。

handlers/（用例实现）

每个用例单文件（或同名目录）包含：

用例入口（small function）

显示注入的依赖（prefer explicit param）

简短注释链接回 usecases.yaml

ai-metadata.json（可选但强烈推荐）

便于 ingestion 的结构化元数据：版本、last-updated、sensitivity、vector-tags
示例：

{
  "domain": "order",
  "version": "1.2.0",
  "lastUpdated": "2025-11-22",
  "vectorTags": ["order", "payments"]
}

约定与命名规范（降低 AI 错误）

用例、事件、错误码、规则尽量统一命名风格（PascalCase 或 snake_case），并在 glossary 固定。

每个 handler 文件名与 usecase 名一致，例如 createOrder.handler.ts 对应 CreateOrder。

事件以 PastTense 命名（OrderCreated），命令以 Verb 命名（CreateOrderCommand）。

所有外部适配器（paymentService、inventoryService）在 usecases.yaml 中声明并具名，便于 AI 生成调用代码。

AI 协作工作流（示例）

开发者在 usecases.yaml 增加或修改步骤（自然语言或 DSL）。

触发 CI 中的 “AI codegen job”（可选）：

LLM 读入 order/README.md, rules.md, usecases.yaml, model.ts（优先顺序明确）。

LLM 生成/修改 handlers/createOrder.handler.ts、对应 tests、并在 PR 中说明变更点。

CI 执行单元测试 + 合规检查（检查是否违反 rules.md 的断言）。

发布并记录事件与 AI 决策日志（写入 domain event 或 observability）。

示例 prompt（给 LLM）：

Context: /order README + rules.md + usecases.yaml (CreateOrder)
Task: Generate a TypeScript handler file createOrder.handler.ts implementing steps, calling repository and inventoryService.adapter. Ensure rules: ORDER_EMPTY and InventoryShortage are checked. Add unit tests in tests/createOrder.test.ts.

测试、审核与安全

Tests：每个 usecase 都必须有单元与集成测试（基于 DSL 自动生成测试骨架）。

Contracts：外部 adapter 的契约（输入/输出 schema）要在 repo 中声明（shared/contracts 或 infra/adapters）。

AI Change Review：AI 自动生成 PR 时，运行静态检查、lint、规则一致性检查（rules.md），并打上 “AI-suggested” tag，人工审批策略可基于敏感度（在 usecases.yaml 标注）。

Audit Trail：记录 AI 生成更改（what changed, why, prompt），并在 domain event 或 ops 中存档。

可观测、治理与向量化

事件流 + trace：所有关键步骤生成事件，include aiDecisionId（if decision by AI）。

向量化 ingestion：把 README, glossary, rules, events, usecases 的短段落入向量库，便于 RAG 检索，提升 LLM 修改正确率。

Metrics：失败率、rollback 次数、AI 提交被驳回率等作为质量指标。

迁移策略（把传统 DDD / 横向层次迁成 Vibe-friendly）

先做一本“领域手册”：为每个领域写 README + glossary + rules + events（最低投入，马上让 AI 理解业务）。

抽取核心 usecases 为 YAML：把最频繁变更的 3–5 个用例声明化。

逐个模块垂直化：把对应层的文件移动到 domainX/ 下（保证兼容 API）；逐渐改造仓储接口指向新位置。

加入 ai-metadata + ingestion pipeline（可分阶段上线）。

CI 加入 AI-codegen 流程（可 opt-in）：先只做骨架生成、tests 验证，再放开自动修改。

典型反模式与注意事项

过度声明化：把 every tiny step 都写 DSL，会导致维护成本；只声明业务重要的步骤和边界。

缺少规则测试：规则写得好但没人测试，AI 会违反。

把所有东西都交给 AI：高敏感场景（钱、审计、合规）需人工门控。

混淆领域边界：模块粒度太大或太小都会降低 AI 效率 —— 推荐每个 bounded context 负责 3–10 个强相关用例。

不一致命名：会让 LLM 重写时出错，务必统一 glossary.

示例（最小可运行示例片段）

usecases.yaml

CreateOrder:
  description: "Create order and charge payment"
  sensitivity: high
  steps:
    - ValidateInputs
    - ReserveInventory
    - ChargePayment
    - PublishOrderCreated


rules.md

- ORDER_EMPTY: Orders must contain ≥ 1 line item.
- NEGATIVE_TOTAL: Total must be ≥ 0.
- INVENTORY_SHORTAGE: ReserveInventory must fail if stock < requested.


createOrder.handler.ts（伪代码）

export async function createOrder(ctx: CreateOrderCtx) {
  // 1. validate
  if (ctx.items.length === 0) throw new OrderError('ORDER_EMPTY');

  // 2. reserve
  await inventoryService.reserve(ctx.items);

  // 3. charge
  await paymentService.charge(ctx.payment);

  // 4. persist
  const order = Order.create(...);
  await repo.save(order);

  // 5. publish
  eventBus.publish('OrderCreated', { orderId: order.id });

  return order;
}


LLM 的任务是：基于 usecases.yaml & rules.md 自动生成或修正上述 handler 与 tests。