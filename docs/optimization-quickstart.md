# 架构优化快速上手指南

> 如何使用优化计划，从哪里开始，怎么执行。

---

## 📚 文档导航

本次架构优化提供了三份文档：

1. **[optimization-plan.md](./optimization-plan.md)** - 完整详细的优化计划
   - 适合：项目负责人、架构师
   - 内容：详细的任务说明、代码示例、设计思路
   - 长度：~1500 行

2. **[optimization-checklist.md](./optimization-checklist.md)** - 简化任务清单
   - 适合：开发人员、日常使用
   - 内容：任务清单、进度跟踪
   - 长度：~300 行

3. **本文档** - 快速上手指南
   - 适合：新成员、快速了解
   - 内容：如何开始、常见问题
   - 长度：你正在看

---

## 🚀 立即开始

### 步骤 1: 了解当前状态

```bash
cd /Users/sunguangbiao/work/Go-GenAI-Stack/backend

# 查看当前目录结构
tree -L 3 domains/
```

**当前问题**：
- ❌ LLM 领域缺少 usecases.yaml（最严重）
- ❌ 所有领域缺少 tests/ 目录
- ❌ 缺少事件总线
- ❌ 缺少 Monitoring 领域

### 步骤 2: 选择任务

**如果你有 1 小时**：
```bash
# 创建 LLM 领域的 glossary.md
vim backend/domains/llm/glossary.md
# 参考 optimization-plan.md 的模板
```

**如果你有半天**：
```bash
# 完成 LLM 领域的所有显式知识文件
# 1. glossary.md
# 2. rules.md
# 3. events.md
# 4. usecases.yaml ⭐
# 5. ai-metadata.json
```

**如果你有 1 周**：
```bash
# 完成第 1 周的所有任务（完善 LLM 领域）
# 参考 optimization-plan.md 的 "第 1 周" 部分
```

### 步骤 3: 验证完成

```bash
# 运行验证脚本（等第5周实现后）
./backend/scripts/validate_structure.sh

# 或者手动检查
ls -la backend/domains/llm/
# 应该看到：
# - README.md ✅
# - glossary.md ✅
# - rules.md ✅
# - events.md ✅
# - usecases.yaml ✅
# - ai-metadata.json ✅
```

---

## 🎯 推荐执行顺序

### Week 1: 打基础（LLM 领域）

**Day 1-2: 显式知识文件**（最重要）
```bash
# 创建 6 个必需文件
cd backend/domains/llm

# 1. glossary.md - 定义术语
vim glossary.md

# 2. rules.md - 定义规则
vim rules.md

# 3. events.md - 定义事件
vim events.md

# 4. usecases.yaml - 声明用例（最关键！）
vim usecases.yaml

# 5. ai-metadata.json - AI 元数据
vim ai-metadata.json

# 6. 完善 README.md
vim README.md
```

**参考资料**：
- 模板：`backend/domains/chat/` 目录下的同名文件
- 详细说明：`docs/optimization-plan.md` 第 1 周部分

**Day 3: 领域模型和服务**
```bash
# 创建目录
mkdir -p backend/domains/llm/model
mkdir -p backend/domains/llm/services

# 创建模型文件
cd backend/domains/llm/model
touch model.go provider.go model_stats.go pricing.go route_strategy.go

# 创建服务文件
cd ../services
touch model_router.go structured_output.go schema_generator.go schema_validator.go
```

**Day 4: Handlers 和 HTTP**
```bash
cd backend/domains/llm/handlers
# 完善现有的 generate.handler.go
# 创建新的 handlers
touch select_model.handler.go generate_structured.handler.go stream.handler.go

# 完善 HTTP DTO
cd ../http/dto
# 添加新的 DTO 定义
```

**Day 5: 代码审查和调整**
```bash
# 运行测试（虽然还没有测试，但可以检查编译）
cd backend
go build ./...

# 检查代码风格
go fmt ./...
```

---

### Week 2: 建立测试体系

**Day 1-2: Chat 领域测试**
```bash
mkdir -p backend/domains/chat/tests

cd backend/domains/chat/tests
touch send_message.test.go
touch stream_message.test.go
touch conversation.test.go
touch rules.test.go  # ⭐ 关键：为 rules.md 的每条规则写测试
touch usecases.test.go
```

