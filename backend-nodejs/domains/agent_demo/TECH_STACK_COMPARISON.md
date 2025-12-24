# Agent Demo 技术选型对比分析

## 📋 方案概览

针对 Agent Demo 领域，我们对比以下三种技术方案：

1. **LangChain.js** - 成熟的 Agent 框架
2. **Vercel AI SDK** - 轻量级 AI SDK
3. **原生 SDK** - 直接使用 OpenAI/Anthropic 官方 SDK

---

## 🔍 方案对比

### 方案 1：LangChain.js

#### ✅ 优点

1. **功能完整**
   - ✅ 内置 ReAct Agent 实现（`createReactAgent`）
   - ✅ 工具调用抽象（`StructuredTool`、`Tool`）
   - ✅ 多 Provider 支持（OpenAI、Anthropic、Google 等）
   - ✅ 流式输出支持（`streamEvents`）
   - ✅ 消息历史管理（`ChatMessageHistory`）
   - ✅ 链式组合（LCEL - LangChain Expression Language）

2. **开发效率高**
   - ✅ 开箱即用的 Agent 实现
   - ✅ 丰富的工具生态（文档加载、向量检索等）
   - ✅ 社区活跃，文档完善
   - ✅ 示例代码丰富

3. **扩展性强**
   - ✅ 支持自定义工具（`DynamicStructuredTool`）
   - ✅ 支持自定义 Agent 策略
   - ✅ 支持多 Agent 协作（LangGraph）

4. **生产就绪**
   - ✅ 错误处理和重试机制
   - ✅ Token 使用统计
   - ✅ 回调系统（用于监控）

#### ❌ 缺点

1. **依赖重**
   - ❌ 包体积大（`@langchain/core` + `@langchain/openai` + `@langchain/anthropic` 等）
   - ❌ 依赖树深（可能引入不必要的依赖）
   - ❌ 安装时间长

2. **学习曲线**
   - ❌ 概念多（Chain、Agent、Tool、Memory 等）
   - ❌ API 变化频繁（版本间可能有 breaking changes）
   - ❌ 文档分散（多个包，文档不统一）

3. **灵活性受限**
   - ❌ 框架封装较深，定制化需要深入理解内部实现
   - ❌ 某些场景下可能过度设计（如简单的 simple 模式）

4. **性能开销**
   - ❌ 框架层抽象带来一定性能开销
   - ❌ 内存占用相对较大

#### 📦 依赖示例

```json
{
  "@langchain/core": "^0.3.0",
  "@langchain/openai": "^0.3.0",
  "@langchain/anthropic": "^0.3.0",
  "@langchain/community": "^0.3.0"  // 可选，工具生态
}
```

#### 💻 代码示例

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/core/agents';
import { pull } from '@langchain/core/hub';

// 创建 LLM
const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.7,
});

// 创建工具
const tools = [
  new DynamicStructuredTool({
    name: 'get_time',
    description: 'Get current time',
    schema: z.object({}),
    func: async () => new Date().toISOString(),
  }),
];

// 创建 ReAct Agent
const agent = await createReactAgent({
  llm,
  tools,
  prompt: await pull('hwchase17/react'),
});

// 执行
const result = await agent.invoke({
  input: 'What time is it?',
});
```

---

### 方案 2：Vercel AI SDK

#### ✅ 优点

1. **轻量级**
   - ✅ 包体积小（核心包 < 100KB）
   - ✅ 依赖少，安装快
   - ✅ 性能开销小

2. **类型安全**
   - ✅ 完整的 TypeScript 类型定义
   - ✅ 与项目 TypeScript 技术栈一致

3. **流式输出优秀**
   - ✅ 原生支持流式输出（`streamText`、`streamObject`）
   - ✅ 与 React Server Components 集成好
   - ✅ SSE 支持完善

4. **多 Provider 支持**
   - ✅ 统一的 Provider 接口（`createOpenAI`、`createAnthropic`）
   - ✅ 易于切换 Provider
   - ✅ 支持自定义 Provider

5. **工具调用支持**
   - ✅ 支持结构化工具调用（`tool`）
   - ✅ 工具调用流式输出

#### ❌ 缺点

1. **Agent 实现需自建**
   - ❌ 没有内置 ReAct Agent
   - ❌ 需要自己实现 ReAct 循环逻辑
   - ❌ 工具调用需要手动处理

2. **功能相对简单**
   - ❌ 没有内置的 Memory 管理
   - ❌ 没有内置的链式组合
   - ❌ 工具生态较少

3. **文档相对较少**
   - ❌ 社区相对较小
   - ❌ 示例代码较少（特别是 Agent 场景）

4. **生产特性不足**
   - ❌ 错误处理需要自己实现
   - ❌ Token 统计需要自己实现
   - ❌ 监控回调需要自己实现

#### 📦 依赖示例

```json
{
  "ai": "^3.0.0",  // 核心包
  "openai": "^4.0.0",  // 或 "@anthropic-ai/sdk": "^0.20.0"
  "zod": "^3.22.0"  // 工具 schema 定义
}
```

#### 💻 代码示例

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 定义工具
const getTimeTool = tool({
  description: 'Get current time',
  parameters: z.object({}),
  execute: async () => ({
    time: new Date().toISOString(),
  }),
});

// 流式执行（需要自己实现 ReAct 循环）
const result = await streamText({
  model: openai('gpt-4o'),
  tools: {
    getTime: getTimeTool,
  },
  prompt: 'What time is it?',
});

// 处理流式输出
for await (const chunk of result.textStream) {
  console.log(chunk);
}
```

