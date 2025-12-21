# Node.js 后端调试环境

为 Node.js 后端开发提供独立的数据库和 Redis 环境。

## 🎯 用途

- Node.js 后端开发调试
- 独立的数据库和 Redis 环境（不影响其他环境）
- 自动初始化 Schema 和测试数据

## 🚀 快速开始

### 启动环境

```bash
cd docker/backend-nodejs-debug
./start.sh
```

### 停止环境

```bash
./stop.sh
```

## 📋 服务信息

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5436 | 开发数据库 |
| Redis | 6380 | 开发缓存 |

## 🔧 配置

### 数据库配置

- **Host**: `localhost`
- **Port**: `5436`
- **Database**: `go_genai_stack`
- **User**: `genai`
- **Password**: `genai_password`

### Redis 配置

- **Host**: `localhost`
- **Port**: `6380`
- **Password**: 无
- **DB**: `0`

## 📝 在 Node.js 后端中使用

更新 `backend-nodejs/.env` 文件：

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5436
DATABASE_USER=genai
DATABASE_PASSWORD=genai_password
DATABASE_NAME=go_genai_stack
DATABASE_SSL_MODE=disable

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_DB=0
```

## 🧪 测试数据

环境启动时会自动加载测试数据：

- **测试用户**: `nodejs-debug@example.com` / `Nodejs123456!`
- **测试任务**: 3 个示例任务

## 📊 健康检查

```bash
# 检查服务状态
docker compose ps

# 检查数据库
docker exec go-genai-stack-postgres-backend-nodejs-debug psql -U genai -d go_genai_stack -c "SELECT COUNT(*) FROM users;"

# 检查 Redis
docker exec go-genai-stack-redis-backend-nodejs-debug redis-cli ping
```

## 🗑️ 清理数据

```bash
# 停止并删除数据卷（⚠️ 会删除所有数据）
docker compose down -v
```

## 📚 相关文档

- [Docker 环境总览](../README.md)
- [Node.js 后端 README](../../backend-nodejs/README.md)