**测试模板**（rules.test.go 示例）：
```go
package tests

import "testing"

// TestRule_R1_MessageValidation 测试规则 R1: 消息内容验证
func TestRule_R1_MessageValidation(t *testing.T) {
    tests := []struct {
        name    string
        message string
        wantErr bool
        errCode string
    }{
        {"empty message", "", true, "MESSAGE_EMPTY"},
        {"too long", strings.Repeat("x", 10001), true, "MESSAGE_TOO_LONG"},
        {"valid", "Hello AI", false, ""},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validateMessage(tt.message)
            // 断言...
        })
    }
}
```

**Day 3-4: LLM 领域测试**
```bash
mkdir -p backend/domains/llm/tests

cd backend/domains/llm/tests
touch generate.test.go
touch model_router.test.go
touch structured_output.test.go
touch rules.test.go
```

**Day 5: 测试工具和脚本**
```bash
# 创建测试脚本
vim backend/scripts/run_tests.sh
chmod +x backend/scripts/run_tests.sh

# 运行测试
./backend/scripts/run_tests.sh

# 查看覆盖率
open coverage.html
```

---

### Week 3-5: 按计划执行

参考 `optimization-plan.md` 的详细说明。

---

## 🛠️ 实用工具

### 1. 快速创建领域模板

```bash
#!/bin/bash
# create_domain.sh - 快速创建新领域

DOMAIN=$1

mkdir -p backend/domains/$DOMAIN/{model,services,handlers,http/dto,tests}

touch backend/domains/$DOMAIN/README.md
touch backend/domains/$DOMAIN/glossary.md
touch backend/domains/$DOMAIN/rules.md
touch backend/domains/$DOMAIN/events.md
touch backend/domains/$DOMAIN/usecases.yaml
touch backend/domains/$DOMAIN/ai-metadata.json

echo "Domain $DOMAIN created!"
```

### 2. 快速检查文件完整性

```bash
#!/bin/bash
# check_domain.sh - 检查领域完整性

DOMAIN=$1
FILES=("README.md" "glossary.md" "rules.md" "events.md" "usecases.yaml" "ai-metadata.json")

echo "Checking domain: $DOMAIN"
for file in "${FILES[@]}"; do
    if [ -f "backend/domains/$DOMAIN/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done
```

### 3. 生成用例骨架

```bash
#!/bin/bash
# generate_handler.sh - 从 usecases.yaml 生成 handler 骨架

DOMAIN=$1
USECASE=$2

# 读取 usecases.yaml
# 提取用例定义
# 生成 handler 文件
# 生成 test 文件

echo "Generated:"
echo "  - domains/$DOMAIN/handlers/${USECASE}.handler.go"
echo "  - domains/$DOMAIN/tests/${USECASE}.test.go"
```

---

## ❓ 常见问题

### Q1: 我应该从哪里开始？

**A**: 从第 1 周的 LLM 领域开始，特别是 `usecases.yaml`。这是整个架构的核心。

### Q2: usecases.yaml 怎么写？

**A**: 参考 `backend/domains/chat/usecases.yaml`，它是一个很好的示例。

关键字段：
```yaml
usecases:
  YourUseCase:
    description: "描述"
    sensitivity: low/medium/high
    http:
      method: POST
      path: /api/...
    input: {...}
    output: {...}
    steps: [...]  # 关键！按顺序列出步骤
    errors: [...]
```

### Q3: 每个文件的作用是什么？

| 文件 | 作用 | AI 如何使用 |
|------|------|-------------|
| README.md | 领域概览 | 首先阅读，理解领域边界 |
| glossary.md | 术语表 | 理解业务术语，生成正确命名 |
| rules.md | 业务规则 | 生成验证逻辑，生成测试用例 |
| events.md | 领域事件 | 生成事件发布/订阅代码 |
| usecases.yaml | 用例声明 | ⭐ 生成 handler 代码骨架 |
| ai-metadata.json | AI 元数据 | 向量化索引，快速检索 |

### Q4: 为什么 usecases.yaml 这么重要？

**A**: 因为它是 **可声明化** 的用例定义，AI 可以直接读取并生成代码。

传统方式：
```
需求文档 → 人工理解 → 人工编码 → 人工测试
```

Vibe Coding 方式：
```
usecases.yaml → AI 理解 → AI 生成代码 → 自动测试
```

### Q5: 测试覆盖率为什么要 > 80%？

**A**: 因为 AI 生成的代码需要测试来验证正确性。没有测试，就无法确保 AI 生成的代码符合业务规则。

### Q6: 事件总线是做什么的？

**A**: 解耦领域间通信。