**注意**：ReAct 循环需要自己实现，例如：

```typescript
// 需要自己实现 ReAct 循环
async function reactLoop(input: string, maxSteps: number) {
  let stepCount = 0;
  const messages = [{ role: 'user', content: input }];
  
  while (stepCount < maxSteps) {
    const result = await streamText({
      model: openai('gpt-4o'),
      tools: { getTime: getTimeTool },
      messages,
    });
    
    // 检查是否有 tool_call
    if (result.toolCalls && result.toolCalls.length > 0) {
      // 执行工具并继续循环
      for (const toolCall of result.toolCalls) {
        const toolResult = await executeTool(toolCall);
        messages.push({
          role: 'tool',
          content: toolResult,
          toolCallId: toolCall.toolCallId,
        });
      }
      stepCount++;
    } else {
      // 无 tool_call，返回最终答案
      return result.text;
    }
  }
  
  throw new Error('MAX_STEPS_EXCEEDED');
}
```

---

### 方案 3：原生 SDK（OpenAI/Anthropic）

#### ✅ 优点

1. **最轻量**
   - ✅ 包体积最小
   - ✅ 无额外抽象层
   - ✅ 性能最优

2. **完全控制**
   - ✅ 完全控制执行流程
   - ✅ 易于理解和调试
   - ✅ 符合项目"透明性"理念

3. **官方支持**
   - ✅ 官方维护，更新及时
   - ✅ 文档完善
   - ✅ 类型定义完整

4. **灵活性最高**
   - ✅ 可以完全按照项目需求实现
   - ✅ 易于集成到现有架构
   - ✅ 易于扩展和定制

#### ❌ 缺点

1. **开发工作量大**
   - ❌ 需要自己实现 ReAct 循环
   - ❌ 需要自己实现工具调用
   - ❌ 需要自己实现流式输出处理
   - ❌ 需要自己实现错误处理和重试

2. **多 Provider 支持复杂**
   - ❌ 需要为每个 Provider 实现适配层
   - ❌ Provider 切换需要修改代码
   - ❌ 工具调用格式不统一（OpenAI vs Anthropic）

3. **功能需要自建**
   - ❌ 没有内置的工具抽象
   - ❌ 没有内置的 Memory 管理
   - ❌ 没有内置的链式组合

4. **维护成本高**
   - ❌ 需要维护更多代码
   - ❌ 需要处理各种边界情况
   - ❌ 需要自己实现监控和统计

#### 📦 依赖示例

```json
{
  "openai": "^4.0.0",
  "@anthropic-ai/sdk": "^0.20.0",
  "zod": "^3.22.0"  // 工具 schema 定义
}
```

#### 💻 代码示例

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// 创建客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 需要自己实现 Provider 抽象
interface LLMProvider {
  chat(messages: Message[]): Promise<ChatResponse>;
  streamChat(messages: Message[]): AsyncIterable<ChatChunk>;
}

