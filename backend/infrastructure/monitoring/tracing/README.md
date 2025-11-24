# Tracing - OpenTelemetry 分布式追踪

基于 `go.opentelemetry.io/otel` 的分布式追踪模块，支持 Jaeger、Tempo、OpenTelemetry Collector。

## 功能特性

- ✅ **分布式追踪**：跨服务追踪请求链路
- ✅ **多种导出器**：支持 OTLP、Jaeger、Stdout
- ✅ **采样控制**：支持采样率配置（节省存储）
- ✅ **上下文传播**：自动传播 Trace 上下文（W3C TraceContext）
- ✅ **开关控制**：可通过配置禁用
- ✅ **与 Hertz 集成**：自动记录 HTTP 请求 Span

## 快速开始

### 1. 配置 Tracing

在 `.env` 文件中配置：

```bash
# Tracing 配置
APP_MONITORING_TRACING_ENABLED=true
APP_MONITORING_TRACING_TYPE=otlp         # otlp, jaeger, stdout
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
APP_MONITORING_SAMPLE_RATE=0.1           # 采样率 10%
```

### 2. 初始化 Tracer

```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/tracing"

// 在应用启动时初始化
err := tracing.InitGlobalTracer(ctx, cfg.Monitoring)
if err != nil {
    log.Fatalf("初始化 Tracer 失败: %v", err)
}

// 应用退出时关闭
defer tracing.ShutdownGlobalTracer(ctx)
```

### 3. 使用 Tracer

```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/tracing"
    "go.opentelemetry.io/otel/attribute"
)

// 开始一个 Span
ctx, span := tracing.StartSpan(ctx, "CreateTask")
defer span.End()

// 添加属性
span.SetAttributes(
    attribute.String("task.title", title),
    attribute.String("task.priority", priority),
)

// 记录事件
tracing.AddEvent(span, "TaskCreated", attribute.String("task_id", taskID))

// 记录错误
if err != nil {
    tracing.RecordError(span, err)
    span.SetStatus(codes.Error, err.Error())
}
```

## 导出器类型

### 1. OTLP（推荐）

适用于：Jaeger、Tempo、OpenTelemetry Collector

```bash
APP_MONITORING_TRACING_TYPE=otlp
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
```

**启动 Jaeger（支持 OTLP）**：

```bash
docker run -d --name jaeger \
  -p 4317:4317 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

访问 Jaeger UI：http://localhost:16686

### 2. Stdout（开发调试）

将 Trace 输出到标准输出：

```bash
APP_MONITORING_TRACING_TYPE=stdout
```

输出示例：

```json
{
  "Name": "CreateTask",
  "SpanContext": {
    "TraceID": "abc123...",
    "SpanID": "def456...",
    "TraceFlags": "01"
  },
  "StartTime": "2025-11-24T12:00:00Z",
  "EndTime": "2025-11-24T12:00:01Z",
  "Attributes": [
    { "Key": "task.title", "Value": { "Type": "STRING", "Value": "My Task" } }
  ]
}
```

### 3. Jaeger（兼容）

直接使用 OTLP 导出到 Jaeger：

```bash
APP_MONITORING_TRACING_TYPE=jaeger
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
```

## HTTP 请求追踪

### 自动追踪（Middleware）

在 Middleware 中自动创建 HTTP Span：

```go
func TracingMiddleware() app.HandlerFunc {
    return func(ctx context.Context, c *app.RequestContext) {
        tracer := tracing.GetGlobalTracer()
        if tracer == nil {
            c.Next(ctx)
            return
        }

        // 从 Headers 提取 Trace 上下文
        headers := make(map[string][]string)
        c.Request.Header.VisitAll(func(key, value []byte) {
            headers[string(key)] = []string{string(value)}
        })
        ctx = tracing.ExtractFromHeaders(ctx, headers)

        // 开始 HTTP Span
        ctx, span := tracing.StartHTTPSpan(ctx,
            string(c.Method()),
            string(c.Path()),
        )
        defer span.End()

        // 处理请求
        c.Next(ctx)

        // 记录响应状态
        span.SetAttributes(
            attribute.Int("http.status_code", c.Response.StatusCode()),
        )
    }
}
```

### 手动追踪（业务逻辑）

在 Service 层手动创建 Span：

```go
func (s *TaskService) CreateTask(ctx context.Context, input CreateTaskInput) (*CreateTaskOutput, error) {
    // 开始一个子 Span
    ctx, span := tracing.StartSpan(ctx, "TaskService.CreateTask")
    defer span.End()

    // 添加业务属性
    span.SetAttributes(
        attribute.String("task.title", input.Title),
        attribute.String("task.priority", input.Priority),
    )

    // 执行业务逻辑
    task, err := s.taskRepo.Create(ctx, task)
    if err != nil {
        tracing.RecordError(span, err)
        return nil, err
    }

    // 记录事件
    tracing.AddEvent(span, "TaskCreated", attribute.String("task_id", task.ID))

    return &CreateTaskOutput{Task: task}, nil
}
```

## 跨服务追踪

### 1. 注入 Trace 上下文（客户端）

发起 HTTP 请求时，将 Trace 上下文注入到 Headers：

```go
import "net/http"