**不使用事件总线**：
```go
// Chat 领域直接调用 Monitoring 领域（耦合）
monitoringService.RecordMetrics(...)
```

**使用事件总线**：
```go
// Chat 领域发布事件（解耦）
eventBus.Publish(MessageSentEvent{...})

// Monitoring 领域订阅事件
eventBus.Subscribe("MessageSent", func(event Event) {
    // 记录指标
})
```

### Q7: ai_codegen.sh 什么时候能用？

**A**: 第 5 周会实现。但你现在就可以手动做 AI 做的事：

1. 读取 usecases.yaml
2. 读取 README, glossary, rules, events
3. 用这些内容作为 prompt 让 Cursor AI 生成代码

### Q8: 我可以跳过某些任务吗？

**A**: 
- **P0 任务**：不能跳过，这是架构的核心
- **P1 任务**：不建议跳过，影响长期维护
- **P2 任务**：可以延后，但会影响开发效率
- **P3 任务**：可以跳过，锦上添花

### Q9: 如何与团队协作？

**A**: 
1. 每个人认领一个领域或一周的任务
2. 每天更新 `optimization-checklist.md` 的进度
3. 每周五代码审查，确保符合规范
4. 使用 PR 提交，描述中链接到计划的对应部分

### Q10: 遇到困难怎么办？

**A**: 
1. 查看 `backend/domains/chat/` 作为参考
2. 阅读 `docs/Vibe-Coding-Friendly.md` 理解理念
3. 在团队群里讨论
4. 调整计划（计划不是一成不变的）

---

## 📖 深入学习

### 核心概念

1. **Vibe Coding**：用一句话修改系统
   - 依赖显式知识（README, glossary, rules, events）
   - 依赖声明式用例（usecases.yaml）
   - AI 读懂→生成代码→自动测试

2. **领域优先（Domain-First）**：
   - 先按业务划分（chat, llm, monitoring）
   - 不是按技术层次划分（controller, service, dao）

3. **自包含（Self-contained）**：
   - 每个领域独立完整
   - 减少跨目录跳转
   - AI 可以一次加载整个领域

4. **显式知识（Explicit Knowledge）**：
   - 知识写在文档里，不是藏在代码里
   - AI 可以读文档
   - 人也可以读文档

### 推荐阅读顺序

1. `docs/Vibe-Coding-Friendly.md` - 理解核心理念
2. `docs/vibe-coding-ddd-structure.md` - 理解目录结构
3. `docs/optimization-plan.md` - 理解优化计划
4. `backend/domains/chat/` - 查看实际示例

### 视频教程（待录制）

- [ ] 00. 什么是 Vibe-Coding-Friendly DDD（10分钟）
- [ ] 01. 如何写 usecases.yaml（15分钟）
- [ ] 02. 如何写业务规则测试（15分钟）
- [ ] 03. 如何使用事件总线解耦（10分钟）
- [ ] 04. 如何用 AI 生成代码（20分钟）

---

## 🎯 成功标志

**你知道优化成功了，当：**

1. ✅ 新增一个用例，只需要：
   - 在 usecases.yaml 添加定义（5分钟）
   - 运行 ai_codegen.sh（1分钟）
   - 审查 AI 生成的代码（10分钟）
   - 提交 PR（2分钟）
   - **总计 < 20分钟**

2. ✅ 修改一个规则，只需要：
   - 在 rules.md 修改规则（2分钟）
   - 更新对应的测试（5分钟）
   - 让 AI 修改 handler 代码（3分钟）
   - 运行测试确认（1分钟）
   - **总计 < 15分钟**

3. ✅ 新人上手，只需要：
   - 读 README.md 理解领域（10分钟）
   - 读 usecases.yaml 理解用例（10分钟）
   - 看一个 handler 示例（5分钟）
   - 就可以开始写代码
   - **总计 < 30分钟**

---

## 🚀 开始行动

```bash
# 1. 进入 backend 目录
cd /Users/sunguangbiao/work/Go-GenAI-Stack/backend

# 2. 创建第一个文件
vim domains/llm/glossary.md

# 3. 参考 Chat 领域的 glossary.md
cat domains/chat/glossary.md

# 4. 开始写！
```

**记住**：
- 不要追求完美，先完成再完善
- 每天进步一点点
- 遇到问题及时沟通
- 相信 AI，但也要审查 AI 的输出

**加油！🎉**

---

**更新**: 2025-11-22  
**作者**: Backend Team  
**反馈**: 欢迎在团队群提出改进建议