// 需要自己实现 ReAct 循环
async function reactLoop(
  provider: LLMProvider,
  input: string,
  tools: Tool[],
  maxSteps: number
) {
  let stepCount = 0;
  const messages = [{ role: 'user', content: input }];
  
  while (stepCount < maxSteps) {
    // 调用 LLM
    const response = await provider.chat(messages);
    
    // 检查 tool_call
    if (response.toolCalls && response.toolCalls.length > 0) {
      // 执行工具
      for (const toolCall of response.toolCalls) {
        const tool = tools.find(t => t.name === toolCall.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${toolCall.name}`);
        }
        const result = await tool.execute(toolCall.args);
        messages.push({
          role: 'tool',
          content: result,
          toolCallId: toolCall.id,
        });
      }
      stepCount++;
    } else {
      return response.content;
    }
  }
  
  throw new Error('MAX_STEPS_EXCEEDED');
}
```

---

## 📊 对比总结

| 维度 | LangChain.js | Vercel AI SDK | 原生 SDK |
|------|-------------|---------------|----------|
| **包体积** | 大（~5MB） | 小（~100KB） | 最小（~500KB） |
| **学习曲线** | 陡峭 | 平缓 | 平缓 |
| **开发效率** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **性能** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **灵活性** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **ReAct 支持** | ✅ 内置 | ❌ 需自建 | ❌ 需自建 |
| **工具调用** | ✅ 完善 | ✅ 支持 | ❌ 需自建 |
| **流式输出** | ✅ 支持 | ✅ 优秀 | ✅ 支持 |
| **多 Provider** | ✅ 统一接口 | ✅ 统一接口 | ❌ 需适配 |
| **生产特性** | ✅ 完善 | ⚠️ 需补充 | ❌ 需自建 |
| **维护成本** | 低 | 中 | 高 |

---

## 🎯 推荐方案

### 推荐：**Vercel AI SDK + 自建 ReAct 循环**

#### 理由

1. **符合项目理念**
   - ✅ 轻量级，符合"透明性"理念
   - ✅ 类型安全，符合 TypeScript 技术栈
   - ✅ 易于理解和调试

2. **平衡开发效率和灵活性**
   - ✅ 流式输出支持优秀（符合 SSE 需求）
   - ✅ 工具调用支持完善
   - ✅ 多 Provider 统一接口
   - ✅ 需要自己实现 ReAct，但实现简单（符合项目需求）

3. **适合项目场景**
   - ✅ Agent Demo 是演示领域，不需要过度设计
   - ✅ ReAct 循环逻辑相对固定，自建成本低
   - ✅ 可以完全控制执行流程，便于集成到 DDD 架构

4. **未来扩展性好**
   - ✅ 如果后续需要更复杂功能，可以迁移到 LangChain
   - ✅ 如果后续需要更高性能，可以优化实现
   - ✅ 代码量可控，易于维护

#### 实现建议

```typescript
// 1. 使用 Vercel AI SDK 作为 LLM 调用层
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';

// 2. 自建 ReAct 循环（符合项目架构）
class ReactExecutor {
  async run(
    provider: 'openai' | 'anthropic',
    input: string,
    tools: Tool[],
    options: ReactOptions
  ): Promise<ReactResult> {
    // 实现 ReAct 循环逻辑
    // 符合 README.md 中的设计
  }
}

// 3. 工具抽象（符合项目 DDD 架构）
interface RegisteredTool {
  name: string;
  description: string;
  schema: z.ZodSchema;
  execute(ctx: unknown, args: unknown): Promise<string>;
}
```

---

## 🔄 备选方案

### 如果开发时间紧张：**LangChain.js**

- 适用于：需要快速上线，功能要求完整
- 风险：依赖重，可能过度设计

### 如果追求极致性能：**原生 SDK**

- 适用于：性能要求极高，有充足开发时间
- 风险：开发工作量大，维护成本高

---

## 📝 最终建议

**推荐使用 Vercel AI SDK + 自建 ReAct 循环**，原因：

1. ✅ **符合项目理念**：轻量、透明、类型安全
2. ✅ **开发效率适中**：核心功能有 SDK 支持，复杂逻辑自建
3. ✅ **灵活性高**：完全控制执行流程，易于集成 DDD 架构
4. ✅ **维护成本可控**：代码量适中，易于理解和维护
5. ✅ **未来扩展性好**：可以根据需求演进

**实施步骤**：

1. 安装 Vercel AI SDK：`pnpm add ai @ai-sdk/openai @ai-sdk/anthropic`
2. 实现 `ReactExecutor` 类（参考 README.md 中的设计）
3. 实现 `RegisteredTool` 接口（符合 DDD 架构）
4. 集成到 `AgentService`（符合三层架构）

---

## 🔗 参考资源

- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [LangChain.js 文档](https://js.langchain.com/)
- [OpenAI SDK 文档](https://github.com/openai/openai-node)
- [Anthropic SDK 文档](https://github.com/anthropics/anthropic-sdk-typescript)

