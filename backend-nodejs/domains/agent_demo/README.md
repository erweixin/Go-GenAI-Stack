# Agent Demo Domain 技术文档（LangChain.js + ReAct）

## 1. 领域目标与范围
- 提供可演示的 Agent 能力，基于 LangChain.js。
- 支持两种执行模式：
  - `simple`：纯 LLM 生成回复。
  - `react`：ReAct（Thought/Action/Observation/Final）+ 工具调用。

执行触发与消费：
- **生产路径**：通过消息队列（推荐 BullMQ）投递执行任务，后台 worker 拉取执行。
- **消费路径**：SSE 接口持续推送执行状态（回答、工具调用、tokens、进度）。
- 面向的核心场景：
  - 快速创建/配置 Agent。
  - 触发 Agent 运行（同步或流式）。
  - 观察执行轨迹（steps）与结果。

不包含的内容：
- 不负责 LLM API 密钥的安全存储与轮换（由基础设施或运维解决）。
- 不负责长期任务调度（可由队列/定时器整合）。
- 不负责用户认证授权（复用 `auth` 领域）。

## 2. 架构与分层
- **Model 层**：`Agent` 聚合根，`ReactStep` / `RegisteredTool` 等值对象。
- **Repository 层**：`AgentRepository` 负责持久化 Agent 与执行记录。
- **Service 层**：
  - `AgentService`：用例编排，调用 LLM/工具执行器。
  - `ReactExecutor`：封装 ReAct 循环（工具调用 + 轨迹）。
- **Handlers/HTTP 层**：Thin layer，负责 DTO 验证、调用服务、输出响应。
- **EventBus/Queue**（可选）：发布 `AgentCreated/AgentExecuted`，或将长任务下发队列。

## 3. 用例列表（建议）
1) CreateAgent - 创建 Agent 配置  
2) ListAgents - 查询 Agent 列表  
3) RunAgent - 运行 Agent（支持 `mode=simple|react`，可选流式）  
4) GetExecution - 查询单次执行记录（轨迹 + 结果）  
5) ListExecutions - 查询历史执行记录  

## 4. 数据模型（建议表结构）

### agents
- id (uuid, pk)
- user_id (uuid, fk -> users.id, not null) ⭐ **新增：多租户支持**
- name (varchar100, not null)
- description (text, null)
- provider (varchar20, enum: openai/anthropic)
- model (varchar100, not null)
- system_prompt (text, null)
- temperature (numeric, null)
- max_tokens (int, null)
- status (varchar20, enum: active/inactive, default active)
- created_by (uuid, fk -> users.id, null) ⭐ **新增：审计字段**
- updated_by (uuid, fk -> users.id, null) ⭐ **新增：审计字段**
- created_at, updated_at (timestamp)

**索引设计**：
- `CREATE INDEX idx_agents_user_id ON agents(user_id)` - 用户查询优化
- `CREATE INDEX idx_agents_status ON agents(status)` - 状态筛选优化
- `CREATE UNIQUE INDEX idx_agents_user_name ON agents(user_id, name)` - 用户内名称唯一

### agent_executions
- id (uuid, pk)
- agent_id (fk -> agents.id)
- user_id (uuid, fk -> users.id, not null) ⭐ **新增：执行者追踪**
- input (text)
- mode (varchar20, enum: simple/react)
- output (text, nullable 以便失败场景)
- steps (jsonb, 存 Thought/Action/Observation/Final) ⚠️ **注意：与 agent_execution_steps 表二选一，避免重复存储**
- status (varchar20, enum: queued/running/completed/failed, default queued) ⭐ **新增：queued 状态**
- error (text, null)
- prompt_tokens (int, null)
- completion_tokens (int, null)
- total_tokens (int, null)
- retry_count (int, default 0) ⭐ **新增：重试次数**
- started_at (timestamp, null) ⭐ **新增：开始执行时间**
- completed_at (timestamp, null) ⭐ **新增：完成时间**
- created_at, updated_at (timestamp)

**索引设计**：
- `CREATE INDEX idx_executions_agent_id ON agent_executions(agent_id)` - Agent 查询优化
- `CREATE INDEX idx_executions_user_id ON agent_executions(user_id)` - 用户查询优化
- `CREATE INDEX idx_executions_status ON agent_executions(status)` - 状态筛选优化
- `CREATE INDEX idx_executions_created_at ON agent_executions(created_at DESC)` - 时间排序优化
- `CREATE INDEX idx_executions_user_status ON agent_executions(user_id, status)` - 复合查询优化

### agent_execution_events（可选，高保真流式回放）
- id (bigserial, pk)
- execution_id (fk -> agent_executions.id)
- seq (int) - 事件序号
- type (varchar30: thought/action/observation/final/token/metric/log/step)
- payload (jsonb) - 事件内容，如 {thought, action, observation, tool, tokens, step_no}
- created_at (timestamp)

**索引设计**：
- `CREATE INDEX idx_events_execution_seq ON agent_execution_events(execution_id, seq)` - 回放查询优化
- `CREATE INDEX idx_events_created_at ON agent_execution_events(created_at)` - 清理任务优化

**数据清理策略**：
- 建议 TTL：7 天（可通过配置调整）
- 定期清理任务：`DELETE FROM agent_execution_events WHERE created_at < NOW() - INTERVAL '7 days'`
- 或使用分区表按月归档

### agent_execution_steps（推荐，结构化存储每一步）
- id (bigserial, pk)
- execution_id (fk -> agent_executions.id)
- step_no (int) - 从 1 递增
- question (text) - 当前轮的用户/上一轮的 follow-up 输入
- thought (text, null)
- action (varchar100, null) - 工具名
- action_input (jsonb, null)
- observation (text, null)
- output (text, null) - 当前步模型输出（如果无 tool_call 则为最终答案片段）
- prompt_tokens (int, null)
- completion_tokens (int, null)
- total_tokens (int, null)
- tool_call_id (varchar100, null)
- tool_latency_ms (int, null)
- created_at (timestamp)

**索引设计**：
- `CREATE INDEX idx_steps_execution_step ON agent_execution_steps(execution_id, step_no)` - 步骤查询优化
- `CREATE INDEX idx_steps_created_at ON agent_execution_steps(created_at)` - 清理任务优化

**数据清理策略**：
- 建议保留策略：执行记录保留 30 天，超过后归档或删除
- 定期清理任务：`DELETE FROM agent_execution_steps WHERE execution_id IN (SELECT id FROM agent_executions WHERE created_at < NOW() - INTERVAL '30 days')`

### 表选择建议

**使用场景**：
- **agent_execution_steps**（推荐）：需要结构化查询、分析、统计时使用
- **agent_execution_events**（可选）：需要高保真流式回放、事件溯源时使用
- **agent_executions.steps (jsonb)**：仅用于简单场景，不推荐用于生产环境

**建议**：生产环境使用 `agent_execution_steps` 表，`agent_execution_events` 作为可选的增强功能。

## 5. 执行与队列 + ReAct 运行流程

### 5.1 生产者（API 层）
1) `POST /api/agents/:id/run`：创建执行记录（status=queued）并投递队列消息，返回 `execution_id`。  
2) SSE 订阅：`GET /api/agents/:id/executions/:exec_id/stream`，立即返回并开始推送事件。  

