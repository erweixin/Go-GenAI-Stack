# Metrics - Prometheus 监控指标

基于 `prometheus/client_golang` 的 Metrics 收集模块，提供 HTTP 和系统指标。

## 功能特性

- ✅ **HTTP 指标**：QPS、延迟分布、错误率、响应大小
- ✅ **系统指标**：Goroutine 数量、内存使用、CPU 使用
- ✅ **自定义指标**：支持 Counter、Gauge、Histogram
- ✅ **开关控制**：可通过配置禁用
- ✅ **独立 Registry**：不污染全局 Prometheus Registry

## 快速开始

### 1. 配置 Metrics

在 `.env` 文件中配置：

```bash
# Metrics 配置
APP_MONITORING_METRICS_ENABLED=true
APP_MONITORING_METRICS_PATH=/metrics
APP_MONITORING_METRICS_PORT=0  # 0 表示与服务端口相同
```

### 2. 初始化 Metrics

```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/metrics"

// 在应用启动时初始化
metrics.InitGlobalMetrics(cfg.Monitoring)
```

### 3. 暴露 /metrics 端点

```go
import (
    "github.com/cloudwego/hertz/pkg/app/server"
    "github.com/hertz-contrib/pprof"
)

h := server.Default()

// 添加 /metrics 端点
if metrics := metrics.GetGlobalMetrics(); metrics != nil {
    h.GET("/metrics", func(c context.Context, ctx *app.RequestContext) {
        handler := metrics.GetHandler()
        handler.ServeHTTP(ctx.Response.BodyWriter(), ctx.Request.Request)
    })
}
```

### 4. 访问 Metrics

```bash
curl http://localhost:8080/metrics
```

输出示例：

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/tasks",status="200"} 1523

# HELP http_request_duration_seconds HTTP request latency in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",path="/api/tasks",le="0.005"} 120
http_request_duration_seconds_bucket{method="GET",path="/api/tasks",le="0.01"} 450
http_request_duration_seconds_bucket{method="GET",path="/api/tasks",le="0.025"} 980
http_request_duration_seconds_sum{method="GET",path="/api/tasks"} 15.6
http_request_duration_seconds_count{method="GET",path="/api/tasks"} 1523

# HELP http_requests_in_flight Current number of HTTP requests being served
# TYPE http_requests_in_flight gauge
http_requests_in_flight 5

# HELP go_goroutines_count Number of goroutines that currently exist
# TYPE go_goroutines_count gauge
go_goroutines_count 42

# HELP go_memory_alloc_bytes Number of bytes allocated and still in use
# TYPE go_memory_alloc_bytes gauge
go_memory_alloc_bytes 8234567
```

## 内置指标

### HTTP 指标

| 指标名称                            | 类型      | 说明               | 标签                      |
| ----------------------------------- | --------- | ------------------ | ------------------------- |
| `http_requests_total`               | Counter   | 请求总数           | method, path, status      |
| `http_request_duration_seconds`     | Histogram | 请求延迟分布       | method, path              |
| `http_requests_in_flight`           | Gauge     | 当前正在处理的请求 | -                         |
| `http_response_size_bytes`          | Histogram | 响应大小分布       | method, path              |

### 系统指标

| 指标名称                    | 类型  | 说明                   |
| --------------------------- | ----- | ---------------------- |
| `go_goroutines_count`       | Gauge | Goroutine 数量         |
| `go_memory_alloc_bytes`     | Gauge | 已分配内存（仍在使用） |
| `go_memory_sys_bytes`       | Gauge | 从系统获取的内存       |

### Go Runtime 指标

由 `collectors.NewGoCollector()` 自动采集：

- `go_gc_duration_seconds` - GC 耗时
- `go_memstats_*` - 详细内存统计
- `go_threads` - 线程数

## 自定义指标

### Counter（计数器）

用于只增不减的指标（如任务创建数）：

```go
metrics := metrics.GetGlobalMetrics()

// 创建 Counter
taskCreated := metrics.NewCounter("task_created_total", "Total tasks created")

