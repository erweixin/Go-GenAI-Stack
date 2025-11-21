# AI 协作工作流指南

## 概述

本文档说明如何使用 Vibe Coding Friendly DDD 架构配合 AI 工具（Cursor、Copilot）进行高效开发。

## 核心理念

**声明式用例驱动开发（Declarative UseCase-Driven Development）**：
- 用 `usecases.yaml` 声明业务流程
- AI 读取显式知识文件（README、glossary、rules、events）
- AI 自动生成 handler、tests、文档
- CI 验证一致性
- 记录 AI 决策轨迹

## 标准工作流

### 1. 声明用例（usecases.yaml）

在领域的 `usecases.yaml` 文件中添加或修改用例：

```yaml
UseCaseName:
  description: "一句话描述用例"
  sensitivity: low|medium|high  # 敏感度，影响是否需要人工审核
  
  inputs:
    - field1: type (required|optional)
    - field2: type
  
  outputs:
    - result1: type
    - result2: type
  
  steps:
    - name: StepName
      type: sync|async|external|event
      description: "步骤说明"
      on_fail: abort|retry|compensate|warn
      errors: [ERROR_CODE_1, ERROR_CODE_2]
      adapter: adapterName.method  # 外部适配器
      timeout: 30s
      retry_count: 3
      retry_backoff: exponential
      compensation: CompensationStepName
```

### 2. 触发 AI 代码生成

#### 方式 1：命令行工具

```bash
# 生成单个用例
./scripts/ai_codegen.sh --domain chat --usecase ExportConversation

# 生成领域内所有用例
./scripts/ai_codegen.sh --domain chat --all

# 预览生成（不写入文件）
./scripts/ai_codegen.sh --domain chat --usecase ExportConversation --dry-run
```

#### 方式 2：在 Cursor 中使用 Prompt

```
Context:
- domains/chat/README.md
- domains/chat/glossary.md
- domains/chat/rules.md
- domains/chat/events.md
- domains/chat/usecases.yaml

Task:
Generate handler and tests for the ExportConversation usecase.
Follow the existing patterns in domains/chat/handlers/.
```

### 3. AI 生成过程

AI 会按照以下步骤生成代码：

#### 3.1 读取显式知识

```
1. README.md    → 理解领域边界和职责
2. glossary.md  → 理解术语（Ubiquitous Language）
3. rules.md     → 理解业务规则和约束
4. events.md    → 理解领域事件模式
5. usecases.yaml → 读取用例声明（步骤、输入、输出）
6. ai-metadata.json → 获取领域元数据
```

#### 3.2 生成 Handler

```go
// domains/{domain}/handlers/{usecase}.handler.go
// 此文件由 AI 自动生成
// 基于: domains/{domain}/usecases.yaml - {UseCaseName}

package handlers

// {UseCaseName}Handler {用例描述}
// 对应用例: {UseCaseName}
//
// 输入: {列出 inputs}
// 输出: {列出 outputs}
// 步骤: {列出 steps}
type {UseCaseName}Handler struct {
    // 依赖项（从 usecases.yaml 的 adapters 中推断）
    repo       repository.Repository
    adapters   map[string]Adapter
    eventBus   events.Bus
    logger     logger.Logger
}

func New{UseCaseName}Handler(...) *{UseCaseName}Handler {
    // 构造函数
}

func (h *{UseCaseName}Handler) Handle(
    ctx context.Context,
    req {UseCaseName}Request,
) (*{UseCaseName}Response, error) {
    // 按照 usecases.yaml 的 steps 顺序实现
    // 每个 step 对应一段代码
    // 根据 on_fail 生成错误处理逻辑
}
```

#### 3.3 生成 Tests

```go
// domains/{domain}/tests/{usecase}.test.go
// 此文件由 AI 自动生成
// 基于: domains/{domain}/usecases.yaml - {UseCaseName}

package tests

func Test{UseCaseName}Handler_Success(t *testing.T) {
    // 基于 usecases.yaml 的 steps 自动生成测试用例
    // 包括成功路径和每个 on_fail 场景
}

func Test{UseCaseName}Handler_Errors(t *testing.T) {
    // 基于 usecases.yaml 的 errors 列表生成错误测试
}
```

#### 3.4 更新文档

```markdown
# domains/{domain}/README.md

## 用例列表
- {UseCaseName}: {description}  ← 新增
```

### 4. CI 验证

