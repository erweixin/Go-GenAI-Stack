# Monitoring - 可观测性模块

Go-GenAI-Stack 的完整可观测性解决方案，包含结构化日志、指标监控、分布式追踪。

## 📊 功能总览

| 模块 | 功能 | 依赖库 | 状态 |
|------|------|--------|------|
| **Logger** | 结构化日志、日志轮转 | uber-go/zap, lumberjack | ✅ |
| **Metrics** | Prometheus 指标、系统监控 | prometheus/client_golang | ✅ |
| **Tracing** | 分布式追踪、链路追踪 | OpenTelemetry | ✅ |
| **Health** | 健康检查、依赖检查 | - | ✅ |

## 🚀 快速开始

### 1. 配置环境变量

在 `.env` 文件中配置：

```bash
# ============================================
# 日志配置
# ============================================
APP_LOGGING_ENABLED=true              # 是否启用结构化日志
APP_LOGGING_LEVEL=info                # debug, info, warn, error
APP_LOGGING_FORMAT=json               # json, console
APP_LOGGING_OUTPUT=stdout             # stdout, stderr, file
APP_LOGGING_OUTPUT_PATH=./logs/app.log
APP_LOGGING_MAX_SIZE=100              # MB
APP_LOGGING_MAX_BACKUPS=3
APP_LOGGING_MAX_AGE=7                 # days
APP_LOGGING_COMPRESS=true

# ============================================
# Metrics 配置
# ============================================
APP_MONITORING_METRICS_ENABLED=true   # 是否启用 Prometheus Metrics
APP_MONITORING_METRICS_PATH=/metrics
APP_MONITORING_METRICS_PORT=0         # 0 表示与服务端口相同

# ============================================
# Tracing 配置
# ============================================
APP_MONITORING_TRACING_ENABLED=false  # 是否启用 OpenTelemetry Tracing
APP_MONITORING_TRACING_TYPE=otlp      # otlp, jaeger, stdout
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
APP_MONITORING_SAMPLE_RATE=0.1        # 采样率 10%

# ============================================
# Health Check 配置
# ============================================
APP_MONITORING_HEALTH_ENABLED=true
APP_MONITORING_HEALTH_PATH=/health
```

### 2. 启动应用

```bash
cd backend
go run cmd/server/main.go
```

### 3. 访问端点

- **API**: http://localhost:8080/api
- **Metrics**: http://localhost:8080/metrics
- **Health**: http://localhost:8080/health

## 📚 模块文档

### Logger（结构化日志）

- **文档**: [logger/README.md](./logger/README.md)
- **功能**: JSON/Console 格式、日志轮转、上下文注入
- **端点**: 输出到 stdout/file

**示例**:
```go
import "github.com/erweixin/go-genai-stack/infrastructure/monitoring/logger"

logger.Info("User logged in", zap.String("user_id", userID))
logger.Error("Failed to save", zap.Error(err))
```

### Metrics（Prometheus 监控）

- **文档**: [metrics/README.md](./metrics/README.md)
- **功能**: QPS、延迟、错误率、系统指标
- **端点**: `GET /metrics`

**示例**:
```go
import "github.com/erweixin/go-genai-stack/infrastructure/monitoring/metrics"

metrics.RecordRequest("GET", "/api/tasks", 200, 0.5)
```

**查看指标**:
```bash
curl http://localhost:8080/metrics
```

### Tracing（OpenTelemetry 追踪）

- **文档**: [tracing/README.md](./tracing/README.md)
- **功能**: 分布式追踪、Span 创建、上下文传播
- **后端**: Jaeger、Tempo、OTLP Collector

**示例**:
```go
import "github.com/erweixin/go-genai-stack/infrastructure/monitoring/tracing"

ctx, span := tracing.StartSpan(ctx, "CreateTask")
defer span.End()

span.SetAttributes(attribute.String("task.title", title))
```

### Health（健康检查）

- **文档**: 见本文档下方
- **功能**: 数据库、Redis 健康检查
- **端点**: `GET /health`

**示例**:
```bash
curl http://localhost:8080/health
```

**响应**:
```json
{
  "status": "up",
  "timestamp": "2025-11-24T12:00:00Z",
  "uptime": "1h30m",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "up",
      "message": "ok",
      "latency": "2ms"
    },
    "redis": {
      "status": "up",
      "message": "ok",
      "latency": "1ms"
    }
  }
}
```

## 🏗️ 架构设计

### 初始化流程

```go
// main.go
func main() {
    ctx := context.Background()
    cfg := config.Load()

    // 1. 初始化可观测性组件
    bootstrap.InitObservability(ctx, cfg)
    defer bootstrap.ShutdownObservability(ctx)

    // 2. 创建服务器
    h := bootstrap.CreateServer(cfg)

    // 3. 注册中间件（自动集成 Logger, Metrics, Tracing）
    bootstrap.RegisterMiddleware(h)

    // 4. 注册路由（包括 /metrics, /health）
    bootstrap.RegisterRoutes(h, container)

    // 5. 启动服务器
    h.Spin()
}
```

### 中间件集成

```
┌─────────────────────────────────────────────┐
│ Request                                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │ TracingMiddleware      │  ← 生成 TraceID, RequestID
       │ - 创建 Span            │  ← 提取/注入 Trace 上下文
       └────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │ LoggerMiddleware       │  ← 记录请求日志
       │ - 结构化日志输出       │  ← 记录 Metrics
       └────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │ RecoveryMiddleware     │  ← 捕获 panic
       └────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │ Handler                │  ← 业务逻辑
       └────────────────────────┘
```

## 🔧 开发环境配置

### 推荐配置（开发环境）