// 创建请求
req, _ := http.NewRequestWithContext(ctx, "GET", "http://other-service/api", nil)

// 注入 Trace 上下文
headers := make(map[string][]string)
tracing.InjectToHeaders(ctx, headers)
for key, values := range headers {
    for _, value := range values {
        req.Header.Add(key, value)
    }
}

// 发送请求
resp, err := http.DefaultClient.Do(req)
```

### 2. 提取 Trace 上下文（服务端）

在 Middleware 中提取 Trace 上下文：

```go
// 从 Headers 提取上下文
ctx = tracing.ExtractFromHeaders(ctx, c.Request.Header)

// 后续所有 Span 都会继承这个 TraceID
ctx, span := tracing.StartSpan(ctx, "ProcessRequest")
defer span.End()
```

## 采样控制

### 1. 配置采样率

```bash
APP_MONITORING_SAMPLE_RATE=0.1  # 10% 采样
```

### 2. 采样策略

- **0.0**: 不采样（禁用）
- **0.1**: 10% 采样（推荐生产环境）
- **1.0**: 100% 采样（开发环境）

### 3. 自定义采样

```go
import "go.opentelemetry.io/otel/sdk/trace"

// 使用 ParentBased 采样器（如果父 Span 被采样，子 Span 也会被采样）
sampler := trace.ParentBased(trace.TraceIDRatioBased(0.1))
```

## 集成 Jaeger

### 1. 启动 Jaeger

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest
```

### 2. 配置应用

```bash
APP_MONITORING_TRACING_ENABLED=true
APP_MONITORING_TRACING_TYPE=otlp
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
```

### 3. 访问 Jaeger UI

```
http://localhost:16686
```

### 4. 查看 Trace

- 搜索 Service: `go-genai-stack`
- 查看 Trace 时间线
- 分析性能瓶颈

## 集成 Tempo

### 1. 启动 Tempo

```bash
docker run -d --name tempo \
  -p 4317:4317 \
  -p 3200:3200 \
  grafana/tempo:latest \
  -config.file=/etc/tempo.yaml
```

### 2. 配置 Grafana

- 添加 Tempo 数据源：`http://localhost:3200`
- 查看 Trace：Explore → Tempo → Search

## 性能优化

1. **使用采样**：生产环境使用 10% 采样（SampleRate=0.1）
2. **批量导出**：使用 BatchSpanProcessor（默认）
3. **异步导出**：Span 导出不会阻塞请求
4. **限制属性数量**：避免添加过多属性

## 禁用 Tracing

在配置中设置 `TracingEnabled=false`：

```bash
APP_MONITORING_TRACING_ENABLED=false
```

此时：
- `NewTracer()` 返回 `nil`
- 所有 `tracing.StartSpan()` 返回 NoOp Span
- 不会发送任何 Trace 数据

## 常见用例

### 1. 数据库查询追踪

```go
ctx, span := tracing.StartSpan(ctx, "TaskRepository.Create")
defer span.End()

span.SetAttributes(
    attribute.String("db.system", "postgresql"),
    attribute.String("db.statement", query),
)

_, err := db.ExecContext(ctx, query, args...)
if err != nil {
    tracing.RecordError(span, err)
}
```

### 2. 外部 API 调用追踪

```go
ctx, span := tracing.StartSpan(ctx, "LLM.GenerateText",
    trace.WithSpanKind(trace.SpanKindClient),
)
defer span.End()

span.SetAttributes(
    attribute.String("llm.provider", "openai"),
    attribute.String("llm.model", "gpt-4o"),
)

response, err := llmClient.Generate(ctx, prompt)
if err != nil {
    tracing.RecordError(span, err)
}
```

### 3. 异步任务追踪

```go
// 主 Span
ctx, span := tracing.StartSpan(ctx, "ProcessTask")
defer span.End()

// 异步任务（传递上下文）
go func(ctx context.Context) {
    ctx, span := tracing.StartSpan(ctx, "AsyncWorker")
    defer span.End()

    // 执行异步任务
}(ctx)
```

## 最佳实践

1. **命名规范**：使用 `ServiceName.MethodName` 格式（如 `TaskService.CreateTask`）
2. **关键路径**：只追踪关键业务逻辑，避免过度追踪
3. **错误记录**：所有错误都应记录到 Span
4. **采样率**：生产环境使用 10% 采样，开发环境使用 100%
5. **上下文传递**：跨服务调用时传递 Trace 上下文

## 依赖

- `go.opentelemetry.io/otel` - OpenTelemetry SDK
- `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` - OTLP gRPC Exporter
- `go.opentelemetry.io/otel/exporters/stdout/stdouttrace` - Stdout Exporter

## 参考资料

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/instrumentation/go/)
- [Jaeger 官方文档](https://www.jaegertracing.io/docs/)
- [Grafana Tempo 文档](https://grafana.com/docs/tempo/latest/)

