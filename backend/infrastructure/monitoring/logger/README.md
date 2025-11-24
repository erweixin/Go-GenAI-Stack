# Logger - 结构化日志模块

基于 `uber-go/zap` 的高性能结构化日志库，支持多种输出格式和日志轮转。

## 功能特性

- ✅ **高性能**：基于 zap，零内存分配
- ✅ **结构化**：JSON 和 Console 两种格式
- ✅ **日志轮转**：基于 Lumberjack，支持按大小、时间轮转
- ✅ **多输出**：支持 stdout、stderr、file
- ✅ **上下文字段**：支持 TraceID、RequestID 注入
- ✅ **开关控制**：可通过配置禁用（降级为标准 log）

## 快速开始

### 1. 配置日志

在 `.env` 文件中配置：

```bash
# 日志配置
APP_LOGGING_ENABLED=true
APP_LOGGING_LEVEL=info
APP_LOGGING_FORMAT=json
APP_LOGGING_OUTPUT=stdout
APP_LOGGING_OUTPUT_PATH=./logs/app.log
APP_LOGGING_MAX_SIZE=100
APP_LOGGING_MAX_BACKUPS=3
APP_LOGGING_MAX_AGE=7
APP_LOGGING_COMPRESS=true
```

### 2. 初始化全局 Logger

```go
import "github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/logger"

// 在应用启动时初始化
err := logger.InitGlobalLogger(cfg.Logging)
if err != nil {
    log.Fatalf("初始化日志失败: %v", err)
}
defer logger.Sync() // 刷新缓冲区
```

### 3. 使用全局 Logger

```go
import (
    "github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/logger"
    "go.uber.org/zap"
)

// 基本用法
logger.Info("Server started", zap.Int("port", 8080))
logger.Error("Failed to connect", zap.Error(err))

// 格式化日志（使用 Sugar Logger）
logger := logger.GetGlobalLogger()
logger.Infof("User %s logged in", userID)
logger.Errorf("Failed to save: %v", err)
```

### 4. 使用带上下文的 Logger

```go
// 创建带上下文字段的 Logger
requestLogger := logger.GetGlobalLogger().With(
    zap.String("trace_id", traceID),
    zap.String("request_id", requestID),
)

// 所有日志都会包含这些字段
requestLogger.Info("Processing request")
requestLogger.Error("Request failed", zap.Error(err))
```

## 日志级别

支持 4 个日志级别：

```go
logger.Debug("Debug message", zap.Any("data", data))
logger.Info("Info message", zap.String("status", "ok"))
logger.Warn("Warning message", zap.Int("code", 400))
logger.Error("Error message", zap.Error(err))
```

## 日志格式

### JSON 格式（推荐生产环境）

```json
{
  "level": "INFO",
  "ts": "2025-11-24T12:00:00.000Z",
  "caller": "server/main.go:42",
  "msg": "Server started",
  "port": 8080,
  "trace_id": "abc123"
}
```

### Console 格式（推荐开发环境）

```
2025-11-24T12:00:00.000Z  INFO  server/main.go:42  Server started  {"port": 8080, "trace_id": "abc123"}
```

## 日志轮转

当 `Output=file` 时，自动启用日志轮转：

- **MaxSize**: 单个日志文件最大大小（MB）
- **MaxBackups**: 保留的旧日志文件数量
- **MaxAge**: 保留旧日志文件的最大天数
- **Compress**: 是否压缩旧日志（.gz）

示例：
```
logs/
  app.log           # 当前日志
  app-2025-11-23.log # 昨天的日志
  app-2025-11-22.log.gz # 压缩的日志
```

## 多输出示例

```go
import (
    "os"
    "github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/logger"
)

// 同时输出到 stdout 和 file
logger, err := logger.NewMultiOutputLogger(
    cfg.Logging,
    os.Stdout,
    fileWriter,
)
```

## 性能优化

### 使用结构化字段（推荐）

```go
// ✅ Good: 零内存分配
logger.Info("User login", zap.String("user_id", userID))

// ❌ Bad: 字符串拼接
logger.Infof("User %s login", userID)
```

### 使用 Sugar Logger（便捷但略慢）

```go
sugar := logger.GetGlobalLogger().GetSugar()
sugar.Infof("User %s login", userID) // 可以，但性能略低
```

## 禁用日志

在配置中设置 `Enabled=false`，自动降级为标准 log：

```bash
APP_LOGGING_ENABLED=false
```

此时 `logger.Info()` 不会输出任何内容，应用回退到 Go 标准 `log` 包。

## 与 Middleware 集成

参见 `infrastructure/middleware/logger.go` 的实现。

## 最佳实践

1. **生产环境**：使用 JSON 格式 + File 输出 + 日志轮转
2. **开发环境**：使用 Console 格式 + Stdout 输出
3. **性能关键路径**：使用结构化字段，避免格式化字符串
4. **上下文传递**：使用 `With()` 创建带上下文的 Logger
5. **应用退出**：调用 `Sync()` 刷新缓冲区

## 依赖

- `go.uber.org/zap` - 高性能日志库
- `gopkg.in/natefinch/lumberjack.v2` - 日志轮转