```bash
# 运行测试
go test ./domains/{domain}/tests/

# 验证 usecases.yaml 和代码的一致性
./scripts/validate_usecases.sh domains/{domain}

# 验证 rules.md 的规则
./scripts/validate_rules.sh domains/{domain}

# 检查代码风格
golangci-lint run ./domains/{domain}/...
```

### 5. 记录 AI 决策

```go
// 存入 domains/monitoring/model/ai_decision.go

type AIDecision struct {
    DecisionID     string
    Timestamp      time.Time
    Prompt         string           // AI 接收的 prompt
    Domain         string           // 领域名称
    UseCase        string           // 用例名称
    GeneratedFiles []string         // 生成的文件列表
    Approved       bool             // 是否被人工批准
    ReviewedBy     string           // 审核人
    Metrics        AIDecisionMetrics
}

type AIDecisionMetrics struct {
    GenerationTime time.Duration  // 生成耗时
    LinesOfCode    int            // 生成的代码行数
    TestCoverage   float64        // 测试覆盖率
}
```

## 最佳实践

### 1. usecases.yaml 编写规范

#### ✅ 好的用例声明

```yaml
SendMessage:
  description: "用户发送消息并获取 AI 响应"
  sensitivity: medium
  
  inputs:
    - userID: string (required)
    - message: string (required, max=10000)
    - conversationID: string (optional)
  
  outputs:
    - messageID: string
    - aiResponse: string
  
  steps:
    - name: ValidateMessage
      type: sync
      on_fail: abort
      errors:
        - MESSAGE_EMPTY
        - MESSAGE_TOO_LONG
        - MESSAGE_FILTERED
    
    - name: LoadHistory
      type: sync
      description: "加载对话历史"
    
    - name: TrimContext
      type: sync
      description: "裁剪超出限制的历史消息"
    
    - name: CallLLM
      type: external
      adapter: einoClient.chat
      timeout: 30s
      on_fail: retry
      retry_count: 3
      retry_backoff: exponential
    
    - name: SaveMessage
      type: sync
      on_fail: compensate
      compensation: RollbackMessage
    
    - name: PublishMessageSent
      type: event
      event: MessageSent
```

**好的原因**：
- 描述清晰、具体
- 输入输出类型明确
- 步骤有序、职责单一
- 错误处理完整
- 包含超时、重试、补偿逻辑

#### ❌ 不好的用例声明

```yaml
SendMessage:
  description: "发消息"  # 太简略
  
  steps:
    - DoSomething  # 步骤名不清晰
      on_fail: ???  # 错误处理不明确
    - CallLLMAndSaveAndPublishEvent  # 步骤职责不单一
```

### 2. 显式知识文件维护

#### README.md
- 保持简洁（< 500 字）
- 一句话概述领域
- 列出核心用例、聚合、事件

#### glossary.md
- 每个术语都要定义
- 包含相关实体/事件的链接
- 保持更新

#### rules.md
- 每条规则独立编号（RULE-001, RULE-002...）
- 格式：条件 → 期望 → 错误码
- 每条规则可测试

#### events.md
- 列出所有领域事件
- 包含 payload 结构
- 列出消费者

#### usecases.yaml
- 每个用例独立声明
- 步骤顺序清晰
- 错误处理完整

#### ai-metadata.json
- 保持版本号最新
- vectorTags 准确
- 依赖关系明确

### 3. AI 提示词模板

#### 添加新用例

```
Context:
- domains/{domain}/README.md
- domains/{domain}/glossary.md
- domains/{domain}/rules.md
- domains/{domain}/events.md
- domains/{domain}/usecases.yaml

Task:
Generate handler and tests for the {UseCaseName} usecase defined in usecases.yaml.

Requirements:
1. Follow the steps defined in usecases.yaml
2. Implement error handling according to on_fail strategy
3. Generate comprehensive tests covering all steps and error cases
4. Add necessary comments and examples
5. Update README.md with usecase summary
```

#### 修改现有用例

```
Context:
- domains/{domain}/usecases.yaml (modified)
- domains/{domain}/handlers/{usecase}.handler.go (existing)

Task:
Update {usecase}.handler.go to reflect the changes in usecases.yaml.

Changes:
- Added step: {StepName}
- Modified step: {StepName}
- Removed step: {StepName}

Requirements:
1. Maintain existing code style
2. Update tests accordingly
3. Ensure backward compatibility if possible
```

#### 调试问题

```
Context:
- domains/{domain}/usecases.yaml
- domains/{domain}/handlers/{usecase}.handler.go
- Error logs: {paste error logs}

Task:
Analyze why {UseCaseName} is failing and suggest fixes.

Focus on:
1. Step timeout issues
2. Error handling logic
3. Adapter configuration
```

