# Go-GenAI-Stack

> 🚀 一个采用 **Vibe-Coding-Friendly DDD** 架构的全栈 Starter 项目
>
> **特点**：显式知识 + 声明式用例 + AI 友好 + Monorepo

> 🎯 **项目定位**：这是一个全栈 Starter 项目，内置 **Task 领域** 作为完整示例。
> 你可以直接使用 Task 功能，或将其作为模板创建自己的业务领域。

---

## 📁 项目结构

```
Go-GenAI-Stack/
├── backend/              # 后端（Go + Hertz + DDD）
│   ├── cmd/              # 程序入口
│   │   └── server/       # HTTP Server 入口
│   ├── domains/          # 领域层（Domain-First）
│   │   ├── task/         # Task 领域（示例实现）★
│   │   │   ├── handlers/ # HTTP 适配层
│   │   │   ├── service/  # 业务逻辑层
│   │   │   ├── model/    # 领域模型
│   │   │   └── ...       # 其他组件
│   │   └── shared/       # 共享组件
│   ├── infrastructure/   # 基础设施层
│   │   ├── bootstrap/    # 启动引导
│   │   ├── persistence/  # 持久化（Postgres, Redis）
│   │   ├── middleware/   # 中间件
│   │   ├── config/       # 配置管理
│   │   └── database/     # 数据库 Schema
│   ├── pkg/              # 可复用工具包
│   │   └── validator/    # 验证器
│   ├── migrations/       # 数据库迁移
│   │   ├── atlas/        # Atlas 迁移文件 & 配置
│   │   └── seed/         # 种子数据
│   ├── shared/           # 共享代码
│   │   └── errors/       # 错误定义
│   └── scripts/          # 开发脚本
├── frontend/             # 前端 Monorepo
│   ├── web/              # React Web 应用
│   ├── mobile/           # React Native 移动应用
│   └── shared/           # 前端共享代码
│       ├── types/        # TypeScript 类型定义
│       ├── utils/        # 工具函数
│       └── constants/    # 常量
├── docs/                 # 项目文档
├── docker/               # Docker 配置
└── scripts/              # 项目级脚本
```

---

## ✨ 核心特性

### 🎯 Vibe-Coding-Friendly DDD

- **领域优先**：按业务领域垂直切分（内置 Task 领域作为示例）
- **自包含**：每个领域包含 model + handlers + service + http + repository + tests
- **显式知识**：6 个必需文件（README, glossary, rules, events, usecases.yaml, ai-metadata.json）
- **声明式用例**：在 `usecases.yaml` 中定义业务流程，AI 可直接生成代码
- **AI 友好**：结构化知识 + 语义化命名 + 完整注释
- **扩展友好**：Task 作为模板，轻松创建自己的业务领域

### 🤖 AI 友好设计

- **声明式用例**：`usecases.yaml` 描述业务流程，AI 可直接理解
- **显式知识**：每个领域有完整的术语表、规则、事件文档
- **扩展点标注**：代码中明确标注 "Extension point"，指导集成
- **清晰的架构**：DDD + Repository 模式，易于 AI 生成代码

### 🛠️ 开发工具链

- **pkg/ 工具包**：Validator（参数验证）
- **数据库管理**：Atlas Schema 管理（`cd backend/database && make`）
- **测试**：`./backend/scripts/test_all.sh` 运行测试
- **代码质量**：`./backend/scripts/lint.sh` 代码检查

### 📊 可观测性（Observability）

完整的生产级可观测性方案，**所有功能支持开关控制**：

- **结构化日志**：基于 uber-go/zap，支持 JSON/Console 格式、日志轮转
- **Prometheus Metrics**：QPS、延迟、错误率、系统指标，访问 `/metrics` 查看
- **OpenTelemetry Tracing**：分布式追踪，支持 Jaeger、Tempo、OTLP Collector
- **Health Check**：数据库、Redis 健康检查，访问 `/health` 查看

详细文档：[可观测性指南](backend/infrastructure/monitoring/README.md)

---

## 🚀 快速开始

### 方式 1: Docker 一键启动（推荐）✨

最简单的启动方式，一键启动完整环境（Backend + DB + Redis）：

