# 日志系统使用指南

## 概述

Backend-nodejs 使用基于 Pino 的高性能结构化日志系统,支持日志轮转、压缩归档和多种输出格式。

## 功能特性

- ✅ **高性能**: 基于 Pino,比传统日志库快 5-10 倍
- ✅ **日志轮转**: 自动按大小和时间轮转日志文件
- ✅ **压缩归档**: 自动压缩旧日志文件(gzip)
- ✅ **多种格式**: 支持 JSON(生产)和 Pretty(开发)格式
- ✅ **多种输出**: stdout、stderr、file
- ✅ **结构化字段**: 支持添加上下文字段(TraceID、RequestID 等)
- ✅ **日志级别**: Debug、Info、Warn、Error、Fatal

---

## 配置

### 环境变量

在 `.env` 文件中配置日志系统:

```bash
# 日志配置
LOGGING_ENABLED=true                    # 是否启用结构化日志
LOGGING_LEVEL=info                      # 日志级别: debug, info, warn, error
LOGGING_FORMAT=json                     # 格式: json (生产) 或 pretty (开发)
LOGGING_OUTPUT=stdout                   # 输出: stdout, stderr, file

# 文件输出配置 (当 LOGGING_OUTPUT=file 时)
LOGGING_OUTPUT_PATH=./logs/app.log      # 日志文件路径
LOGGING_MAX_SIZE=100                    # 单个日志文件最大大小 (MB)
LOGGING_MAX_BACKUPS=3                   # 保留的旧日志文件数量
LOGGING_MAX_AGE=7                       # 保留旧日志文件的最大天数
LOGGING_COMPRESS=true                   # 是否压缩旧日志文件
```

### 配置说明

#### 日志级别

- `debug`: 调试信息,最详细
- `info`: 一般信息,默认级别
- `warn`: 警告信息
- `error`: 错误信息

#### 日志格式

- `json`: JSON 格式,适合生产环境和日志聚合系统
  ```json
  {"level":"INFO","time":"2024-01-01T12:00:00.000Z","msg":"Server started","port":8080}
  ```

- `pretty`: 人类可读格式,适合开发环境
  ```
  [12:00:00] INFO: Server started
      port: 8080
  ```

#### 日志轮转

日志轮转功能由 `rotating-file-stream` 提供,与 Go 后端的 Lumberjack 功能对等:

- **按大小轮转**: 当日志文件达到 `LOGGING_MAX_SIZE` (MB) 时自动轮转
- **保留数量**: 保留最近的 `LOGGING_MAX_BACKUPS` 个旧日志文件
- **按时间清理**: 删除超过 `LOGGING_MAX_AGE` 天的旧日志文件
- **自动压缩**: 如果 `LOGGING_COMPRESS=true`,旧日志文件会被压缩为 `.gz` 格式

**示例**:
```
logs/
├── app.log              # 当前日志文件
├── app-20240101.log.gz  # 压缩的旧日志
├── app-20240102.log.gz
└── app-20240103.log.gz
```

---

## 使用方法

### 基本用法

```typescript
import { getGlobalLogger } from '../../infrastructure/monitoring/logger/logger.js';

const logger = getGlobalLogger();

if (logger) {
  // Info 级别
  logger.info('User logged in', { userId: '123', email: 'user@example.com' });
  
  // Warn 级别
  logger.warn('Cache miss', { key: 'user:123' });
  
  // Error 级别
  logger.error('Database query failed', { 
    query: 'SELECT * FROM users',
    error: err.message 
  });
}
```

### 便捷函数

```typescript
import { info, warn, error } from '../../infrastructure/monitoring/logger/logger.js';

// 直接使用全局 logger
info('Server started', { port: 8080 });
warn('High memory usage', { usage: '85%' });
error('Failed to connect to Redis', { host: 'localhost', port: 6379 });
```

### 添加上下文字段

使用 `child()` 方法创建带有上下文字段的子 logger:

```typescript
const logger = getGlobalLogger();

// 创建带有 userId 的子 logger
const userLogger = logger?.child({ userId: '123' });

// 所有日志都会包含 userId
userLogger?.info('User action', { action: 'create_task' });
// 输出: {"level":"INFO","userId":"123","action":"create_task","msg":"User action"}
```

### 在 Handler 中使用

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getGlobalLogger } from '../../infrastructure/monitoring/logger/logger.js';
import { handleDomainError } from '../../infrastructure/handler_utils/helpers.js';

export async function createTaskHandler(
  request: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
) {
  const logger = getGlobalLogger();
  
  try {
    logger?.info('Creating task', { 
      title: request.body.title,
      requestId: request.id 
    });
    
    const output = await taskService.createTask(db, input);
    
    logger?.info('Task created successfully', { 
      taskId: output.task.id,
      requestId: request.id 
    });
    
    return reply.code(200).send(output);
  } catch (err) {
    // handleDomainError 会自动记录错误日志
    handleDomainError(reply, err, logger);
  }
}
```

### 错误处理集成

`handleDomainError` 函数已集成日志记录:

```typescript
import { handleDomainError } from '../../infrastructure/handler_utils/helpers.js';

