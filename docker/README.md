# Docker 开发环境

本目录包含 Go-GenAI-Stack 项目的所有 Docker 环境配置。

## 🎯 环境概览

本项目提供多个独立的 Docker 环境，适用于不同的开发和测试场景：

| 环境 | 目录 | 用途 | 数据库 | 后端 | 端口 | 启动方式 |
|------|------|------|--------|------|------|---------|
| **frontend-debug** | `frontend-debug/` | 前端开发 (Full Stack) | ✅ | ✅ | 5434, 8082 | `cd frontend-debug && ./start.sh` |
| **backend-debug** | `backend-debug/` | 后端开发 (仅基础设施) | ✅ | ❌ | 5435 | `cd backend-debug && ./start.sh` |
| **e2e** | `e2e/` | E2E 测试 | ✅ | ✅ | 5433, 8081 | `cd e2e && ./start.sh` |
| **prod** | `prod/` | 生产环境 | ✅ | ✅ | 5432, 8080 | `cd prod && ./start.sh` |
| **monitoring** | `monitoring/` | 可观测性栈 (Jaeger/Prometheus/Grafana) | ❌ | ❌ | 3000, 9090, 16686 | `cd monitoring && ./start.sh` |

## 📁 目录结构

```
docker/
├── schema/                         # Schema 说明文档
│   └── README.md                   #   所有环境共享 backend/database/schema.sql
│
├── frontend-debug/                 # 前端调试环境 (包含后端服务)
│   ├── docker-compose.yml          #   数据库 + 后端服务
│   ├── seed-data.sql               #   测试数据
│   ├── start.sh                    #   启动脚本
│   ├── stop.sh                     #   停止脚本
│   └── README.md
│
├── backend-debug/                  # 后端调试环境 (仅数据库)
│   ├── docker-compose.yml          #   仅数据库 (PostgreSQL + Redis)
│   ├── seed-data.sql               #   测试数据
│   ├── start.sh
│   ├── stop.sh
│   └── README.md
│
├── e2e/                            # E2E 测试环境
│   ├── docker-compose.yml
│   ├── seed-data.sql
│   ├── start.sh
│   ├── stop.sh
│   └── README.md
│
├── prod/                           # 生产环境
│   ├── docker-compose.yml
│   ├── env.example
│   ├── start.sh
│   ├── stop.sh
│   └── validate-config.sh
│   └── README.md
│
└── monitoring/                     # 可观测性服务
    ├── docker-compose.yml
    ├── grafana-dashboards/
    ├── prometheus.yml
    ├── start.sh
    └── stop.sh
```

## 🚀 快速开始

### 1. 前端开发环境 (Frontend Debug)

适用于前端开发，包含完整的后端服务和数据库。

```bash
cd docker/frontend-debug
./start.sh
```
- 后端 API: `http://localhost:8082`
- 数据库端口: `5434`

### 2. 后端开发环境 (Backend Debug)

适用于后端开发，仅启动数据库（PostgreSQL + Redis），后端服务在本地运行（`go run`）。

```bash
# 1. 启动基础设施
cd docker/backend-debug
./start.sh

# 2. 在项目根目录运行后端
# export DB_PORT=5435
# go run cmd/server/main.go
```
- 数据库端口: `5435`

### 3. 可观测性服务 (Monitoring)

启动 Jaeger, Prometheus, Grafana 进行监控。

```bash
cd docker/monitoring
./start.sh
```
- Grafana: `http://localhost:3000` (admin/admin)
- Prometheus: `http://localhost:9090`
- Jaeger: `http://localhost:16686`

### 4. 生产环境 (Prod)

模拟生产环境运行。

```bash
cd docker/prod
cp env.example .env  # 配置环境变量
./start.sh
```

## 🔧 常用命令

### 停止服务

进入对应目录执行 `./stop.sh`：

```bash
cd docker/frontend-debug && ./stop.sh
# 或者
cd docker/backend-debug && ./stop.sh
```

### 查看日志

使用 `docker compose` 查看日志：

```bash
cd docker/frontend-debug
docker compose logs -f backend
```

## 🔧 服务说明

### PostgreSQL
各环境使用独立的端口以避免冲突：
- Prod: `5432`
- E2E: `5433`
- Frontend Debug: `5434`
- Backend Debug: `5435`

### 数据库初始化
所有环境启动时都会自动应用 `backend/database/schema.sql` 和对应的 seed data。

### 监控 (Monitoring)
监控组件配置在 `docker/monitoring` 目录下，包含：
- **Jaeger**: 分布式追踪
- **Prometheus**: 指标收集
- **Grafana**: 预配置了 Go Processes 和 HTTP Metrics 仪表盘

## 🤝 贡献
如果发现配置问题，请提交 Issue 或 PR。