// 增加计数
taskCreated.Inc()
```

### CounterVec（带标签的 Counter）

```go
// 创建带标签的 Counter
taskCounter := metrics.NewCounterVec(
    "task_created_total",
    "Total tasks created",
    []string{"priority", "status"},
)

// 按标签增加计数
taskCounter.WithLabelValues("high", "pending").Inc()
taskCounter.WithLabelValues("low", "completed").Inc()
```

### Gauge（仪表盘）

用于可增可减的指标（如在线用户数）：

```go
// 创建 Gauge
activeUsers := metrics.NewGauge("active_users", "Current active users")

// 设置值
activeUsers.Set(100)

// 增加
activeUsers.Inc()

// 减少
activeUsers.Dec()
```

### Histogram（直方图）

用于统计分布（如数据库查询耗时）：

```go
// 创建 Histogram
dbQueryDuration := metrics.NewHistogram(
    "db_query_duration_seconds",
    "Database query duration",
    []float64{.001, .005, .01, .05, .1, .5, 1}, // 自定义 Buckets
)

// 记录观察值
start := time.Now()
// ... 执行数据库查询 ...
dbQueryDuration.Observe(time.Since(start).Seconds())
```

## 与 Middleware 集成

参见 `infrastructure/middleware/logger.go` 的实现：

```go
// 在请求开始时增加计数
metrics.IncInFlight()
defer metrics.DecInFlight()

start := time.Now()

// 处理请求
c.Next(ctx)

// 记录指标
duration := time.Since(start).Seconds()
metrics.RecordRequest(
    string(c.Method()),
    string(c.Path()),
    c.Response.StatusCode(),
    duration,
)
```

## Prometheus 集成

### 1. 配置 Prometheus

在 `prometheus.yml` 中添加：

```yaml
scrape_configs:
  - job_name: 'go-genai-stack'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8080']
```

### 2. 启动 Prometheus

```bash
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 3. 访问 Prometheus UI

```
http://localhost:9090
```

### 4. 常用 PromQL 查询

**QPS（每秒请求数）**：
```promql
rate(http_requests_total[1m])
```

**P99 延迟**：
```promql
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

**错误率**：
```promql
sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m]))
```

**内存使用**：
```promql
go_memory_alloc_bytes / 1024 / 1024
```

## Grafana 集成

### 1. 添加 Prometheus 数据源

- URL: `http://localhost:9090`

### 2. 导入 Dashboard

推荐使用以下 Dashboard：

- **Go Processes**: [ID: 6671](https://grafana.com/grafana/dashboards/6671)
- **HTTP Metrics**: 自定义（参考下方 JSON）

### 3. 自定义 Dashboard

```json
{
  "panels": [
    {
      "title": "QPS",
      "targets": [{
        "expr": "rate(http_requests_total[1m])"
      }]
    },
    {
      "title": "P99 Latency",
      "targets": [{
        "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))"
      }]
    }
  ]
}
```

## 禁用 Metrics

在配置中设置 `MetricsEnabled=false`：

```bash
APP_MONITORING_METRICS_ENABLED=false
```

此时：
- `NewMetrics()` 返回 `nil`
- 所有 `metrics.RecordRequest()` 调用不执行任何操作
- `/metrics` 端点不会被注册

## 性能优化

1. **使用全局 Metrics**：避免重复创建 Metrics 实例
2. **限制标签基数**：避免使用高基数标签（如用户 ID）
3. **合理设置 Buckets**：根据实际延迟范围调整
4. **定期采集**：系统指标每 10 秒采集一次

## 最佳实践

1. **生产环境**：启用 Metrics，配置 Prometheus + Grafana
2. **开发环境**：可禁用 Metrics，减少开销
3. **标签命名**：使用小写字母 + 下划线（`user_id`）
4. **指标命名**：使用描述性名称 + 单位（`http_request_duration_seconds`）
5. **避免过度监控**：只采集关键指标

## 依赖

- `github.com/prometheus/client_golang` - Prometheus 客户端库