try {
  // 业务逻辑
} catch (err) {
  // 自动记录错误日志,包括:
  // - 错误码和消息
  // - HTTP 状态码
  // - 请求 ID
  // - 请求路径和方法
  // - 错误堆栈 (仅 5xx 错误)
  handleDomainError(reply, err, logger);
}
```

---

## 生产环境最佳实践

### 1. 使用 JSON 格式

生产环境建议使用 JSON 格式,便于日志聚合和分析:

```bash
LOGGING_FORMAT=json
```

### 2. 文件输出 + 日志轮转

生产环境建议输出到文件,并启用日志轮转:

```bash
LOGGING_OUTPUT=file
LOGGING_OUTPUT_PATH=/var/log/app/app.log
LOGGING_MAX_SIZE=100
LOGGING_MAX_BACKUPS=7
LOGGING_MAX_AGE=30
LOGGING_COMPRESS=true
```

### 3. 合理的日志级别

- **开发环境**: `debug` 或 `info`
- **测试环境**: `info`
- **生产环境**: `info` 或 `warn`

### 4. Docker 环境配置

#### 方式 1: 输出到 stdout (推荐)

```bash
LOGGING_OUTPUT=stdout
LOGGING_FORMAT=json
```

然后使用 Docker 日志驱动收集日志:

```bash
docker run \
  --log-driver=json-file \
  --log-opt max-size=100m \
  --log-opt max-file=3 \
  your-image
```

#### 方式 2: 卷挂载

```bash
LOGGING_OUTPUT=file
LOGGING_OUTPUT_PATH=/app/logs/app.log
```

```bash
docker run \
  -v /host/logs:/app/logs \
  your-image
```

### 5. 日志聚合

#### 与 Loki 集成

使用 Promtail 收集日志并发送到 Loki:

```yaml
# promtail-config.yaml
scrape_configs:
  - job_name: backend-nodejs
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend-nodejs
          __path__: /var/log/app/*.log
```

#### 与 ELK 集成

使用 Filebeat 收集日志并发送到 Elasticsearch:

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/app/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
```

---

## 性能考虑

### 1. 异步日志

Pino 默认使用异步日志,不会阻塞主线程:

```typescript
// 日志写入是异步的,不会阻塞
logger.info('High frequency log');
```

### 2. 避免过度日志

```typescript
// ❌ 不好: 在循环中记录大量日志
for (const item of items) {
  logger.debug('Processing item', { item });
}

// ✅ 好: 批量记录
logger.debug('Processing items', { count: items.length });
```

### 3. 使用合适的日志级别

```typescript
// ❌ 不好: 使用 info 记录调试信息
logger.info('Variable value', { value });

// ✅ 好: 使用 debug 记录调试信息
logger.debug('Variable value', { value });
```

---

## 故障排查

### 日志文件未创建

**问题**: 配置了文件输出,但日志文件未创建

**解决方案**:
1. 检查日志目录权限
2. 检查 `LOGGING_OUTPUT_PATH` 配置
3. 查看控制台错误信息

```bash
# 确保日志目录存在且有写权限
mkdir -p /var/log/app
chmod 755 /var/log/app
```

### 日志文件未轮转

**问题**: 日志文件持续增长,未轮转

**解决方案**:
1. 检查 `LOGGING_MAX_SIZE` 配置
2. 确保 `rotating-file-stream` 已安装
3. 查看日志轮转错误信息

### Docker 容器中日志丢失

**问题**: 容器重启后日志丢失

**解决方案**:
使用卷挂载保存日志:

```bash
docker run -v /host/logs:/app/logs your-image
```

或使用 Docker 日志驱动:

```bash
docker run --log-driver=json-file --log-opt max-size=100m your-image
```

---

## 示例配置

### 开发环境

```bash
LOGGING_ENABLED=true
LOGGING_LEVEL=debug
LOGGING_FORMAT=pretty
LOGGING_OUTPUT=stdout
```

### 生产环境 (文件输出)

```bash
LOGGING_ENABLED=true
LOGGING_LEVEL=info
LOGGING_FORMAT=json
LOGGING_OUTPUT=file
LOGGING_OUTPUT_PATH=/var/log/app/app.log
LOGGING_MAX_SIZE=100
LOGGING_MAX_BACKUPS=7
LOGGING_MAX_AGE=30
LOGGING_COMPRESS=true
```

### 生产环境 (stdout + Docker 日志驱动)

```bash
LOGGING_ENABLED=true
LOGGING_LEVEL=info
LOGGING_FORMAT=json
LOGGING_OUTPUT=stdout
```

---

## 参考资料

- [Pino 官方文档](https://getpino.io/)
- [rotating-file-stream 文档](https://github.com/iccicci/rotating-file-stream)
- [Go 后端 Logger 文档](../../backend/infrastructure/monitoring/logger/README.md)