### 5.2 消费者（Worker）
1) 从队列获取任务 → 加载 Agent 配置。  
2) **幂等性检查**：检查 `agent_executions.status`，如果已经是 `running` 或 `completed`，跳过处理。  
3) 更新状态为 `running`，记录 `started_at`。  
4) 根据 mode 调用 Simple 或 ReactExecutor。  
5) 持续写入 `agent_execution_events`（或通过进程内事件总线推给 SSE）。  
6) 更新 `agent_executions.status`（running → completed/failed），写入 output、error、tokens、`completed_at`。

**错误处理与重试机制**：
- **队列任务失败**：
  - 重试策略：指数退避（1s, 2s, 4s, 8s, 16s），最多重试 3 次
  - 重试条件：网络错误、LLM API 限流（429）、临时错误（5xx）
  - 不重试：验证错误（400）、认证错误（401）、资源限制超限
  - 死信队列：超过最大重试次数后，移入死信队列，记录错误详情
- **Worker 崩溃恢复**：
  - 使用 BullMQ 的 `stalled` 机制检测卡住的任务
  - 自动重新分配超时任务（默认 30 秒超时）
  - 定期清理 `running` 状态超过 5 分钟的执行记录（可能已崩溃）
- **部分失败处理**：
  - 如果部分 tool_call 成功，部分失败：记录失败的 tool_call，继续执行其他 tool_call
  - 如果所有 tool_call 失败：标记执行失败，记录错误信息  

### 5.3 ReAct 运行流程（ReactExecutor）
1) 组装 messages：SystemPrompt（可选）+ UserInput。  
2) 调用 LLM（携带工具 schema）。  
3) 解析模型返回：  
   - 若有 tool_call：执行对应工具，产出 observation，追加 ToolMessage，再循环。  
   - 若无 tool_call：视为 Final，结束。  
4) 循环上限：`max_steps`（建议默认 8）与 `max_tool_calls`（建议默认 5），超过即报错 `REACT_MAX_STEPS_EXCEEDED`。  
5) 记录 steps：Thought / Action / Input / Observation / Final。  

### 5.4 SSE 事件类型（建议）
- `execution_started`: {execution_id, mode, start_time}
- `thought`: {step_no, text}
- `action`: {step_no, tool, input}
- `observation`: {step_no, tool, output}
- `token_usage`: {step_no?, prompt_tokens, completion_tokens, total_tokens, cumulative_total?}
- `log`: {level, message}
- `final`: {output, status}
- `error`: {message}

### 5.5 流式返回与中途接入
- LangChain LLM 流式返回一般是增量 chunk；SSE 订阅可能从中途开始，需要可恢复的事件源。  
- 方案：
  1) Worker 执行时，将每个事件（thought/action/observation/token/final）持久化到 `agent_execution_events` 或 Redis Stream。
  2) SSE 连接时：
     - 若 client 携带 `Last-Event-ID` header，则从对应 seq 继续推送（数据库或 Redis Stream 回放）。
     - 若无，则从最新状态开始推送（可先发送 execution_started + 最近一步的上下文）。
  3) 对于 LLM 增量 token，避免直接原样透传 chunk：可以按小段聚合为 observation/log/token_usage，再写事件表/Redis，保证可回放。
  4) Redis 作用：
     - 用作热缓存或 Stream：`agent:exec:{execution_id}:events`（XADD / XRANGE），SSE 可 XRANGE 重放。
     - 防止 DB 压力过大；DB 做落盘持久化，Redis 做短期回放与快速订阅。

**SSE 连接断开恢复机制**：
- **客户端重连**：
  - 客户端携带 `Last-Event-ID` header，服务端从对应 seq 继续推送
  - 如果执行已完成，立即发送 `final` 事件并关闭连接
  - 如果执行失败，发送 `error` 事件并关闭连接
- **服务端检测断开**：
  - 使用心跳机制（每 30 秒发送 `:ping` 事件）
  - 检测到连接断开后，停止向该连接推送事件（避免资源浪费）
  - 记录断开日志（用于分析）
- **事件丢失补偿**：
  - 如果 Redis Stream 中的数据丢失，回退到数据库查询 `agent_execution_events`
  - 如果数据库数据也不完整，从 `agent_execution_steps` 表重构事件流
  - 记录数据丢失告警（用于排查问题）

**LLM API 失败处理**：
- **限流处理（429）**：
  - 指数退避重试：1s, 2s, 4s, 8s, 16s，最多重试 5 次
  - 记录限流日志，用于监控和告警
- **超时处理**：
  - LLM 调用超时：30 秒（可配置）
  - 超时后重试 2 次，仍失败则标记执行失败
- **Provider 切换（可选）**：
  - 如果 OpenAI 失败，可自动切换到 Anthropic（需配置）
  - 记录 Provider 切换日志，用于成本分析
- **部分失败处理**：
  - 如果 LLM 返回部分 tool_call 成功，部分失败：记录失败的 tool_call，继续执行成功的 tool_call
  - 如果所有 tool_call 都失败：标记执行失败，记录错误信息

## 6. 工具（Tools）设计
- 抽象 `RegisteredTool`：
  - name, description, schema (Zod)，execute(ctx, args)。
  - `toOpenAITool()`/`toAnthropicTool()` 产出兼容 schema。
- 运行期工具集合：ToolRegistry（按 Agent/请求过滤可用工具）。
- 示例内置工具：
  - `get_time`：返回当前时间。
  - `search_docs`：限定目录的只读检索（需做路径白名单和长度限制）。
- 安全：工具调用由 worker 执行，HTTP 线程不阻塞；对 args 做 Zod 校验和长度限制。

## 7. 配置建议（env）

### 7.1 LLM 配置
- `LLM_ENABLED=true` - 是否启用 LLM 功能
- `LLM_PROVIDER=openai|anthropic` - LLM 提供商
- `OPENAI_API_KEY` - OpenAI API Key
- `ANTHROPIC_API_KEY` - Anthropic API Key
- `OPENAI_MODEL` - OpenAI 模型名称（如 `gpt-4o`）
- `ANTHROPIC_MODEL` - Anthropic 模型名称（如 `claude-3-opus-20240229`）
- `OPENAI_TEMPERATURE` - OpenAI 温度参数（0-2）
- `OPENAI_MAX_TOKENS` - OpenAI 最大 tokens
- `LLM_TIMEOUT=30000` - LLM 调用超时（毫秒）
- `LLM_MAX_RETRIES=3` - LLM 调用最大重试次数

### 7.2 ReAct 限制配置
- `REACT_MAX_STEPS=8` - ReAct 最大步数
- `REACT_MAX_TOOL_CALLS=5` - 最大工具调用次数
- `REACT_MAX_TOKENS=10000` - 整个执行过程最大 tokens（累计）

