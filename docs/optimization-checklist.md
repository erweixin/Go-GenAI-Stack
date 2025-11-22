# Backend 架构优化清单（快速版）

> 这是 [optimization-plan.md](./optimization-plan.md) 的简化版，用于快速追踪进度。

**预计工期**：5 周  
**开始时间**：2025-11-22  
**预计完成**：2025-12-27

---

## 🔥 P0 任务（必须完成）

### ✅ 第 1 周：完善 LLM 领域

#### 显式知识文件
- [ ] `backend/domains/llm/glossary.md`
- [ ] `backend/domains/llm/rules.md`
- [ ] `backend/domains/llm/events.md`
- [ ] `backend/domains/llm/usecases.yaml` ⭐ 最关键
- [ ] `backend/domains/llm/ai-metadata.json`
- [ ] 完善 `backend/domains/llm/README.md`

#### 代码结构
- [ ] `backend/domains/llm/model/` 目录 (5个文件)
- [ ] `backend/domains/llm/services/` 目录 (4个文件)
- [ ] `backend/domains/llm/repository.go` + `repository_impl.go`
- [ ] `backend/domains/llm/adapters/` 目录 (4个文件)
- [ ] `backend/domains/llm/handlers/` 完善 (4个 handlers)
- [ ] `backend/domains/llm/http/` 完善

---

### ✅ 第 2 周：测试体系建设

#### Chat 领域测试
- [ ] `backend/domains/chat/tests/send_message.test.go`
- [ ] `backend/domains/chat/tests/stream_message.test.go`
- [ ] `backend/domains/chat/tests/conversation.test.go`
- [ ] `backend/domains/chat/tests/rules.test.go` ⭐ 关键
- [ ] `backend/domains/chat/tests/usecases.test.go`

#### LLM 领域测试
- [ ] `backend/domains/llm/tests/generate.test.go`
- [ ] `backend/domains/llm/tests/model_router.test.go`
- [ ] `backend/domains/llm/tests/structured_output.test.go`
- [ ] `backend/domains/llm/tests/rules.test.go`

#### 测试工具
- [ ] `backend/domains/shared/testing/` 目录
- [ ] `backend/scripts/run_tests.sh`

**目标**：测试覆盖率 > 80%

---

## 🎯 P1 任务（高优先级）

### ✅ 第 3 周：基础设施重构

#### 目录重构
- [ ] `infra/` → `infrastructure/`
- [ ] `shared/middleware/` → `infrastructure/middleware/`
- [ ] 更新所有 import 路径

#### 新增目录
- [ ] `infrastructure/persistence/postgres/` (3个文件)
- [ ] `infrastructure/persistence/redis/` (2个文件)
- [ ] `infrastructure/queue/` (2个文件)
- [ ] `infrastructure/config/` (3个文件)

#### 事件总线 ⭐ 关键
- [ ] `domains/shared/events/bus.go`
- [ ] `domains/shared/events/types.go`
- [ ] `domains/shared/events/publisher.go`

#### 共享类型
- [ ] `domains/shared/types/common.go`

#### 中间件
- [ ] `infrastructure/middleware/auth.go`
- [ ] `infrastructure/middleware/ratelimit.go`
- [ ] `infrastructure/middleware/tracing.go`

---

### ✅ 第 4 周：Monitoring 领域

#### 显式知识文件
- [ ] `domains/monitoring/README.md`
- [ ] `domains/monitoring/glossary.md`
- [ ] `domains/monitoring/rules.md`
- [ ] `domains/monitoring/events.md`
- [ ] `domains/monitoring/usecases.yaml`
- [ ] `domains/monitoring/ai-metadata.json`

#### 代码结构
- [ ] `domains/monitoring/model/` (4个文件)
- [ ] `domains/monitoring/services/` (5个文件)
- [ ] `domains/monitoring/repository.go` + `repository_impl.go`
- [ ] `domains/monitoring/handlers/` (4个文件)
- [ ] `domains/monitoring/http/` 
- [ ] `domains/monitoring/tests/`

#### 集成
- [ ] Chat 领域添加监控埋点
- [ ] LLM 领域添加监控埋点

---

## 📦 P2 任务（中优先级）

### ✅ 第 5 周：工具和自动化

