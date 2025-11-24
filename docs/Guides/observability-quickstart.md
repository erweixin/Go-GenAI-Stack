# 可观测性快速启动指南

本指南帮助你快速启用 Go-GenAI-Stack 的可观测性功能。

## 📊 功能概览

- ✅ **结构化日志**：基于 uber-go/zap，支持 JSON/Console 格式
- ✅ **Prometheus Metrics**：QPS、延迟、错误率、系统指标
- ✅ **OpenTelemetry Tracing**：分布式追踪（Jaeger/Tempo）
- ✅ **Health Check**：数据库、Redis 健康检查

**重要**：所有功能都支持开关控制，符合 Starter 的定位。

## 🚀 场景 1：开发环境（推荐配置）

### 配置

在 `docker/.env` 中设置：

```bash
# 日志：Console 格式，便于阅读
APP_LOGGING_ENABLED=true
APP_LOGGING_LEVEL=debug
APP_LOGGING_FORMAT=console
APP_LOGGING_OUTPUT=stdout

# Metrics：启用
APP_MONITORING_METRICS_ENABLED=true

# Tracing：禁用（避免依赖外部服务）
APP_MONITORING_TRACING_ENABLED=false

# Health：启用
APP_MONITORING_HEALTH_ENABLED=true
```

### 启动

```bash
cd backend
go run cmd/server/main.go
```

### 访问

- **API**: http://localhost:8080/api/tasks
- **Metrics**: http://localhost:8080/metrics
- **Health**: http://localhost:8080/health

### 查看日志

控制台输出彩色日志：

```
2025-11-24T12:00:00.000Z  INFO  HTTP Request  {"method": "GET", "path": "/api/tasks", "status": 200}
```

## 🏭 场景 2：生产环境（完整可观测性）

### 1. 启动监控栈

```bash
cd docker
docker-compose up -d
```

这会启动：
- PostgreSQL（数据库）
- Redis（缓存）
- Jaeger（分布式追踪）
- Prometheus（指标收集）
- Grafana（可视化）

### 2. 配置应用

在 `docker/.env` 中设置：

```bash
# 日志：JSON 格式，输出到文件
APP_LOGGING_ENABLED=true
APP_LOGGING_LEVEL=info
APP_LOGGING_FORMAT=json
APP_LOGGING_OUTPUT=file
APP_LOGGING_OUTPUT_PATH=/var/log/go-genai-stack/app.log

# Metrics：启用
APP_MONITORING_METRICS_ENABLED=true

# Tracing：启用，10% 采样
APP_MONITORING_TRACING_ENABLED=true
APP_MONITORING_TRACING_TYPE=otlp
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
APP_MONITORING_SAMPLE_RATE=0.1

# Health：启用
APP_MONITORING_HEALTH_ENABLED=true
```

### 3. 启动应用

```bash
cd backend
go run cmd/server/main.go
```

### 4. 访问监控工具

| 工具 | 地址 | 用途 |
|------|------|------|
| **Jaeger UI** | http://localhost:16686 | 查看分布式追踪 |
| **Prometheus** | http://localhost:9090 | 查询指标 |
| **Grafana** | http://localhost:3000 | 可视化 Dashboard |
| **Metrics 端点** | http://localhost:8080/metrics | Prometheus 抓取 |
| **Health 端点** | http://localhost:8080/health | 健康检查 |

## 📈 场景 3：只启用 Metrics（最小化）

### 配置

```bash
# 禁用结构化日志（使用标准 log）
APP_LOGGING_ENABLED=false

# 启用 Metrics
APP_MONITORING_METRICS_ENABLED=true

# 禁用 Tracing
APP_MONITORING_TRACING_ENABLED=false

# 启用 Health
APP_MONITORING_HEALTH_ENABLED=true
```

### 访问

- **Metrics**: http://localhost:8080/metrics
- **Health**: http://localhost:8080/health

## 🔍 使用示例

### 1. 查看 Metrics

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
http_request_duration_seconds_sum{method="GET",path="/api/tasks"} 15.6
```

### 2. 查看 Health

```bash
curl http://localhost:8080/health
```

输出示例：

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

### 3. 在 Jaeger 中查看 Trace

1. 访问 http://localhost:16686
2. 选择 Service: `go-genai-stack`
3. 点击 "Find Traces"
4. 查看请求链路

### 4. 在 Prometheus 中查询

访问 http://localhost:9090，执行 PromQL 查询：

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

## 🎨 配置 Grafana Dashboard

### 1. 添加 Prometheus 数据源

1. 访问 http://localhost:3000 (admin/admin)
2. Configuration → Data Sources → Add data source
3. 选择 Prometheus
4. URL: `http://prometheus:9090`
5. Save & Test

### 2. 导入 Dashboard

推荐 Dashboard：

- **Go Processes**: ID 6671
- **HTTP Metrics**: 自定义（参考 monitoring/README.md）

## 🐛 故障排查

### 问题 1：日志不输出

**检查**：
```bash
# 确认日志已启用
echo $APP_LOGGING_ENABLED  # 应该是 true
```

**解决**：
```bash
APP_LOGGING_ENABLED=true
APP_LOGGING_LEVEL=debug
```

### 问题 2：Metrics 端点不可访问

**检查**：
```bash
curl http://localhost:8080/metrics
```

**解决**：
```bash
APP_MONITORING_METRICS_ENABLED=true
```

### 问题 3：Tracing 不工作

**检查**：
```bash
# Jaeger 是否启动
docker ps | grep jaeger

# 配置是否正确
echo $APP_MONITORING_TRACING_ENABLED  # 应该是 true
```

**解决**：
```bash
# 启动 Jaeger
docker run -d --name jaeger \
  -p 4317:4317 \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest

# 启用 Tracing
APP_MONITORING_TRACING_ENABLED=true
APP_MONITORING_TRACING_ENDPOINT=localhost:4317
```

### 问题 4：Health 显示 down

**检查**：
```bash
curl http://localhost:8080/health | jq .
```

**可能原因**：
- 数据库未启动
- Redis 未启动
- 连接配置错误

**解决**：
```bash
# 启动数据库和 Redis
docker-compose up -d postgres redis
```

## 📚 进阶阅读

- [可观测性总览](../../backend/infrastructure/monitoring/README.md)
- [结构化日志详细文档](../../backend/infrastructure/monitoring/logger/README.md)
- [Prometheus Metrics 详细文档](../../backend/infrastructure/monitoring/metrics/README.md)
- [OpenTelemetry Tracing 详细文档](../../backend/infrastructure/monitoring/tracing/README.md)

## 🎯 推荐配置总结

| 环境 | Logger | Metrics | Tracing | 说明 |
|------|--------|---------|---------|------|
| **开发** | Console + Stdout | ✅ | ❌ | 便于阅读，无外部依赖 |
| **测试** | JSON + File | ✅ | Stdout | 结构化日志，本地追踪 |
| **生产** | JSON + File | ✅ | OTLP (10%) | 完整可观测性 |
| **最小化** | ❌ | ✅ | ❌ | 只要 Metrics |

**所有功能都支持开关控制**，根据项目需求灵活启用！