### 7.3 队列配置
- `QUEUE_ENABLED=true` - 是否启用队列
- `QUEUE_REDIS_HOST=localhost` - Redis 主机
- `QUEUE_REDIS_PORT=6379` - Redis 端口
- `QUEUE_REDIS_DB=0` - Redis 数据库编号
- `QUEUE_CONCURRENCY=5` - Worker 并发数（每个 Worker 同时处理的任务数）
- `QUEUE_MAX_RETRIES=3` - 任务最大重试次数
- `QUEUE_RETRY_DELAY=1000` - 重试延迟（毫秒，指数退避起始值）
- `QUEUE_STALLED_INTERVAL=30000` - 卡住任务检测间隔（毫秒）

### 7.4 SSE 配置
- `SSE_HEARTBEAT_INTERVAL=30000` - 心跳间隔（毫秒）
- `SSE_MAX_CLIENTS=100` - 最大并发 SSE 连接数
- `SSE_MAX_CLIENTS_PER_USER=5` - 每个用户最大并发 SSE 连接数
- `SSE_MAX_CLIENTS_PER_AGENT=10` - 每个 Agent 最大并发 SSE 连接数
- `SSE_CONNECTION_TIMEOUT=300000` - 连接超时（毫秒，5 分钟）

### 7.5 Redis Stream 配置（可选）
- `SSE_REDIS_STREAM_ENABLED=true` - 是否启用 Redis Stream
- `SSE_REDIS_STREAM_TTL=604800` - 事件保留时长（秒，默认 7 天）

### 7.6 数据库连接池配置
- `DB_POOL_MIN=2` - 最小连接数
- `DB_POOL_MAX=10` - 最大连接数
- `DB_POOL_IDLE_TIMEOUT=30000` - 空闲连接超时（毫秒）

### 7.7 并发控制配置 ⭐ 新增
- `AGENT_MAX_CONCURRENT_EXECUTIONS=10` - 每个 Agent 最大并发执行数
- `USER_MAX_CONCURRENT_EXECUTIONS=5` - 每个用户最大并发执行数
- `GLOBAL_MAX_CONCURRENT_EXECUTIONS=100` - 全局最大并发执行数

## 8. HTTP 接口草案

**认证要求**：所有接口都需要 JWT 认证（通过 `auth` 领域验证），`user_id` 从 JWT token 中获取。

### 8.1 Agent 管理接口

**POST /api/agents** - 创建 Agent
- **Body**：
  ```json
  {
    "name": "string (required, max 100)",
    "description": "string (optional, max 5000)",
    "provider": "openai|anthropic (required)",
    "model": "string (required, max 100)",
    "system_prompt": "string (optional, max 10000)",
    "temperature": "number (optional, 0-2)",
    "max_tokens": "number (optional, min 1, max 100000)"
  }
  ```
- **Response**：
  ```json
  {
    "agent_id": "uuid",
    "name": "string",
    "status": "active",
    "created_at": "ISO 8601"
  }
  ```
- **错误码**：
  - `400` - 参数验证失败
  - `401` - 未认证
  - `409` - Agent 名称已存在（同一用户内）

**GET /api/agents** - 查询 Agent 列表
- **Query**：
  - `page` (int, default 1) - 页码
  - `limit` (int, default 20, max 100) - 每页数量
  - `status` (string, optional) - 状态筛选（active/inactive）
  - `provider` (string, optional) - 提供商筛选
- **Response**：
  ```json
  {
    "agents": [
      {
        "agent_id": "uuid",
        "name": "string",
        "description": "string",
        "provider": "string",
        "model": "string",
        "status": "string",
        "created_at": "ISO 8601"
      }
    ],
    "total_count": 100,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
  ```
- **权限**：只能查询自己创建的 Agent

**GET /api/agents/:id** - 查询 Agent 详情
- **Response**：包含完整的 Agent 信息
- **权限**：只能查询自己创建的 Agent

**PUT /api/agents/:id** - 更新 Agent
- **Body**：同创建接口（所有字段可选）
- **权限**：只能更新自己创建的 Agent

**DELETE /api/agents/:id** - 删除 Agent
- **权限**：只能删除自己创建的 Agent
- **注意**：删除前检查是否有正在执行的记录

### 8.2 Agent 执行接口

**POST /api/agents/:id/run** - 运行 Agent（生产者，入队）
- **Body**：
  ```json
  {
    "input": "string (required, max 10000)",
    "mode": "simple|react (optional, default simple)",
    "tools": ["string"] (optional, 工具过滤/追加),
    "max_steps": "number (optional, min 1, max 20)",
    "max_tool_calls": "number (optional, min 1, max 10)",
    "stream": "boolean (optional, default false)"
  }
  ```
- **Response**：
  ```json
  {
    "execution_id": "uuid",
    "status": "queued",
    "created_at": "ISO 8601"
  }
  ```
- **错误码**：
  - `400` - 参数验证失败、并发限制超限
  - `401` - 未认证
  - `403` - 无权限执行该 Agent
  - `404` - Agent 不存在
  - `429` - 并发执行数超限

**GET /api/agents/:id/executions/:exec_id/stream** - SSE 订阅执行事件
- **Headers**：
  - `Last-Event-ID` (optional) - 上次接收的事件 ID，用于断线重连
- **Response**：SSE 流，事件类型见 5.4 节
- **错误码**：
  - `401` - 未认证
  - `403` - 无权限查看该执行记录
  - `404` - 执行记录不存在
  - `429` - SSE 连接数超限

**GET /api/agents/:id/executions/:exec_id** - 查询单次执行（含 steps/summary）
- **Response**：
  ```json
  {
    "execution_id": "uuid",
    "agent_id": "uuid",
    "input": "string",
    "output": "string",
    "mode": "string",
    "status": "completed|failed",
    "steps": [
      {
        "step_no": 1,
        "thought": "string",
        "action": "string",
        "observation": "string",
        "output": "string"
      }
    ],
    "prompt_tokens": 1000,
    "completion_tokens": 500,
    "total_tokens": 1500,
    "created_at": "ISO 8601",
    "started_at": "ISO 8601",
    "completed_at": "ISO 8601"
  }
  ```
- **权限**：只能查询自己的执行记录

**GET /api/agents/:id/executions** - 分页列表
- **Query**：
  - `page` (int, default 1) - 页码
  - `limit` (int, default 20, max 100) - 每页数量
  - `status` (string, optional) - 状态筛选（queued/running/completed/failed）
  - `mode` (string, optional) - 模式筛选（simple/react）
  - `sort_by` (string, optional) - 排序字段（created_at/started_at/completed_at）
  - `sort_order` (string, optional) - 排序方向（asc/desc）
- **Response**：同列表接口格式
- **权限**：只能查询自己的执行记录

## 8. 并发控制 ⭐ 新增

### 8.1 并发执行限制

**限制层级**：
1. **全局限制**：整个系统的最大并发执行数（防止系统过载）
2. **用户限制**：每个用户的最大并发执行数（防止单个用户占用过多资源）
3. **Agent 限制**：每个 Agent 的最大并发执行数（防止单个 Agent 过载）

**实现方案**：