#### 工具包
- [ ] `backend/pkg/logger/` (2个文件)
- [ ] `backend/pkg/ratelimiter/` (3个文件)
- [ ] `backend/pkg/circuitbreaker/` (2个文件)
- [ ] `backend/pkg/validator/` (2个文件)

#### 数据库迁移
- [ ] `backend/migrations/postgres/001_create_conversations_table.sql`
- [ ] `backend/migrations/postgres/002_create_messages_table.sql`
- [ ] `backend/migrations/postgres/003_create_models_table.sql`
- [ ] `backend/migrations/postgres/004_create_metrics_table.sql`
- [ ] `backend/migrations/postgres/005_create_traces_table.sql`
- [ ] `backend/scripts/migrate.sh`

#### AI 代码生成 ⭐ 关键
- [ ] `backend/scripts/ai_codegen.sh`
- [ ] `backend/scripts/templates/handler.prompt.txt`
- [ ] `backend/scripts/templates/test.prompt.txt`

#### 文档和验证
- [ ] `backend/scripts/generate_docs.sh`
- [ ] `backend/scripts/validate_structure.sh`
- [ ] 完善 `backend/scripts/dev.sh`
- [ ] `backend/scripts/test_all.sh`
- [ ] `backend/scripts/lint.sh`

#### CI/CD
- [ ] `.github/workflows/test.yml`
- [ ] `.github/workflows/ai_review.yml`

---

## 🌟 P3 任务（可选）

### CLI 工具
- [ ] `domains/chat/cli/export_conversations.go`
- [ ] `domains/monitoring/cli/query_stats.go`

### 额外文档
- [ ] `docs/architecture-decisions.md`
- [ ] `docs/onboarding.md`

---

## 📊 每周检查点

### Week 1 验收 (11/29)
- [ ] LLM 领域有完整的 6 个必需文件
- [ ] LLM 领域代码结构完整
- [ ] 所有 handler 有与 usecases.yaml 的链接

### Week 2 验收 (12/06)
- [ ] Chat 和 LLM 领域都有 tests/ 目录
- [ ] rules.md 的每条规则都有测试
- [ ] 测试覆盖率 > 80%

### Week 3 验收 (12/13)
- [ ] infra/ 改名为 infrastructure/
- [ ] 事件总线可用
- [ ] 领域间可通过事件通信

### Week 4 验收 (12/20)
- [ ] Monitoring 领域完整
- [ ] 其他领域已集成监控
- [ ] 可查询性能指标

### Week 5 验收 (12/27)
- [ ] ai_codegen.sh 可用
- [ ] 所有开发脚本可运行
- [ ] CI/CD 配置完成

---

## 🎯 关键文件清单

### 必须创建的文件（按优先级）

**优先级 1（本周必须）**
```
backend/domains/llm/usecases.yaml
backend/domains/llm/glossary.md
backend/domains/llm/rules.md
backend/domains/llm/events.md
backend/domains/llm/ai-metadata.json
```

**优先级 2（下周必须）**
```
backend/domains/chat/tests/rules.test.go
backend/domains/llm/tests/rules.test.go
backend/scripts/run_tests.sh
```

**优先级 3（第3周必须）**
```
backend/domains/shared/events/bus.go
backend/domains/shared/events/types.go
backend/infrastructure/config/config.go
```

**优先级 4（第4周必须）**
```
backend/domains/monitoring/usecases.yaml
backend/domains/monitoring/README.md
backend/domains/monitoring/model/trace.go
backend/domains/monitoring/model/metric.go
```

**优先级 5（第5周必须）**
```
backend/scripts/ai_codegen.sh
backend/migrations/postgres/*.sql
backend/pkg/logger/logger.go
```

---

## 🚦 状态说明

- [ ] 未开始
- [🔄] 进行中
- [✅] 已完成
- [❌] 已取消
- [⏸️] 已暂停

---

## 📝 快速命令

```bash
# 验证架构完整性
./backend/scripts/validate_structure.sh

# 运行所有测试
./backend/scripts/run_tests.sh

# 生成代码（示例）
./backend/scripts/ai_codegen.sh --domain chat --usecase ExportConversation

# 数据库迁移
./backend/scripts/migrate.sh up

# 启动开发环境
./backend/scripts/dev.sh
```

---

**更新日志**

- 2025-11-22: 创建初始版本
- 计划每周五更新进度

**当前状态**: 📝 等待执行