```bash
# 启用 Console 格式日志（便于阅读）
APP_LOGGING_ENABLED=true
APP_LOGGING_FORMAT=console
APP_LOGGING_OUTPUT=stdout

# 启用 Metrics（性能分析）
APP_MONITORING_METRICS_ENABLED=true

# 禁用 Tracing（避免依赖外部服务）
APP_MONITORING_TRACING_ENABLED=false
```

### 推荐配置（生产环境）

```bash
# 启用 JSON 格式日志（结构化查询）
APP_LOGGING_ENABLED=true
APP_LOGGING_FORMAT=json
APP_LOGGING_OUTPUT=file
APP_LOGGING_OUTPUT_PATH=/var/log/go-genai-stack/app.log

# 启用 Metrics（监控告警）
APP_MONITORING_METRICS_ENABLED=true

# 启用 Tracing（采样 10%）
APP_MONITORING_TRACING_ENABLED=true
APP_MONITORING_TRACING_TYPE=otlp
APP_MONITORING_TRACING_ENDPOINT=jaeger:4317
APP_MONITORING_SAMPLE_RATE=0.1
```

## 📊 集成 Prometheus + Grafana

### 1. 启动 Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'go-genai-stack'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8080']
```

```bash
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 2. 启动 Grafana

```bash
docker run -d \
  -p 3000:3000 \
  grafana/grafana
```

访问: http://localhost:3000 (admin/admin)

### 3. 导入 Dashboard

推荐使用：
- **Go Processes**: Dashboard ID 6671
- **HTTP Metrics**: 自定义 Dashboard

## 🔍 集成 Jaeger（分布式追踪）

### 1. 启动 Jaeger

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 4317:4317 \
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

http://localhost:16686

## 🐳 Docker Compose 集成

```yaml
version: '3.8'

services:
  # 应用
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      APP_MONITORING_METRICS_ENABLED: "true"
      APP_MONITORING_TRACING_ENABLED: "true"
      APP_MONITORING_TRACING_ENDPOINT: "jaeger:4317"
    depends_on:
      - prometheus
      - jaeger

  # Prometheus
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  # Grafana
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus

  # Jaeger
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "4317:4317"
      - "16686:16686"
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
```

启动：
```bash
docker-compose up -d
```

## 📖 最佳实践

### 1. 日志

- ✅ **生产环境**：使用 JSON 格式 + File 输出
- ✅ **开发环境**：使用 Console 格式 + Stdout 输出
- ✅ **上下文字段**：使用 `With()` 创建带上下文的 Logger
- ✅ **性能关键路径**：使用结构化字段，避免格式化字符串

### 2. Metrics

- ✅ **限制标签基数**：避免使用高基数标签（如用户 ID）
- ✅ **合理设置 Buckets**：根据实际延迟范围调整
- ✅ **业务指标**：使用 `metrics.NewCounter()` 创建自定义指标
- ✅ **避免过度监控**：只采集关键指标

### 3. Tracing

- ✅ **生产环境**：使用 10% 采样率（SampleRate=0.1）
- ✅ **开发环境**：使用 100% 采样率或 Stdout 导出器
- ✅ **命名规范**：使用 `ServiceName.MethodName` 格式
- ✅ **关键路径**：只追踪关键业务逻辑

### 4. 开关控制

- ✅ **默认启用**：Logger, Metrics, Health
- ✅ **默认禁用**：Tracing（避免强依赖外部服务）
- ✅ **环境变量**：所有开关都可通过环境变量控制
- ✅ **降级策略**：禁用时自动降级为简单实现

## 🔒 安全性

- **Metrics 端点**: 建议通过 Nginx 限制访问（仅允许 Prometheus）
- **Health 端点**: 可公开访问（不包含敏感信息）
- **日志脱敏**: 避免记录密码、Token 等敏感信息
- **Tracing 采样**: 生产环境使用采样，避免性能影响

## 🛠️ 故障排查

### 日志不输出

1. 检查 `APP_LOGGING_ENABLED=true`
2. 检查日志级别（`APP_LOGGING_LEVEL`）
3. 检查文件权限（如果使用 File 输出）

### Metrics 不可访问

1. 检查 `APP_MONITORING_METRICS_ENABLED=true`
2. 检查端口是否正确
3. 访问 http://localhost:8080/metrics

### Tracing 不工作

1. 检查 `APP_MONITORING_TRACING_ENABLED=true`
2. 检查 Jaeger/OTLP Collector 是否启动
3. 检查网络连接（`TRACING_ENDPOINT`）
4. 使用 `TRACING_TYPE=stdout` 调试

## 📦 依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `go.uber.org/zap` | v1.27.1 | 结构化日志 |
| `gopkg.in/natefinch/lumberjack.v2` | v2.2.1 | 日志轮转 |
| `github.com/prometheus/client_golang` | v1.23.2 | Prometheus 客户端 |
| `go.opentelemetry.io/otel` | v1.38.0 | OpenTelemetry SDK |
| `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` | v1.38.0 | OTLP gRPC Exporter |

## 🚀 路线图

- [ ] 添加更多预定义 Grafana Dashboard
- [ ] 支持 Tempo 后端（Grafana Tempo）
- [ ] 支持日志聚合（Loki）
- [ ] 添加告警规则模板（Alertmanager）
- [ ] 支持分布式追踪采样策略（基于错误率）

## 📞 支持

如有问题，请查看：
- [Logger 文档](./logger/README.md)
- [Metrics 文档](./metrics/README.md)
- [Tracing 文档](./tracing/README.md)
- [项目主 README](/README.md)

---

**Starter 定位**: 所有可观测性功能都支持开关控制，可根据项目需求灵活启用/禁用。