```typescript
// 使用 Redis 实现分布式并发控制
class ConcurrencyLimiter {
  private redis: Redis;
  
  async checkAndReserve(
    executionId: string,
    limits: {
      global: number;
      userId: string;
      userLimit: number;
      agentId: string;
      agentLimit: number;
    }
  ): Promise<boolean> {
    // 1. 检查全局限制
    const globalCount = await this.redis.get('agent:executions:global:count');
    if (globalCount && parseInt(globalCount) >= limits.global) {
      throw new Error('GLOBAL_CONCURRENCY_LIMIT_EXCEEDED: 全局并发执行数已达上限');
    }
    
    // 2. 检查用户限制
    const userKey = `agent:executions:user:${limits.userId}:count`;
    const userCount = await this.redis.get(userKey);
    if (userCount && parseInt(userCount) >= limits.userLimit) {
      throw new Error('USER_CONCURRENCY_LIMIT_EXCEEDED: 用户并发执行数已达上限');
    }
    
    // 3. 检查 Agent 限制
    const agentKey = `agent:executions:agent:${limits.agentId}:count`;
    const agentCount = await this.redis.get(agentKey);
    if (agentCount && parseInt(agentCount) >= limits.agentLimit) {
      throw new Error('AGENT_CONCURRENCY_LIMIT_EXCEEDED: Agent 并发执行数已达上限');
    }
    
    // 4. 预留资源（原子操作）
    const pipeline = this.redis.pipeline();
    pipeline.incr('agent:executions:global:count');
    pipeline.incr(userKey);
    pipeline.incr(agentKey);
    pipeline.setex(`agent:execution:${executionId}:reserved`, 3600, '1'); // 1 小时过期
    await pipeline.exec();
    
    return true;
  }
  
  async release(executionId: string, userId: string, agentId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.decr('agent:executions:global:count');
    pipeline.decr(`agent:executions:user:${userId}:count`);
    pipeline.decr(`agent:executions:agent:${agentId}:count`);
    pipeline.del(`agent:execution:${executionId}:reserved`);
    await pipeline.exec();
  }
}

// 使用示例
class AgentService {
  async runAgent(ctx: unknown, input: RunAgentInput): Promise<RunAgentOutput> {
    const executionId = generateExecutionId();
    
    try {
      // 1. 检查并发限制
      await this.concurrencyLimiter.checkAndReserve(executionId, {
        global: config.agent.maxConcurrentExecutions.global,
        userId: ctx.userId,
        userLimit: config.agent.maxConcurrentExecutions.user,
        agentId: input.agentId,
        agentLimit: config.agent.maxConcurrentExecutions.agent,
      });
      
      // 2. 执行 Agent
      const result = await this.reactExecutor.run(agent, input.input, {
        maxSteps: input.maxSteps,
      });
      
      return result;
    } finally {
      // 3. 释放资源
      await this.concurrencyLimiter.release(executionId, ctx.userId, input.agentId);
    }
  }
}
```

### 8.2 Worker 并发配置

**Worker 数量**：
- 建议 Worker 数量 = CPU 核心数 × 2（充分利用多核）
- 每个 Worker 的并发数（`QUEUE_CONCURRENCY`）建议设置为 5-10

**负载均衡**：
- 使用 BullMQ 的自动负载均衡
- 监控每个 Worker 的负载，动态调整并发数

## 9. 观测性与日志

### 9.1 Metrics（指标定义）

**核心指标**：
- `agent_executions_total` - 总执行次数（Counter，标签：status, mode, agent_id）
- `agent_executions_duration_seconds` - 执行耗时（Histogram，标签：mode, agent_id）
- `agent_llm_calls_total` - LLM 调用次数（Counter，标签：provider, model, status）
- `agent_llm_calls_duration_seconds` - LLM 调用耗时（Histogram，标签：provider, model）
- `agent_tool_calls_total` - 工具调用次数（Counter，标签：tool_name, status）
- `agent_tool_calls_duration_seconds` - 工具调用耗时（Histogram，标签：tool_name）
- `agent_react_steps_total` - ReAct 步数（Histogram，标签：agent_id）
- `agent_tokens_used` - Token 使用量（Counter，标签：provider, model, type=prompt|completion）
- `agent_resource_usage` - 资源使用量（Gauge，标签：resource_type=tokens|memory|time）

**计算方式**：
- **QPS**：`rate(agent_executions_total[1m])` - 每分钟执行次数
- **Latency**：`histogram_quantile(0.95, agent_executions_duration_seconds)` - P95 延迟
- **失败率**：`rate(agent_executions_total{status="failed"}[1m]) / rate(agent_executions_total[1m])` - 失败率

**告警阈值**（建议）：
- QPS > 100：高负载告警
- P95 延迟 > 30s：性能告警
- 失败率 > 5%：错误率告警
- Token 使用量 > 10000/分钟：成本告警

### 9.2 Tracing（分布式追踪）

**实现方式**：
- 使用 OpenTelemetry 或类似框架
- 每个执行创建一个 Trace，包含以下 Spans：
  - `agent.execution` - 整个执行过程
  - `agent.llm.call` - LLM 调用（标签：provider, model, step_no）
  - `agent.tool.execute` - 工具执行（标签：tool_name, step_no）
  - `agent.step` - ReAct 步骤（标签：step_no, step_type）

**Span Attributes**：
- `execution_id` - 执行 ID
- `agent_id` - Agent ID
- `user_id` - 用户 ID
- `mode` - 执行模式（simple/react）
- `step_no` - 步骤编号
- `tool_name` - 工具名称
- `provider` - LLM 提供商
- `model` - 模型名称

### 9.3 Logging（日志策略）

**日志级别**：
- **ERROR**：执行失败、LLM 调用失败、工具执行失败
- **WARN**：资源限制接近上限、重试、超时
- **INFO**：执行开始/结束、关键步骤
- **DEBUG**：详细执行过程（仅开发环境）

