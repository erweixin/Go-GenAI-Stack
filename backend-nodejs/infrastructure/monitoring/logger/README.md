# Logger - 结构化日志模块

基于 `pino` 的高性能结构化日志库，支持日志轮转、多输出、压缩归档。

## 功能特性

- ✅ **高性能**：基于 pino，零内存分配
- ✅ **结构化**：JSON 和 Pretty 两种格式
- ✅ **日志轮转**：支持按大小、时间轮转（需要配合外部工具或 pino-rotate）
- ✅ **多输出**：支持 stdout、stderr、file
- ✅ **上下文字段**：支持 TraceID、RequestID 注入
- ✅ **开关控制**：可通过配置禁用（降级为标准 console）

## 快速开始

### 1. 配置日志

在 `.env` 文件中配置：

```bash
# 日志配置
LOGGING_ENABLED=true
LOGGING_LEVEL=info
LOGGING_FORMAT=json
LOGGING_OUTPUT=stdout
LOGGING_OUTPUT_PATH=./logs/app.log
LOGGING_MAX_SIZE=100
LOGGING_MAX_BACKUPS=3
LOGGING_MAX_AGE=7
LOGGING_COMPRESS=true
```

### 2. 初始化全局 Logger

```typescript
import { initGlobalLogger } from './infrastructure/monitoring/logger/logger.js';
import { loadConfig } from './infrastructure/config/config.js';

const config = loadConfig();
initGlobalLogger(config.logging);
```

### 3. 使用全局 Logger

```typescript
import { info, error, debug, warn } from './infrastructure/monitoring/logger/logger.js';

// 基本用法
info('Server started', { port: 8080 });
error('Failed to connect', { error: err });

// 带上下文字段
const logger = getGlobalLogger();
if (logger) {
  const requestLogger = logger.child({ traceId: 'abc123', requestId: 'def456' });
  requestLogger.info('Processing request');
  requestLogger.error('Request failed', { error: err });
}
```

## 日志级别

支持 4 个日志级别：

```typescript
debug('Debug message', { data });
info('Info message', { status: 'ok' });
warn('Warning message', { code: 400 });
error('Error message', { error: err });
```

## 日志格式

### JSON 格式（推荐生产环境）

```json
{
  "level": "INFO",
  "time": "2025-01-24T12:00:00.000Z",
  "msg": "Server started",
  "port": 8080,
  "traceId": "abc123"
}
```

### Pretty 格式（推荐开发环境）

```
[12:00:00.000] INFO: Server started
    port: 8080
    traceId: "abc123"
```

## 日志轮转

当 `output=file` 时，可以配置日志轮转：

- **MaxSize**: 单个日志文件最大大小（MB）
- **MaxBackups**: 保留的旧日志文件数量
- **MaxAge**: 保留旧日志文件的最大天数
- **Compress**: 是否压缩旧日志（.gz）

**注意**：`pino/file` 本身不直接支持轮转，需要：

1. 使用外部工具（如 `logrotate`）
2. 或安装 `pino-rotate` 包（需要额外配置）

## 多输出示例

```typescript
// 可以创建多个 Logger 实例，输出到不同目标
const fileLogger = createLogger({ ...config, output: 'file', outputPath: './logs/app.log' });
const consoleLogger = createLogger({ ...config, output: 'stdout' });
```

## 性能优化

### 使用结构化字段（推荐）

```typescript
// ✅ Good: 零内存分配
info('User login', { userId: '123' });

// ❌ Bad: 字符串拼接（性能略低）
info(`User ${userId} login`);
```

## 禁用日志

在配置中设置 `enabled=false`：

```bash
LOGGING_ENABLED=false
```

此时 `info()` 等函数不会输出任何内容，应用回退到标准 `console`。

## 与 Fastify 集成

Fastify 已内置 Pino logger，可以通过配置使用：

```typescript
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
});
```

## 最佳实践

1. **生产环境**：使用 JSON 格式 + File 输出 + 日志轮转
2. **开发环境**：使用 Pretty 格式 + Stdout 输出
3. **性能关键路径**：使用结构化字段，避免格式化字符串
4. **上下文传递**：使用 `child()` 创建带上下文的 Logger
5. **应用退出**：调用 `flush()` 刷新缓冲区

## 依赖

- `pino` - 高性能日志库
- `pino-pretty` - 开发环境格式化（已有）
- `pino/file` - 文件输出（pino 内置）

## 参考

- [Pino 官方文档](https://getpino.io/)
- [Go 后端 Logger 实现](../backend/infrastructure/monitoring/logger/logger.go)
