# 最简 Demo 使用指南

这是一个最简的可运行 demo，展示了如何启动 Node.js 后端服务器。

## 快速开始

### 1. 安装依赖

```bash
cd backend-nodejs
pnpm install
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp env.example .env

# 编辑 .env 文件，确保数据库配置正确
# 数据库配置必须与 Go 后端一致（共享同一数据库）
```

### 3. 确保数据库已启动

```bash
# 从项目根目录
cd ../docker
docker-compose up -d postgres redis

# 确保数据库 Schema 已应用（参考 Go 后端的数据库设置）
```

### 4. 启动服务器

```bash
cd backend-nodejs
pnpm dev
```

服务器将在 `http://localhost:8081` 启动。

## 测试端点

### 健康检查

```bash
curl http://localhost:8081/health
```

**预期响应**：

```json
{
  "status": "healthy",
  "service": "go-genai-stack-nodejs",
  "version": "0.1.0",
  "checks": {
    "database": true,
    "redis": true
  },
  "timestamp": "2025-01-XX..."
}
```

### 根路径

```bash
curl http://localhost:8081/
```

**预期响应**：

```json
{
  "service": "go-genai-stack-nodejs",
  "version": "0.1.0",
  "status": "running"
}
```

## 项目结构

```
backend-nodejs/
├── cmd/server/main.ts              # 应用入口
├── infrastructure/
│   ├── config/config.ts            # 配置管理
│   ├── persistence/
│   │   └── postgres/
│   │       ├── database.ts         # 数据库类型定义
│   │       └── connection.ts       # Kysely 连接
│   ├── bootstrap/
│   │   └── server.ts               # Fastify 服务器初始化
│   └── monitoring/
│       └── health/
│           └── health.ts           # 健康检查
└── package.json
```

## 核心功能

1. **配置管理**：从环境变量读取配置
2. **数据库连接**：使用 Kysely 连接 PostgreSQL
3. **健康检查**：检查数据库和 Redis 状态
4. **优雅关闭**：支持 SIGINT/SIGTERM 信号

## 下一步

- 添加业务领域（参考 Go 后端的 `domains/task`）
- 实现具体的 API 端点
- 添加认证中间件
- 集成 LangChain.js（可选）

## 故障排查

### 数据库连接失败

```
❌ Failed to connect to database: ...
```

**解决方案**：

1. 确保 PostgreSQL 正在运行：`docker-compose ps`
2. 检查环境变量配置是否正确
3. 确保数据库 Schema 已应用（参考 Go 后端的数据库设置）

### 端口被占用

```
Error: listen EADDRINUSE: address already in use :::8081
```

**解决方案**：

1. 修改 `.env` 文件中的 `PORT` 变量
2. 或关闭占用 8081 端口的其他服务