**日志格式**（结构化 JSON）：
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "execution_id": "uuid",
  "agent_id": "uuid",
  "user_id": "uuid",
  "message": "Execution started",
  "context": {
    "mode": "react",
    "input_length": 100,
    "step_no": 1
  }
}
```

**日志关联**：
- 所有日志都包含 `execution_id`，便于追踪
- 使用 `user_id` 和 `agent_id` 进行日志过滤

**日志采样**：
- 正常执行：记录关键日志（开始、结束、错误）
- 失败执行：记录完整日志（包括所有步骤）
- 开发环境：记录所有日志

### 9.4 SSE/Redis Stream 监控

**监控指标**：
- `sse_connections_active` - 当前活跃 SSE 连接数（Gauge）
- `sse_events_sent_total` - 发送的事件总数（Counter）
- `sse_replay_requests_total` - 回放请求总数（Counter）
- `redis_stream_size` - Redis Stream 大小（Gauge，标签：execution_id）
- `redis_stream_lag` - Redis Stream 滞后量（Gauge，标签：execution_id）

**告警阈值**：
- SSE 连接数 > 80% 最大连接数：告警
- Redis Stream 大小 > 10000：告警
- Redis Stream 滞后量 > 1000：告警

## 10. 测试策略

### 10.1 单元测试

**Agent 模型测试**：
- ✅ Agent 创建校验（名称、provider、默认 model/temperature）
- ✅ Agent 状态变更（active/inactive）
- ✅ Agent 配置验证（temperature 范围、max_tokens 范围）

**ReactExecutor 测试**：
- ✅ 成功链路：正常执行到完成
- ✅ 超步数：达到 maxSteps 后报错
- ✅ 超工具调用次数：达到 maxToolCalls 后报错
- ✅ 未知工具：调用未注册工具时报错
- ✅ 工具异常：工具执行失败时的处理
- ✅ LLM 异常：LLM 调用失败时的重试和错误处理
- ✅ 资源限制：Token、内存、时间限制的边界测试
- ✅ 并发执行：多个执行同时运行的场景

**ToolRegistry 测试**：
- ✅ 工具注册/注销
- ✅ 工具过滤/白名单
- ✅ 工具参数校验（Zod schema）
- ✅ 工具执行隔离

**ResourceLimiter 测试**：
- ✅ 各种资源限制的边界测试
- ✅ 资源使用量记录准确性
- ✅ 资源限制触发时的错误处理

### 10.2 集成测试（Fastify handlers）

**Agent 管理测试**：
- ✅ 创建 Agent（成功、参数校验失败、认证失败）
- ✅ 查询 Agent 列表（分页、筛选、排序）
- ✅ 更新 Agent（成功、权限验证）
- ✅ 删除 Agent（成功、权限验证）

**Agent 执行测试**：
- ✅ 同步执行（simple/react 模式）
- ✅ 异步执行（队列模式）
- ✅ 参数校验（input 长度、mode 验证）
- ✅ 权限验证（只能执行自己的 Agent）
- ✅ 并发限制（超过限制时返回错误）

**SSE 流式测试**：
- ✅ 正常订阅：收到 execution_started → thought/action/observation/token_usage → final
- ✅ 中途接入：携带 Last-Event-ID 从指定位置继续
- ✅ 连接断开：客户端断开后服务端正确处理
- ✅ 重连恢复：客户端重连后继续接收事件
- ✅ 事件丢失补偿：Redis Stream 丢失时从数据库恢复
- ✅ 并发连接限制：超过限制时返回 429

**队列测试**：
- ✅ 生产者入队：任务成功入队
- ✅ Worker 消费：任务成功消费和执行
- ✅ 任务重试：失败任务的重试机制
- ✅ 死信队列：超过最大重试次数后移入死信队列
- ✅ 幂等性：重复消费的防护

### 10.3 端到端测试（可选）

**完整流程测试**：
- ✅ 创建 Agent → 执行 Agent → 查看执行记录 → 删除 Agent
- ✅ 多用户场景：用户 A 创建 Agent，用户 B 无法访问
- ✅ 并发执行：多个用户同时执行不同的 Agent
- ✅ 资源限制：执行过程中触发资源限制

**Mock 策略**：
- **LLM Mock**：使用 Mock LLM 服务，模拟各种响应（成功、失败、超时）
- **工具 Mock**：使用 Mock 工具，模拟各种执行结果
- **Redis Mock**：使用内存 Redis（如 ioredis-mock）
- **数据库 Mock**：使用测试数据库（如 SQLite in-memory）

### 10.4 性能测试

**负载测试**：
- ✅ 并发执行 100 个 Agent
- ✅ 长时间运行（1 小时）的稳定性测试
- ✅ 高频率 SSE 连接（100 个并发连接）

**压力测试**：
- ✅ 逐步增加并发数，找到系统瓶颈
- ✅ 测试资源限制的触发和恢复
- ✅ 测试队列积压时的处理能力

### 10.5 测试数据管理

**测试环境隔离**：
- ✅ 使用独立的测试数据库
- ✅ 使用独立的测试 Redis
- ✅ 测试数据自动清理（每个测试后清理）

**测试数据准备**：
- ✅ 使用 Factory 模式创建测试数据
- ✅ 使用 Fixture 文件准备常用测试场景
- ✅ 使用 Seed 脚本初始化测试数据

## 11. 安全与限制

### 11.0 安全设计原则 ⭐ 重要

**权限控制**：
- **Agent 创建权限**：只有认证用户才能创建 Agent（通过 `auth` 领域验证）
- **Agent 执行权限**：用户只能执行自己创建的 Agent，或管理员分配的 Agent
- **执行记录访问**：用户只能查看自己的执行记录
- **多租户隔离**：通过 `user_id` 字段实现数据隔离，所有查询必须包含 `user_id` 过滤

**输入验证**：
- **SQL 注入防护**：使用参数化查询，禁止拼接 SQL
- **XSS 防护**：对用户输入进行转义，特别是 `system_prompt` 和 `input`
- **输入长度限制**：
  - `system_prompt`：最大 10000 字符
  - `input`：最大 10000 字符（见资源限制）
  - `name`：最大 100 字符
  - `description`：最大 5000 字符
- **内容过滤**：对恶意内容进行检测（可选，集成内容安全服务）

**工具安全**：
- **工具白名单**：只有注册的工具才能被调用，禁止动态加载工具
- **参数校验**：使用 Zod schema 严格校验工具参数
- **资源访问限制**：
  - 文件访问：只允许访问白名单目录，禁止访问系统目录
  - 网络访问：只允许访问白名单域名，禁止访问内网 IP
  - 命令执行：禁止执行系统命令（除非特殊工具，需额外权限）
- **工具执行隔离**：工具在独立的执行环境中运行，避免影响主进程

**数据安全**：
- **敏感数据加密**：
  - `system_prompt` 中的敏感信息（如 API Key）需要加密存储
  - 执行记录中的用户输入需要脱敏（可选）
- **日志脱敏**：
  - 日志中不记录完整的用户输入（只记录前 100 字符）
  - 不记录 API Key、密码等敏感信息
- **数据访问审计**：
  - 记录所有 Agent 创建、执行、查询操作
  - 记录异常访问（如跨用户访问）

**SSE 连接安全**：
- **鉴权**：SSE 连接必须携带有效的 JWT token
- **限流**：
  - 同一用户最多 5 个并发 SSE 连接
  - 同一 Agent 最多 10 个并发 SSE 连接
  - 超过限制时返回 429 错误
- **连接超时**：SSE 连接超过 5 分钟无活动自动断开

**队列任务安全**：
- **幂等性**：消费前检查 execution 状态，防重复消费（见 5.2 节）
- **任务验证**：验证任务参数，防止恶意任务
- **资源限制**：每个任务都有资源限制，防止资源耗尽（见 11.1 节）

**其他安全措施**：
- **API 限流**：使用 Redis 实现 API 限流（如每分钟 100 次请求）
- **CORS 配置**：限制允许的源域名
- **HTTPS 强制**：生产环境强制使用 HTTPS

### 11.1 资源限制（Resource Limiting）⭐ 重要

**为什么需要资源限制？**

Agent 执行可能消耗大量资源：
- **Token 消耗**：LLM API 按 token 计费，无限制可能导致巨额费用
- **执行时间**：无限循环或长时间运行会阻塞 worker
- **内存消耗**：大量数据或内存泄漏可能导致 OOM
- **CPU 消耗**：计算密集型工具可能耗尽 CPU
- **网络请求**：频繁调用外部 API 可能导致限流或费用

**需要限制的资源类型：**

| 资源类型 | 限制方式 | 默认值 | 配置项 |
|---------|---------|--------|--------|
| **Token 数量** | LLM 调用时限制 | 4000 tokens | `max_tokens` |
| **执行时间** | 超时控制 | 60 秒 | `execution_timeout` |
| **ReAct 步数** | 循环上限 | 8 步 | `max_steps` |
| **工具调用次数** | 累计计数 | 5 次 | `max_tool_calls` |
| **内存使用** | 进程监控 | 512MB | `max_memory` |
| **输入长度** | 字符数限制 | 10000 字符 | `max_input_length` |
| **输出长度** | 字符数限制 | 50000 字符 | `max_output_length` |

**实现方案：**

#### 方案 1：Token 限制（LLM 层面）

**⚠️ 重要：ReAct 循环的正确实现**

ReAct 模式的核心是**由 LLM 自己决定是否继续**，而不是强制循环固定次数：
- ❌ **错误**：`for (let i = 0; i < maxSteps; i++)` - 强制循环 maxSteps 次
- ✅ **正确**：`while (stepCount < maxSteps)` - LLM 决定何时结束

**正确的 ReAct 流程**：
1. LLM 调用，返回 response
2. 如果 response 有 `tool_call` → 执行工具 → 继续循环
3. 如果 response 没有 `tool_call` → LLM 已给出最终答案 → **立即返回**
4. 如果达到 `maxSteps` 还没有最终答案 → 报错

```typescript
// 在 AgentService 或 ReactExecutor 中限制
import { ChatOpenAI } from '@langchain/openai';
import { ToolMessage } from '@langchain/core/messages';