### 4. 代码审查清单

#### 自动检查（CI）
- [ ] 测试通过
- [ ] usecases.yaml 和代码一致
- [ ] rules.md 的规则都有对应测试
- [ ] 代码风格符合规范
- [ ] 测试覆盖率 > 80%

#### 人工审查
- [ ] 用例描述准确
- [ ] 步骤顺序合理
- [ ] 错误处理完整
- [ ] 补偿逻辑正确
- [ ] 事件发布正确
- [ ] 日志记录充分
- [ ] 性能考虑（如有必要）

### 5. 敏感度管理

| 敏感度 | 定义 | AI 权限 | 审核要求 |
|--------|------|---------|---------|
| **low** | 低风险功能（导出、查询） | AI 可自动生成并合并 | 事后审查 |
| **medium** | 一般业务逻辑（发送消息） | AI 生成，人工审核后合并 | PR review |
| **high** | 高风险功能（支付、删除） | AI 仅生成骨架，人工实现核心逻辑 | 双人审核 + 安全测试 |

## 故障排查

### Q: AI 生成的代码与 usecases.yaml 不一致

**原因**：
- usecases.yaml 格式错误
- AI 的 context 不完整

**解决**：
```bash
# 验证 yaml 格式
yamllint domains/{domain}/usecases.yaml

# 确保 AI 读取了所有显式知识文件
./scripts/validate_domain.sh domains/{domain}
```

### Q: AI 生成的测试覆盖不全

**原因**：
- usecases.yaml 中的 errors 列表不完整
- 缺少 on_fail 场景

**解决**：
```yaml
# 完善 errors 列表
steps:
  - name: ValidateInput
    errors:
      - INPUT_EMPTY
      - INPUT_TOO_LONG
      - INPUT_INVALID_FORMAT
    on_fail: abort

# 添加 on_fail 场景
  - name: CallExternalAPI
    on_fail: retry  # 添加重试场景测试
    retry_count: 3
```

### Q: AI 无法理解领域概念

**原因**：
- glossary.md 缺失或不完整
- README.md 描述不清晰

**解决**：
```markdown
# 完善 glossary.md
| 术语 | 定义 | 相关实体/事件 |
|-----|------|-------------|
| Conversation | 用户与 AI 的完整对话会话，包含多条消息 | Conversation 实体, ConversationCreated 事件 |
| Message | 单条消息（用户或 AI），是 Conversation 的组成部分 | Message 实体, MessageSent 事件 |
```

## 进阶技巧

### 1. 用例编排（Orchestration）

当一个用例需要调用多个其他用例时：

```yaml
ProcessOrderWithPayment:
  description: "创建订单并完成支付"
  
  steps:
    - name: CreateOrder
      type: usecase  # 调用其他用例
      usecase: CreateOrder
      inputs:
        orderItems: $request.items
    
    - name: ProcessPayment
      type: usecase
      usecase: ProcessPayment
      inputs:
        orderID: $steps.CreateOrder.orderID
        amount: $steps.CreateOrder.total
      on_fail: compensate
      compensation: CancelOrder
```

### 2. 条件步骤（Conditional Steps）

```yaml
SendNotification:
  steps:
    - name: CheckUserPreference
      type: sync
    
    - name: SendEmail
      type: external
      condition: $steps.CheckUserPreference.emailEnabled
      adapter: emailService.send
    
    - name: SendSMS
      type: external
      condition: $steps.CheckUserPreference.smsEnabled
      adapter: smsService.send
```

### 3. 并行步骤（Parallel Steps）

```yaml
AnalyzeMessage:
  steps:
    - name: ParallelAnalysis
      type: parallel
      tasks:
        - name: SentimentAnalysis
          adapter: mlService.analyzeSentiment
        - name: ToxicityDetection
          adapter: mlService.detectToxicity
        - name: LanguageDetection
          adapter: mlService.detectLanguage
    
    - name: AggregateResults
      type: sync
      inputs: $steps.ParallelAnalysis.results
```

## 总结

Vibe Coding Friendly DDD 的 AI 协作工作流核心在于：

1. **声明优于实现**：用 usecases.yaml 声明业务流程
2. **显式优于隐式**：用 6 个文件显式化领域知识
3. **自动优于手动**：AI 自动生成 handler 和 tests
4. **验证优于信任**：CI 验证一致性
5. **追溯优于遗忘**：记录 AI 决策轨迹

这种方式能让开发效率提升 **50%+**，同时保证代码质量和可维护性。