```bash
# 1. 克隆项目
git clone https://github.com/erweixin/Go-GenAI-Stack.git
cd Go-GenAI-Stack

# 2. 一键启动所有服务
./docker/docker-up.sh

# 3. 访问服务
# - 后端 API:      http://localhost:8080/api
# - 健康检查:      http://localhost:8080/health
# - Prometheus:    http://localhost:8080/metrics
```

**特点**：
- ✅ 无需手动安装 Go、PostgreSQL、Redis
- ✅ 自动配置和健康检查
- ✅ 适合快速体验和开发

**其他选项**：
```bash
# 启动完整服务（包含 Jaeger、Prometheus、Grafana）
./docker/docker-up.sh --full

# 重新构建镜像
./docker/docker-up.sh --rebuild

# 使用 Make 命令（在 docker 目录下）
cd docker
make up          # 启动所有服务
make logs        # 查看日志
make down        # 停止服务
make help        # 查看所有命令
```

📖 详细文档：[Docker 部署指南](docs/Guides/docker-deployment.md)

---

### 方式 2: 本地开发（手动安装）

适合需要自定义配置或不使用 Docker 的场景。

#### 前置要求

- **Go 1.23+**
- **PostgreSQL 16+**
- **Redis 7+**
- **Atlas**（数据库 Schema 管理工具）

```bash
# 安装 Atlas
curl -sSf https://atlasgo.sh | sh
```

#### 启动步骤

```bash
# 1. 克隆项目
git clone https://github.com/erweixin/Go-GenAI-Stack.git
cd Go-GenAI-Stack

# 2. 启动基础设施（仅 PostgreSQL + Redis）
cd docker
docker-compose up -d --scale backend=0

# 3. 应用数据库迁移
source docker/.env
cd backend/database
make apply

# 4. 启动后端服务
go run cmd/server/main.go
```

### 3. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动 Web 应用
cd web
pnpm dev

# 启动 Mobile 应用
cd mobile
pnpm start
```

---

## 📚 开发指南

### 数据库 Schema 管理（Atlas）

详细文档请参考：[数据库管理指南](docs/Guides/database.md)

常用命令：

```bash
cd backend/database

# 生成迁移
make diff NAME=<name>

# 应用迁移
make apply

# 查看状态
make status
```

### 添加新用例

```bash
# 1. 在 usecases.yaml 中定义用例
vim backend/domains/chat/usecases.yaml

# 2. 创建 handler（手动或用 AI 生成）
vim backend/domains/chat/handlers/new_use_case.handler.go

# 3. 添加 DTO 定义
vim backend/domains/chat/http/dto/new_use_case.go

# 4. 注册路由
vim backend/domains/chat/http/router.go

# 5. 运行测试
cd backend
./scripts/test_all.sh
```

### 同步前后端类型

```bash
# 同步 chat 领域类型
./scripts/sync_types.sh chat

# 同步所有领域类型
./scripts/sync_types.sh all
```

### 提交代码前

```bash
cd backend

# 1. 格式化和检查
./scripts/lint.sh --fix

# 2. 运行测试
./scripts/test_all.sh --coverage