class AgentService {
  async runAgent(ctx: unknown, input: RunAgentInput): Promise<RunAgentOutput> {
    const agent = await this.agentRepo.findById(ctx, input.agentId);
    
    // 1. 从配置读取限制（Agent 配置或全局配置）
    const maxTokens = agent.maxTokens || 
                     config.llm.maxTokens || 
                     4000; // 默认值
    
    // 2. 创建 LLM 客户端时设置限制
    const llm = new ChatOpenAI({
      modelName: agent.model,
      temperature: agent.temperature,
      maxTokens: maxTokens, // ✅ 限制单次调用的最大 tokens
      maxRetries: 2,
    });
    
    // 3. 初始化 messages（包含 system prompt 和 user input）
    const messages = [];
    if (agent.systemPrompt) {
      messages.push(new SystemMessage(agent.systemPrompt));
    }
    messages.push(new HumanMessage(input.input));
    
    // 4. 累计 token 使用（跨多次调用）
    let totalTokens = 0;
    const maxTotalTokens = config.agent.maxTotalTokens || 10000;
    let stepCount = 0;
    const maxSteps = config.agent.maxSteps || 8;
    
    // ✅ 正确：使用 while 循环，由 LLM 决定是否继续
    while (stepCount < maxSteps) {
      stepCount++;
      
      const response = await llm.invoke(messages);
      
      // 5. 检查累计 tokens
      const stepTokens = response.response_metadata?.tokenUsage?.totalTokens || 0;
      totalTokens += stepTokens;
      if (totalTokens > maxTotalTokens) {
        throw new Error('MAX_TOKENS_EXCEEDED: 超过最大 token 限制');
      }
      
      // 6. 记录 token 使用（用于监控和计费）
      await this.recordTokenUsage(executionId, {
        step_no: stepCount,
        prompt_tokens: response.response_metadata?.tokenUsage?.promptTokens || 0,
        completion_tokens: response.response_metadata?.tokenUsage?.completionTokens || 0,
        total_tokens: stepTokens,
      });
      
      // 7. ✅ 关键：检查 LLM 是否返回 tool_call
      if (response.tool_calls && response.tool_calls.length > 0) {
        // 有 tool_call，执行工具后继续循环
        for (const toolCall of response.tool_calls) {
          const toolResult = await this.executeTool(toolCall);
          messages.push(response); // 添加 LLM 的响应
          messages.push(new ToolMessage({ content: toolResult, tool_call_id: toolCall.id }));
        }
        // ✅ 继续循环，让 LLM 继续推理
      } else {
        // ✅ 无 tool_call，LLM 已给出最终答案，立即返回
        return { output: response.content, status: 'completed' };
      }
    }
    
    // 如果达到 maxSteps 还没有最终答案，报错
    throw new Error(`MAX_STEPS_EXCEEDED: 达到最大步数 ${maxSteps}，未获得最终答案`);
  }
}
```

#### 方案 2：执行时间限制（超时控制）

```typescript
// 使用 Promise.race 实现超时
class ReactExecutor {
  async run(
    agent: Agent,
    input: string,
    options: { maxSteps?: number; timeout?: number }
  ): Promise<RunAgentOutput> {
    const timeout = options.timeout || 60 * 1000; // 默认 60 秒
    const startTime = Date.now();
    
    // 1. 包装执行逻辑，添加超时检查
    const executeWithTimeout = async () => {
      const maxSteps = options.maxSteps || 8;
      let stepCount = 0;
      
      // ✅ 正确：使用 while 循环，由 LLM 决定是否继续
      while (stepCount < maxSteps) {
        stepCount++;
        
        // 2. 每次循环检查是否超时
        const elapsed = Date.now() - startTime;
        if (elapsed > timeout) {
          throw new Error('EXECUTION_TIMEOUT: 执行超时');
        }
        
        // 3. 执行 LLM 调用（也设置超时）
        const response = await Promise.race([
          llm.invoke(messages),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM_TIMEOUT')), 30000) // LLM 调用 30 秒超时
          ),
        ]);
        
        // 4. ✅ 关键：检查 LLM 是否返回 tool_call
        if (response.tool_calls && response.tool_calls.length > 0) {
          // 有 tool_call，执行工具后继续循环
          for (const toolCall of response.tool_calls) {
            const toolResult = await this.executeTool(toolCall);
            messages.push(response);
            messages.push(new ToolMessage({ content: toolResult, tool_call_id: toolCall.id }));
          }
          // 继续循环
        } else {
          // ✅ 无 tool_call，LLM 已给出最终答案，立即返回
          return { output: response.content, status: 'completed' };
        }
      }
      
      throw new Error(`MAX_STEPS_EXCEEDED: 达到最大步数 ${maxSteps}，未获得最终答案`);
    };
    
    // 4. 整体超时控制
    return await Promise.race([
      executeWithTimeout(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('EXECUTION_TIMEOUT')), timeout)
      ),
    ]);
  }
}
```

#### 方案 3：内存限制（进程监控）⚠️ 注意事项

**⚠️ 重要：内存限制的局限性**

`process.memoryUsage().heapUsed` 只能监控 Node.js 进程的堆内存，不包括：
- 外部资源（数据库连接池、Redis 连接）
- 系统缓存（文件系统缓存）
- 其他进程的内存使用

**更准确的内存监控方案**：

```typescript
// 使用 Node.js 的 process.memoryUsage() 监控内存
// ⚠️ 注意：这只是近似值，实际内存使用可能更高
import { performance } from 'perf_hooks';

class ResourceLimiter {
  private maxMemory: number; // MB
  private startMemory: number;
  
