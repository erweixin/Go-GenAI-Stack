# Vibe Coding Friendly DDD 完整目录结构

## 核心理念
以领域为第一等公民，每个 Bounded Context 自包含，显式化领域知识。

## 完整结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go                                    # 应用入口
│
├── domains/                                           # 【领域目录】第一等公民
│   │
│   ├── chat/                                          # 【聊天领域】自包含
│   │   ├── README.md                                  # 必须：领域概览
│   │   ├── glossary.md                                # 必须：术语表
│   │   ├── rules.md                                   # 必须：业务规则
│   │   ├── events.md                                  # 必须：领域事件清单
│   │   ├── usecases.yaml                              # 必须：用例声明（关键！）
│   │   ├── ai-metadata.json                           # AI ingestion 元数据
│   │   │
│   │   ├── model/                                     # 领域模型
│   │   │   ├── conversation.go                        # 对话聚合根
│   │   │   ├── message.go                             # 消息实体
│   │   │   ├── message_role.go                        # 值对象：消息角色
│   │   │   └── context_window.go                      # 值对象：Context 窗口
│   │   │
│   │   ├── repository.go                              # 仓储接口（在领域内）
│   │   ├── repository_impl.go                         # 仓储实现（标记为 infra）
│   │   │
│   │   ├── services/                                  # 领域服务
│   │   │   ├── context_manager.go                     # Context 管理
│   │   │   └── message_validator.go                   # 消息验证
│   │   │
│   │   ├── handlers/                                  # 用例处理器
│   │   │   ├── send_message.handler.go                # 对应 usecases.yaml 的 SendMessage
│   │   │   ├── create_conversation.handler.go         # 对应 CreateConversation
│   │   │   └── trim_context.handler.go                # 对应 TrimContext
│   │   │
│   │   ├── http/                                      # HTTP 接口（最小，仅路由）
│   │   │   ├── send_message.route.go
│   │   │   └── create_conversation.route.go
│   │   │
│   │   ├── tests/                                     # 测试
│   │   │   ├── send_message.test.go
│   │   │   ├── rules.test.go                          # 规则测试
│   │   │   └── usecases.test.go                       # 基于 usecases.yaml 生成
│   │   │
│   │   └── cli/                                       # （可选）领域相关脚本
│   │       └── export_conversations.go
│   │
│   ├── llm/                                           # 【LLM 领域】自包含
│   │   ├── README.md
│   │   ├── glossary.md                                # 术语：Model、Provider、Token、Schema
│   │   ├── rules.md                                   # 规则：路由策略、Schema 验证
│   │   ├── events.md                                  # 事件：ModelSelected、SchemaValidationFailed
│   │   ├── usecases.yaml                              # 用例：SelectModel、GenerateStructuredOutput
│   │   ├── ai-metadata.json
│   │   │
│   │   ├── model/
│   │   │   ├── model.go                               # 模型实体
│   │   │   ├── provider.go                            # 提供商实体
│   │   │   ├── model_stats.go                         # 值对象：模型统计
│   │   │   ├── pricing.go                             # 值对象：价格配置
│   │   │   └── route_strategy.go                      # 值对象：路由策略
│   │   │
│   │   ├── repository.go
│   │   ├── repository_impl.go
│   │   │
│   │   ├── services/
│   │   │   ├── model_router.go                        # 多模型路由
│   │   │   ├── structured_output.go                   # 结构化输出
│   │   │   ├── schema_generator.go                    # Schema 生成
│   │   │   └── schema_validator.go                    # Schema 验证
│   │   │
│   │   ├── handlers/
│   │   │   ├── select_model.handler.go
│   │   │   └── generate_structured.handler.go
│   │   │
│   │   ├── http/
│   │   │   └── structured_output.route.go
│   │   │
│   │   ├── adapters/                                  # 外部 LLM 提供商适配器
│   │   │   ├── eino_adapter.go                        # Eino 适配器
│   │   │   ├── openai_adapter.go                      # OpenAI 直连（备用）
│   │   │   └── claude_adapter.go                      # Claude 直连（备用）
│   │   │
│   │   └── tests/
│   │       ├── select_model.test.go
│   │       └── structured_output.test.go
│   │
│   ├── monitoring/                                    # 【监控领域】自包含
│   │   ├── README.md
│   │   ├── glossary.md                                # 术语：Trace、Metric、P95、Latency
│   │   ├── rules.md                                   # 规则：采样率、聚合策略、告警阈值
│   │   ├── events.md                                  # 事件：MetricCollected、AlertTriggered
│   │   ├── usecases.yaml                              # 用例：CollectMetrics、QueryStats、TriggerAlert
│   │   ├── ai-metadata.json
│   │   │
│   │   ├── model/
│   │   │   ├── trace.go                               # 追踪实体
│   │   │   ├── metric.go                              # 指标实体
│   │   │   ├── latency_stats.go                       # 值对象：延迟统计
│   │   │   └── cost_stats.go                          # 值对象：成本统计
│   │   │
│   │   ├── repository.go
│   │   ├── repository_impl.go                         # TimescaleDB + Redis 实现
│   │   │
│   │   ├── services/
│   │   │   ├── metrics_collector.go                   # 指标收集
│   │   │   ├── trace_service.go                       # 链路追踪
│   │   │   └── stats_aggregator.go                    # 统计聚合（异步）
│   │   │
│   │   ├── handlers/
│   │   │   ├── collect_metrics.handler.go
│   │   │   └── query_stats.handler.go
│   │   │
│   │   ├── http/
│   │   │   └── metrics.route.go
│   │   │
│   │   └── tests/
│   │       └── metrics_collector.test.go
│   │
│   └── shared/                                        # 共享内核（跨领域）
│       ├── errors/                                    # 标准错误定义
│       │   ├── errors.go
│       │   └── codes.go
│       ├── events/                                    # 事件总线
│       │   ├── bus.go
│       │   └── types.go
│       └── types/                                     # 共享类型
│           └── common.go
│
├── infrastructure/                                    # 【基础设施】全局
│   ├── persistence/
│   │   ├── postgres/
│   │   │   └── connection.go                          # 数据库连接池
│   │   └── redis/
│   │       └── connection.go
│   │
│   ├── queue/                                         # 异步任务队列
│   │   ├── asynq_client.go
│   │   └── tasks/                                     # 全局任务定义
│   │       ├── metrics_aggregation_task.go
│   │       └── log_archiving_task.go
│   │
│   ├── middleware/                                    # 全局中间件
│   │   ├── auth.go
│   │   ├── ratelimit.go
│   │   ├── logging.go
│   │   └── recovery.go
│   │
│   └── config/
│       ├── config.go
│       └── loader.go
│
├── pkg/                                               # 可复用工具包
│   ├── logger/
│   │   ├── logger.go
│   │   └── zap_logger.go
│   ├── ratelimiter/
│   │   ├── limiter.go
│   │   └── redis_limiter.go
│   └── circuitbreaker/
│       ├── breaker.go
│       └── gobreaker_impl.go
│
├── migrations/                                        # 数据库迁移
│   └── postgres/
│       ├── 001_create_conversations_table.sql
│       └── 002_create_messages_table.sql
│
├── scripts/                                           # 脚本工具
│   ├── dev.sh
│   ├── generate_docs.sh
│   └── ai_codegen.sh                                  # AI 代码生成脚本
│
├── docs/                                              # 项目文档
│   ├── architecture.md
│   ├── domain_model.md
│   └── ai_workflow.md                                 # AI 协作工作流
│
├── go.mod
├── go.sum
└── README.md
```

## 关键设计原则

### 1. 领域优先
每个领域是一个自包含的目录，包含：
- 模型
- 用例
- 事件
- 规则
- 接口
- 仓储
- 测试

### 2. 显式知识文件（每个领域必须有）
- `README.md` - 领域概览
- `glossary.md` - 术语表
- `rules.md` - 业务规则
- `events.md` - 领域事件
- `usecases.yaml` - 用例声明（关键！）
- `ai-metadata.json` - AI 元数据

### 3. 用例驱动
- 每个用例在 `usecases.yaml` 中声明
- 每个用例对应一个 `*.handler.go` 文件
- LLM 可以读取 `usecases.yaml` 并生成 handler 代码

### 4. 测试驱动
- 每个领域有自己的 `tests/` 目录
- 基于 `rules.md` 生成规则测试
- 基于 `usecases.yaml` 生成用例测试

### 5. 向量化友好
- 所有文档短小精悍（< 2000 字）
- 结构化（Markdown、YAML）
- 便于投入向量数据库做 RAG 检索

## AI 协作工作流

1. 开发者修改 `usecases.yaml` 添加新用例
2. 触发 AI codegen：读取 README + rules + usecases.yaml
3. AI 生成 handler 代码和测试
4. CI 运行测试和规则验证
5. 人工 review + 合并
6. 记录 AI 决策轨迹到 monitoring 领域

## 迁移策略

从传统 DDD 迁移到 Vibe Coding Friendly DDD：

1. **第 1 周**：为每个领域编写 README + glossary + rules
2. **第 2 周**：抽取 3-5 个核心用例写成 usecases.yaml
3. **第 3-4 周**：逐个模块垂直化，把文件移动到 domains/X/
4. **第 5-6 周**：加入 ai-metadata + ingestion pipeline
5. **第 7-8 周**：CI 加入 AI-codegen 流程

## 典型工作流示例

### 添加新用例 "导出对话历史"

```bash
# 1. 修改 usecases.yaml
vim domains/chat/usecases.yaml

# 2. 触发 AI 代码生成
./scripts/ai_codegen.sh --domain chat --usecase ExportConversation

# 3. AI 自动生成：
#    - domains/chat/handlers/export_conversation.handler.go
#    - domains/chat/tests/export_conversation.test.go
#    - 更新 domains/chat/README.md

# 4. 运行测试
go test ./domains/chat/tests/

# 5. 人工 review + 提交
git add domains/chat/
git commit -m "feat(chat): add ExportConversation usecase (AI-generated)"
```