# 3. 提交
git add .
git commit -m "feat(chat): add new use case"
git push
```

---

## 📖 文档

### 架构和开发
- [架构设计](docs/Core/architecture-overview.md)
- [Vibe-Coding-Friendly 理念](docs/Core/vibe-coding-friendly.md)
- [快速参考](docs/Guides/quick-reference.md)
- [类型同步指南](docs/Guides/type-sync.md)

### 部署
- [Docker 部署指南](docs/Guides/docker-deployment.md)
- [Docker 环境配置](docker/README.md)

### 数据库
- [数据库管理指南](docs/Guides/database.md)
- [数据库详细指南](backend/database/README.md) ⭐ 集中的数据库文档

### 可观测性
- [可观测性总览](backend/infrastructure/monitoring/README.md)
- [结构化日志](backend/infrastructure/monitoring/logger/README.md)
- [Prometheus Metrics](backend/infrastructure/monitoring/metrics/README.md)
- [OpenTelemetry Tracing](backend/infrastructure/monitoring/tracing/README.md)

---

## 🏗️ 技术栈

### 后端
- **语言**：Go 1.21+
- **框架**：CloudWeGo Hertz (HTTP)
- **LLM**：Eino (字节跳动 LLM 框架)
- **数据库**：PostgreSQL, Redis
- **消息队列**：Asynq (Redis-based)
- **可观测性**：uber-go/zap (日志), Prometheus (指标), OpenTelemetry (追踪)
- **工具**：Atlas (Schema 管理), staticcheck (代码分析)

### 前端
- **框架**：React (Web), React Native (Mobile)
- **语言**：TypeScript
- **构建**：Vite (Web), Metro (Mobile)
- **包管理**：pnpm (Monorepo)

### DevOps
- **CI/CD**：GitHub Actions
- **容器**：Docker, Docker Compose
- **监控**：Prometheus, Grafana, Jaeger（可选）

---

## 📋 项目状态

### ✅ 已完成（v0.1 - Starter）

- ✅ 基础架构搭建（Hertz + DDD）
- ✅ **Task 领域完整实现**（示例领域）
  - 6 个必需文件齐全（README、glossary、rules、events、usecases.yaml、ai-metadata.json）
  - 完整的 CRUD 操作（创建、更新、完成、删除、查询、列表）
  - Repository 模式（使用 database/sql）
  - 完整的测试（handlers + repository）
- ✅ 基础设施层
  - 启动引导（server, database, redis, dependencies, routes）
  - 中间件（认证、CORS、错误处理、日志、限流、恢复、追踪）
  - 数据库（Postgres + Redis）
  - 配置管理（原生标准库，零第三方依赖）
  - **可观测性**（结构化日志、Prometheus Metrics、OpenTelemetry Tracing、健康检查）
- ✅ 可复用工具包（Validator）
- ✅ 数据库 Schema 管理（Atlas）
- ✅ 前端 Monorepo 设置（Web + Mobile + Shared）
- ✅ 类型同步（Go → TypeScript）
- ✅ 开发脚本（dev.sh, schema.sh, test_all.sh, lint.sh）

### 🎯 当前范围

本 Starter 专注于 **Task 领域**，展示 Vibe-Coding-Friendly DDD 架构的最佳实践。

**Task 领域作为模板**：
- ✅ 可以直接使用（如果你需要任务管理功能）
- ✅ 可以作为参考（学习如何实现一个完整的领域）
- ✅ 可以映射到你的业务（Product、Order、Article、Customer 等）

所有扩展点都已明确标注，方便根据实际需求集成。

### 🔌 扩展点

代码中所有标注 `Extension point` 的地方都是预留的扩展位置：

- **跨领域编排**：当你有多个领域时，添加 Application 层
- **真实 LLM 集成**：集成 OpenAI、Claude 等（如果你的业务需要）
- **事件总线**：从内存切换到 Redis/Kafka
- **JWT 认证**：完整的 Token 验证和刷新
- ~~**OpenTelemetry 追踪**：分布式追踪~~ ✅ **已完成**
- ~~**监控和告警**：Prometheus + Grafana~~ ✅ **已完成**

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat(domain): add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat(domain): 新功能`
- `fix(domain): Bug 修复`
- `docs: 文档更新`
- `refactor(domain): 重构`
- `test(domain): 测试`
- `chore: 构建/工具链`

---

## 📊 项目指标

- **测试覆盖率目标**：≥ 60%
- **代码质量**：go vet + staticcheck 全部通过
- **结构完整性**：所有领域 6 个必需文件完整
- **AI 友好性**：usecases.yaml 覆盖率 ≥ 90%

---

## 📄 许可证

[MIT License](LICENSE)

---

## 👥 团队

- Backend Team
- Frontend Team
- DevOps Team

---

## 🔗 相关链接

- [CloudWeGo Hertz](https://www.cloudwego.io/zh/docs/hertz/)
- [Eino Framework](https://github.com/cloudwego/eino)
- [Go Playground Validator](https://github.com/go-playground/validator)
- [golang-migrate](https://github.com/golang-migrate/migrate)

---

**最后更新**：2025-11-22  
**版本**：v0.1.0  
**状态**：🚀 Active Development