  constructor(options: { maxMemory: number }) {
    this.maxMemory = options.maxMemory * 1024 * 1024; // 转换为字节
    // 使用 RSS（常驻集大小）更接近实际内存使用
    this.startMemory = process.memoryUsage().rss;
  }
  
  checkMemory(): void {
    // 使用 RSS（常驻集大小）更接近实际内存使用
    const currentMemory = process.memoryUsage().rss;
    const usedMemory = currentMemory - this.startMemory;
    
    if (usedMemory > this.maxMemory) {
      throw new Error(
        `MEMORY_LIMIT_EXCEEDED: 内存使用 ${Math.round(usedMemory / 1024 / 1024)}MB，超过限制 ${Math.round(this.maxMemory / 1024 / 1024)}MB`
      );
    }
  }
  
  // 获取更详细的内存信息（用于监控）
  getMemoryInfo(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss, // 常驻集大小（更接近实际内存使用）
    };
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 执行前检查
    this.checkMemory();
    
    try {
      const result = await fn();
      
      // 执行后检查
      this.checkMemory();
      
      return result;
    } catch (error) {
      // 异常时也检查内存（可能内存泄漏）
      this.checkMemory();
      throw error;
    }
  }
}

// 使用示例
class AgentService {
  async runAgent(ctx: unknown, input: RunAgentInput): Promise<RunAgentOutput> {
    const limiter = new ResourceLimiter({
      maxMemory: config.agent.maxMemory || 512, // 512MB
    });
    
    return await limiter.execute(async () => {
      // Agent 执行逻辑
      const result = await this.reactExecutor.run(agent, input.input, {
        maxSteps: input.maxSteps,
      });
      
      // 记录内存使用（用于监控）
      const memInfo = limiter.getMemoryInfo();
      await this.recordMemoryUsage(executionId, memInfo);
      
      return result;
    });
  }
}
```

**生产环境建议**：
- 使用容器级别的内存限制（如 Docker `--memory` 参数）
- 使用系统监控工具（如 Prometheus Node Exporter）监控实际内存使用
- 设置告警阈值（如 RSS 超过 80% 时告警）

#### 方案 4：步数和工具调用限制（ReAct 层面）

```typescript
class ReactExecutor {
  async run(
    agent: Agent,
    input: string,
    options: {
      maxSteps?: number;
      maxToolCalls?: number;
    }
  ): Promise<RunAgentOutput> {
    const maxSteps = options.maxSteps || 8;
    const maxToolCalls = options.maxToolCalls || 5;
    
    let stepCount = 0;
    let toolCallCount = 0;
    
    // ✅ 正确：使用 while 循环，由 LLM 决定是否继续
    while (stepCount < maxSteps) {
      stepCount++;
      
      const response = await llm.invoke(messages);
      
      // 1. 检查是否有 tool_call
      if (response.tool_calls && response.tool_calls.length > 0) {
        toolCallCount += response.tool_calls.length;
        
        // 2. 检查工具调用次数限制
        if (toolCallCount > maxToolCalls) {
          throw new Error(`MAX_TOOL_CALLS_EXCEEDED: 超过最大工具调用次数 ${maxToolCalls}`);
        }
        
        // 3. 执行工具
        for (const toolCall of response.tool_calls) {
          const toolResult = await this.executeTool(toolCall);
          // 将 LLM 响应和工具结果添加到 messages，供下一轮使用
          messages.push(response);
          messages.push(new ToolMessage({ content: toolResult, tool_call_id: toolCall.id }));
        }
        // ✅ 继续循环，让 LLM 继续推理
      } else {
        // ✅ 无 tool_call，LLM 已给出最终答案，立即返回
        return { output: response.content, status: 'completed' };
      }
    }
    
    // 如果达到 maxSteps 还没有最终答案，报错
    throw new Error(`MAX_STEPS_EXCEEDED: 达到最大步数 ${maxSteps}，未获得最终答案`);
  }
}
```

#### 方案 5：输入/输出长度限制

```typescript
class AgentService {
  async runAgent(ctx: unknown, input: RunAgentInput): Promise<RunAgentOutput> {
    // 1. 输入长度限制
    const maxInputLength = config.agent.maxInputLength || 10000;
    if (input.input.length > maxInputLength) {
      throw new Error(
        `INPUT_TOO_LONG: 输入长度 ${input.input.length}，超过限制 ${maxInputLength}`
      );
    }
    
    // 2. 执行 Agent
    const result = await this.reactExecutor.run(agent, input.input, {
      maxSteps: input.maxSteps,
    });
    
    // 3. 输出长度限制（截断或报错）
    const maxOutputLength = config.agent.maxOutputLength || 50000;
    if (result.output.length > maxOutputLength) {
      // 选项 1：截断
      result.output = result.output.substring(0, maxOutputLength) + '... [截断]';
      
      // 选项 2：报错（推荐，避免数据丢失）
      // throw new Error(`OUTPUT_TOO_LONG: 输出长度超过限制 ${maxOutputLength}`);
    }
    
    return result;
  }
}
```

#### 方案 6：综合资源限制器（推荐）

```typescript
/**
 * 综合资源限制器
 * 统一管理所有资源限制
 */
class AgentResourceLimiter {
  private config: {
    maxTokens: number;
    maxTotalTokens: number;
    maxExecutionTime: number;
    maxSteps: number;
    maxToolCalls: number;
    maxMemory: number;
    maxInputLength: number;
    maxOutputLength: number;
  };
  
  private startTime: number;
  private startMemory: number;
  private totalTokens: number = 0;
  private stepCount: number = 0;
  private toolCallCount: number = 0;
  
  constructor(config: Partial<typeof AgentResourceLimiter.prototype.config>) {
    this.config = {
      maxTokens: 4000,
      maxTotalTokens: 10000,
      maxExecutionTime: 60 * 1000, // 60 秒
      maxSteps: 8,
      maxToolCalls: 5,
      maxMemory: 512 * 1024 * 1024, // 512MB
      maxInputLength: 10000,
      maxOutputLength: 50000,
      ...config,
    };
    
    this.startTime = Date.now();
    // 使用 RSS（常驻集大小）更接近实际内存使用
    this.startMemory = process.memoryUsage().rss;
  }
  
  // 检查所有限制
  checkAll(): void {
    this.checkTime();
    this.checkMemory();
    this.checkSteps();
    this.checkToolCalls();
    this.checkTokens();
  }
  
  checkTime(): void {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.config.maxExecutionTime) {
      throw new Error(`EXECUTION_TIMEOUT: 执行时间 ${elapsed}ms，超过限制 ${this.config.maxExecutionTime}ms`);
    }
  }
  
  checkMemory(): void {
    // 使用 RSS（常驻集大小）更接近实际内存使用
    const currentMemory = process.memoryUsage().rss;
    const usedMemory = currentMemory - this.startMemory;
    if (usedMemory > this.config.maxMemory) {
      throw new Error(
        `MEMORY_LIMIT_EXCEEDED: 内存使用 ${Math.round(usedMemory / 1024 / 1024)}MB，超过限制 ${Math.round(this.config.maxMemory / 1024 / 1024)}MB`
      );
    }
  }
  
  checkSteps(): void {
    if (this.stepCount >= this.config.maxSteps) {
      throw new Error(`MAX_STEPS_EXCEEDED: 步数 ${this.stepCount}，超过限制 ${this.config.maxSteps}`);
    }
  }
  
  // 获取当前步数（用于循环判断）
  getStepCount(): number {
    return this.stepCount;
  }
  
  // 获取最大步数（用于循环判断）
  getMaxSteps(): number {
    return this.config.maxSteps;
  }
  
  checkToolCalls(): void {
    if (this.toolCallCount >= this.config.maxToolCalls) {
      throw new Error(`MAX_TOOL_CALLS_EXCEEDED: 工具调用次数 ${this.toolCallCount}，超过限制 ${this.config.maxToolCalls}`);
    }
  }
  
  checkTokens(): void {
    if (this.totalTokens >= this.config.maxTotalTokens) {
      throw new Error(`MAX_TOKENS_EXCEEDED: Token 使用 ${this.totalTokens}，超过限制 ${this.config.maxTotalTokens}`);
    }
  }
  
  // 记录使用量
  recordStep(): void {
    this.stepCount++;
    this.checkSteps();
    this.checkAll(); // 每次步进都检查所有限制
  }
  
  recordToolCall(): void {
    this.toolCallCount++;
    this.checkToolCalls();
    this.checkAll();
  }
  
  recordTokens(tokens: number): void {
    this.totalTokens += tokens;
    this.checkTokens();
    this.checkAll();
  }
  
  // 获取当前使用量（用于监控）
  getUsage(): {
    elapsedTime: number;
    memoryUsed: number;
    steps: number;
    toolCalls: number;
    tokens: number;
  } {
    return {
      elapsedTime: Date.now() - this.startTime,
      // 使用 RSS（常驻集大小）更接近实际内存使用
      memoryUsed: process.memoryUsage().rss - this.startMemory,
      steps: this.stepCount,
      toolCalls: this.toolCallCount,
      tokens: this.totalTokens,
    };
  }
}

// 使用示例
class ReactExecutor {
  async run(agent: Agent, input: string, options: RunAgentOptions): Promise<RunAgentOutput> {
    // 1. 创建资源限制器
    const limiter = new AgentResourceLimiter({
      maxTokens: agent.maxTokens || 4000,
      maxTotalTokens: options.maxTotalTokens || 10000,
      maxExecutionTime: options.timeout || 60 * 1000,
      maxSteps: options.maxSteps || 8,
      maxToolCalls: options.maxToolCalls || 5,
      maxMemory: options.maxMemory || 512 * 1024 * 1024,
    });
    
    try {
      // ✅ 正确：使用 while 循环，由 LLM 决定是否继续
      while (limiter.getStepCount() < limiter.getMaxSteps()) {
        // 2. 每次循环前检查限制
        limiter.checkAll();
        
        // 3. 记录步数（在循环开始时记录）
        limiter.recordStep();
        
        // 4. 调用 LLM
        const response = await llm.invoke(messages);
        
        // 5. 记录 token 使用
        const tokens = response.response_metadata?.tokenUsage?.totalTokens || 0;
        limiter.recordTokens(tokens);
        
        // 6. ✅ 关键：处理 tool_call
        if (response.tool_calls && response.tool_calls.length > 0) {
          // 有 tool_call，执行工具
          limiter.recordToolCall();
          
          for (const toolCall of response.tool_calls) {
            const toolResult = await this.executeTool(toolCall);
            // 将 LLM 响应和工具结果添加到 messages
            messages.push(response);
            messages.push(new ToolMessage({ content: toolResult, tool_call_id: toolCall.id }));
          }
          // ✅ 继续循环，让 LLM 继续推理
        } else {
          // ✅ 无 tool_call，LLM 已给出最终答案，立即返回
          return { output: response.content, status: 'completed' };
        }
      }
      
      // 如果达到 maxSteps 还没有最终答案，报错
      throw new Error(`MAX_STEPS_EXCEEDED: 达到最大步数 ${limiter.getMaxSteps()}，未获得最终答案`);
    } finally {
      // 7. 记录最终使用量（用于监控）
      const usage = limiter.getUsage();
      await this.recordResourceUsage(executionId, usage);
    }
  }
}
```

**配置建议（env）：**

```bash
# Agent 资源限制配置
AGENT_MAX_TOKENS=4000                    # 单次 LLM 调用最大 tokens
AGENT_MAX_TOTAL_TOKENS=10000             # 整个执行过程最大 tokens（累计）
AGENT_MAX_EXECUTION_TIME=60000           # 最大执行时间（毫秒）
AGENT_MAX_STEPS=8                        # ReAct 最大步数
AGENT_MAX_TOOL_CALLS=5                   # 最大工具调用次数
AGENT_MAX_MEMORY=512                     # 最大内存使用（MB）
AGENT_MAX_INPUT_LENGTH=10000             # 最大输入长度（字符）
AGENT_MAX_OUTPUT_LENGTH=50000            # 最大输出长度（字符）

# 监控与告警
AGENT_RESOURCE_MONITORING_ENABLED=true   # 是否启用资源监控
AGENT_RESOURCE_ALERT_THRESHOLD=0.8      # 告警阈值（80% 使用率）
```

**监控与告警：**

```typescript
// 资源使用监控
class ResourceMonitor {
  async recordUsage(executionId: string, usage: ResourceUsage): Promise<void> {
    // 1. 记录到数据库（用于分析）
    await this.db.insertInto('agent_resource_usage').values({
      execution_id: executionId,
      elapsed_time_ms: usage.elapsedTime,
      memory_used_mb: usage.memoryUsed / 1024 / 1024,
      steps: usage.steps,
      tool_calls: usage.toolCalls,
      tokens: usage.tokens,
      created_at: new Date(),
    });
    
    // 2. 检查是否超过阈值
    const threshold = config.agent.resourceAlertThreshold || 0.8;
    if (usage.tokens / config.agent.maxTotalTokens > threshold) {
      await this.alert('HIGH_TOKEN_USAGE', { executionId, usage });
    }
    
    if (usage.memoryUsed / config.agent.maxMemory > threshold) {
      await this.alert('HIGH_MEMORY_USAGE', { executionId, usage });
    }
    
    // 3. 记录到 Metrics（Prometheus）
    metrics.agentResourceUsage.observe({
      execution_id: executionId,
      resource_type: 'tokens',
    }, usage.tokens);
  }
}
```

**总结：**

- ✅ **必须限制**：Token 数量、执行时间、步数、工具调用次数
- ✅ **建议限制**：内存使用、输入/输出长度
- ✅ **统一管理**：使用 `AgentResourceLimiter` 统一管理所有限制
- ✅ **实时监控**：每次循环检查限制，避免资源耗尽
- ✅ **记录使用量**：用于计费、分析和告警

## 12. 后续扩展
- 支持多轮对话记忆（短期可选 redis 缓存）。
- 增加更多内置工具（检索、计算、知识库检索）。
- 扩展队列执行，支持长耗时 Agent。
- 对接前端：暴露 `data-test-id` 的运行界面与流式输出。

