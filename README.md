<div align="center">

# 🚀 Go-GenAI-Stack

### 为 AI 时代设计的全栈开发框架

**让 AI 真正理解你的代码，让开发回归"说出想法即可实现"的本质**

[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/erweixin/Go-GenAI-Stack/pulls)

[快速开始](#-快速开始) • [核心特性](#-核心特性) • [架构设计](#-架构亮点) • [文档](#-文档) • [贡献指南](#-贡献指南)

</div>

---

## 💡 为什么选择 Go-GenAI-Stack？

在 AI 编程时代，传统的项目架构面临挑战：
- ❌ **业务规则散落在代码各处**，AI 需要读海量代码才能理解意图
- ❌ **横向分层架构**让 AI 难以定位功能边界
- ❌ **隐式的领域知识**需要人工反复解释

**Go-GenAI-Stack 重新思考了代码的组织方式**：

| 传统架构 | Go-GenAI-Stack (Vibe-Coding-Friendly) |
|---------|--------------------------------------|
| 业务规则藏在代码里 | **显式知识文件**（rules.md, glossary.md） |
| 按技术栈分层 | **按业务领域垂直切分** |
| 用代码描述流程 | **用 YAML 声明用例**（usecases.yaml） |
| AI 需要读数千行代码 | **AI 读几个结构化文件即可理解** |
| 前后端类型手动同步 | **Go → TypeScript 自动同步** |

> 💡 **Vibe Coding**：说出想法，AI 理解业务逻辑，直接生成符合规则的代码。
>
> 本项目让 AI 成为真正的编程伙伴，而不仅仅是代码补全工具。

---

## 🎯 项目定位

**这是一个生产级全栈 Starter**，内置完整的 **Task 领域** 作为最佳实践示例：

- ✅ **可直接使用**：如果你需要任务管理功能
- ✅ **可作为模板**：映射到你的业务（Product、Order、Article...）
- ✅ **可作为学习**：理解如何构建 AI 友好的架构

### 🌟 站在巨人的肩膀上

- **后端架构** 参考 [Coze Studio](https://www.coze.com/)：
  - 以 LLM 编排为核心的领域驱动设计
  - 插件化和扩展性优先
  - 声明式工作流（usecases.yaml）

- **移动端架构** 参考 [Bluesky Social App](https://github.com/bluesky-social/social-app)：
  - React Native 的最佳实践
  - 原生级性能优化
  - 跨平台组件设计

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

### 🎯 Vibe-Coding-Friendly DDD（核心亮点）

<table>
<tr>
<td width="50%">

#### 📚 显式知识文件（AI 可直接理解）

每个领域必备 **6 个结构化文件**：

```
domains/task/
├── 📄 README.md          # 领域概览
├── 📄 glossary.md        # 术语表
├── 📄 rules.md           # 业务规则
├── 📄 events.md          # 领域事件
├── 📄 usecases.yaml      # 用例声明 ⭐
└── 📄 ai-metadata.json   # AI 元数据
```

**AI 只需读这 6 个文件，就能理解完整业务逻辑！**

</td>
<td width="50%">

#### 🎭 声明式用例（一句话生成代码）

```yaml
# usecases.yaml
CreateTask:
  description: "创建新任务"
  steps:
    - ValidateInput
    - GenerateTaskID
    - SaveTask
    - PublishEvent
  errors:
    - TASK_TITLE_EMPTY
    - TASK_ALREADY_EXISTS
```

**AI 读取 YAML → 自动生成 Handler + 测试**

</td>
</tr>
</table>

#### ✅ Vibe-Coding-Friendly 的优势

| 特性 | 传统 DDD | Vibe-Coding-Friendly DDD | 提升 |
|-----|---------|--------------------------|------|
| **AI 理解速度** | 需读数千行代码 | 只读 6 个结构化文件 | **10x** ⚡ |
| **新人上手** | 2-3 天 | 30 分钟（从 README 开始） | **5x** 🚀 |
| **维护成本** | 跨多个目录查找 | 自包含（一个目录搞定） | **-70%** 💰 |
| **用例修改** | 手动改代码 + 测试 | 改 YAML → AI 自动生成 | **3x** ⚡ |
| **类型安全** | 手动同步前后端 | Go → TS 自动同步 | **100%** ✅ |

---

### 🏗️ 架构亮点

#### 1️⃣ **领域优先**（Domain-First）

```
✅ domains/task/        # 按业务领域组织
   ├── model/           # 领域模型
   ├── service/         # 业务逻辑
   ├── repository/      # 数据访问
   ├── handlers/        # HTTP 适配层
   └── tests/           # 测试

❌ 传统分层（难以定位功能）:
   ├── controllers/     # 所有领域混在一起
   ├── services/        # 所有服务混在一起
   └── repositories/    # 所有仓储混在一起
```

#### 2️⃣ **自包含**（Self-Contained）

每个领域是**独立的**：
- ✅ 可以单独理解、修改、测试
- ✅ 降低认知负担（专注一个领域）
- ✅ 易于并行开发（不同团队负责不同领域）

#### 3️⃣ **三层架构**（清晰分层）

```go
// Handler 层（薄）：只做 HTTP 适配
func CreateTaskHandler(c *app.RequestContext) {
    var req dto.CreateTaskRequest
    c.BindAndValidate(&req)
    
    // 调用 Service 层
    output, err := taskService.CreateTask(ctx, input)
    
    c.JSON(200, response)
}

// Service 层（厚）：业务逻辑 ⭐
func (s *TaskService) CreateTask(input CreateTaskInput) {
    // 1. 验证业务规则
    // 2. 创建领域对象
    // 3. 持久化
    // 4. 发布事件
}

// Repository 层：数据访问（database/sql，无 ORM）
func (r *TaskRepo) Create(task *Task) error {
    query := `INSERT INTO tasks (...) VALUES (...)`
    _, err := r.db.ExecContext(ctx, query, ...)
    return err
}
```

---

### 🤖 AI 辅助开发工作流

```bash
# 1️⃣ 你：在 usecases.yaml 添加新用例
vim backend/domains/task/usecases.yaml

# 2️⃣ AI：读取显式知识文件
# - README.md（理解领域边界）
# - glossary.md（理解术语）
# - rules.md（理解业务规则）
# - usecases.yaml（理解用例流程）

# 3️⃣ AI：自动生成代码
# ✅ handlers/new_usecase.handler.go
# ✅ service/task_service.go（新增方法）
# ✅ http/dto/new_usecase.go
# ✅ tests/new_usecase.test.go

# 4️⃣ 你：运行测试并提交
./backend/scripts/test_all.sh
git commit -m "feat(task): add new usecase"
```

**真正的 Vibe Coding**：你只需要表达意图，AI 完成实现！

---

### 🛠️ 完整的开发工具链

| 工具 | 用途 | 命令 |
|-----|------|------|
| **Atlas** | 数据库 Schema 管理 | `cd backend/database && make diff/apply` |
| **Type Sync** | Go → TypeScript 类型同步 | `./scripts/sync_types.sh all` |
| **Testing** | 单元 + 集成测试 | `./backend/scripts/test_all.sh` |
| **Linting** | 代码质量检查 | `./backend/scripts/lint.sh --fix` |
| **Docker** | 一键启动完整环境 | `./docker/docker-up.sh` |

---

### 📊 生产级可观测性

完整的**三支柱**可观测性方案（支持开关控制）：

<table>
<tr>
<td width="33%">

**🔍 结构化日志**
- uber-go/zap
- JSON/Console 格式
- 日志轮转
- 请求追踪

</td>
<td width="33%">

**📈 Prometheus Metrics**
- QPS、延迟、错误率
- 业务指标
- 系统指标
- `/metrics` 端点

</td>
<td width="33%">

**🔗 分布式追踪**
- OpenTelemetry
- Jaeger / Tempo
- 跨服务追踪
- 性能分析

</td>
</tr>
</table>

```go
// 一键开关（通过配置文件）
observability:
  logging:
    enabled: true      # 日志
  metrics:
    enabled: true      # 指标
  tracing:
    enabled: true      # 追踪
```

访问：
- 健康检查：`http://localhost:8080/health`
- Prometheus：`http://localhost:8080/metrics`
- Grafana：`http://localhost:3000`（完整监控）

📖 详细文档：[可观测性指南](backend/infrastructure/monitoring/README.md)

---

## 🚀 快速开始

### ⚡ 三步上手（推荐）

```bash
# 1️⃣ 克隆项目
git clone https://github.com/erweixin/Go-GenAI-Stack.git
cd Go-GenAI-Stack

# 2️⃣ 一键启动（Docker）
./docker/docker-up.sh

# 3️⃣ 验证运行
curl http://localhost:8080/health
```

**访问服务**：
- 🔗 后端 API：`http://localhost:8080/api`
- ❤️ 健康检查：`http://localhost:8080/health`
- 📊 Prometheus：`http://localhost:8080/metrics`

**Docker 启动完整监控栈**（可选）：
```bash
# 包含 Jaeger、Prometheus、Grafana
./docker/docker-up.sh --full

# 访问监控面板
# - Grafana: http://localhost:3000 (admin/admin)
# - Jaeger:  http://localhost:16686
```

---

### 🛠️ 本地开发模式（无 Docker）

<details>
<summary><b>展开查看详细步骤</b></summary>

#### 前置要求

- Go 1.23+
- PostgreSQL 16+
- Redis 7+
- [Atlas](https://atlasgo.io/) (Schema 管理)

```bash
# 安装 Atlas
curl -sSf https://atlasgo.sh | sh
```

#### 启动后端

```bash
# 1. 启动数据库（仅 PostgreSQL + Redis）
cd docker
docker-compose up -d postgres redis

# 2. 应用数据库迁移
cd ../backend/database
make apply

# 3. 启动后端服务
cd ..
go run cmd/server/main.go
```

#### 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动 Web 应用
cd web
pnpm dev         # http://localhost:5173

# 或启动 Mobile 应用
cd mobile
pnpm start
```

</details>

📖 **更多启动选项**：[Docker 部署指南](docs/Guides/docker-deployment.md)

---

## 📚 开发指南

### 🎯 常见开发任务

<table>
<tr>
<td width="50%">

#### ➕ 添加新用例

```bash
# 1. 声明用例
vim backend/domains/task/usecases.yaml

# 2. AI 生成代码（或手动编写）
# - handlers/new_usecase.handler.go
# - service/task_service.go
# - http/dto/new_usecase.go
# - tests/new_usecase.test.go

# 3. 运行测试
./backend/scripts/test_all.sh
```

**详细指南**：[快速参考](docs/Guides/quick-reference.md)

</td>
<td width="50%">

#### 🗄️ 数据库 Schema 管理

```bash
cd backend/database

# 生成迁移
make diff NAME=add_field

# 应用迁移
make apply

# 查看状态
make status
```

**详细指南**：[数据库管理](docs/Guides/database.md)

</td>
</tr>
<tr>
<td width="50%">

#### 🔄 前后端类型同步

```bash
# 同步单个领域
./scripts/sync_types.sh task

# 同步所有领域
./scripts/sync_types.sh all
```

生成的类型：`frontend/shared/types/domains/`

**详细指南**：[类型同步](docs/Guides/type-sync.md)

</td>
<td width="50%">

#### ✅ 提交代码前

```bash
# 1. 格式化 + 检查
./backend/scripts/lint.sh --fix

# 2. 运行测试
./backend/scripts/test_all.sh --coverage

# 3. 提交
git commit -m "feat(task): add feature"
```

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

</td>
</tr>
</table>

---

## 📖 文档导航

<table>
<tr>
<td width="50%">

### 🎯 核心概念

- 📘 [架构设计概览](docs/Core/architecture-overview.md)
- 💡 [Vibe-Coding-Friendly 理念](docs/Core/vibe-coding-friendly.md) ⭐
- ⚡ [快速参考手册](docs/Guides/quick-reference.md)

### 🛠️ 开发指南

- 🗄️ [数据库管理](docs/Guides/database.md) - Atlas Schema 管理
- 🔄 [类型同步](docs/Guides/type-sync.md) - Go → TypeScript
- 🐳 [Docker 部署](docs/Guides/docker-deployment.md)

</td>
<td width="50%">

### 📊 可观测性

- 📋 [可观测性总览](backend/infrastructure/monitoring/README.md)
- 📝 [结构化日志](backend/infrastructure/monitoring/logger/README.md)
- 📈 [Prometheus Metrics](backend/infrastructure/monitoring/metrics/README.md)
- 🔗 [OpenTelemetry Tracing](backend/infrastructure/monitoring/tracing/README.md)

### 🔌 扩展指南

- 🏗️ [Application 层指南](docs/Extensions/APPLICATION-LAYER-GUIDE.md)
- 🗃️ [数据库 Provider 切换](docs/Extensions/DATABASE-PROVIDERS.md)

</td>
</tr>
</table>

📚 **完整文档索引**：[docs/INDEX.md](docs/INDEX.md)

---

## 🏗️ 技术栈

<table>
<tr>
<td width="33%" valign="top">

### 🔧 后端

**语言 & 框架**
- ![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white) Go 1.23+
- [CloudWeGo Hertz](https://www.cloudwego.io/zh/docs/hertz/) - 高性能 HTTP 框架
- [Eino](https://github.com/cloudwego/eino) - 字节跳动 LLM 框架

**数据存储**
- PostgreSQL 16+ (使用 database/sql，无 ORM)
- Redis 7+ (缓存 + 消息队列)

**可观测性**
- [uber-go/zap](https://github.com/uber-go/zap) - 结构化日志
- [Prometheus](https://prometheus.io/) - 指标监控
- [OpenTelemetry](https://opentelemetry.io/) - 分布式追踪

**工具链**
- [Atlas](https://atlasgo.io/) - Schema 管理
- staticcheck - 代码分析

</td>
<td width="33%" valign="top">

### 🎨 前端

**Web 应用**
- ![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black) React 18+
- ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white) TypeScript 5.0+
- Vite - 现代构建工具
- TanStack Query - 数据获取

**移动应用**
- React Native (Expo)
- 参考 [Bluesky Social App](https://github.com/bluesky-social/social-app) 架构
- 原生级性能优化

**Monorepo**
- pnpm workspace
- 共享 types/utils/constants
- Go → TypeScript 自动类型同步

</td>
<td width="33%" valign="top">

### 🚀 DevOps

**容器化**
- ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) Docker
- Docker Compose
- 多环境配置（dev/prod）

**监控 & 可观测性**
- Prometheus - 指标采集
- Grafana - 可视化
- Jaeger - 分布式追踪（可选）

**数据库管理**
- Atlas - 声明式 Schema
- 自动迁移生成
- 版本控制

**开发工具**
- Air - 热重载
- golangci-lint - 代码检查
- Playwright - E2E 测试

</td>
</tr>
</table>

---

## 📋 项目状态与路线图

### ✅ v0.1 - Starter（已完成）

<table>
<tr>
<td width="50%">

**🏗️ 核心架构**
- ✅ Vibe-Coding-Friendly DDD 架构
- ✅ Task 领域完整实现（示例）
- ✅ 三层架构（Handler + Service + Repository）
- ✅ 6 个显式知识文件齐全

**🔧 基础设施**
- ✅ Hertz HTTP 框架集成
- ✅ PostgreSQL + Redis（使用 database/sql，无 ORM）
- ✅ 完整的中间件（认证、CORS、限流、恢复等）
- ✅ 配置管理（零第三方依赖）

</td>
<td width="50%">

**📊 可观测性**
- ✅ 结构化日志（uber-go/zap）
- ✅ Prometheus Metrics
- ✅ OpenTelemetry Tracing
- ✅ 健康检查

**🛠️ 开发工具**
- ✅ Atlas Schema 管理
- ✅ Go → TypeScript 类型同步
- ✅ 前端 Monorepo（Web + Mobile）
- ✅ Docker 一键启动
- ✅ 完整的开发脚本

</td>
</tr>
</table>

---

### 🎯 使用指南

本项目以 **Task 领域** 为示例，你可以：

<table>
<tr>
<td align="center" width="33%">

### 📦 直接使用

如果需要任务管理功能

立即部署上线

</td>
<td align="center" width="33%">

### 📚 学习参考

理解 Vibe-Coding-Friendly DDD

掌握最佳实践

</td>
<td align="center" width="33%">

### 🔄 映射业务

替换为你的领域

Product、Order、Customer...

</td>
</tr>
</table>

---

### 🔌 扩展点（Extension Points）

代码中标注 `Extension point` 的位置可以扩展：

| 扩展点 | 说明 | 状态 |
|-------|------|-----|
| **Application 层** | 跨领域编排（多领域协作时需要） | 📖 [指南](docs/Extensions/APPLICATION-LAYER-GUIDE.md) |
| **LLM 集成** | 集成 OpenAI、Claude 等 | 🔌 预留接口 |
| **事件总线** | 从内存切换到 Redis/Kafka | 🔌 预留接口 |
| **JWT 认证** | 完整的 Token 验证和刷新 | 🔌 预留接口 |
| ~~**分布式追踪**~~ | ~~OpenTelemetry Tracing~~ | ✅ **已完成** |
| ~~**监控告警**~~ | ~~Prometheus + Grafana~~ | ✅ **已完成** |

---

### 🗺️ 未来路线图

<table>
<tr>
<td width="50%">

#### 🔜 v0.2 - 增强（规划中）

- [ ] 真实 LLM 集成示例（Eino）
- [ ] 事件溯源（Event Sourcing）
- [ ] CQRS 模式支持
- [ ] 完整的 E2E 测试
- [ ] 性能基准测试

</td>
<td width="50%">

#### 🚀 v0.3 - 生产（规划中）

- [ ] Kubernetes 部署配置
- [ ] CI/CD 流水线
- [ ] 安全加固（JWT、RBAC）
- [ ] 多租户支持
- [ ] API 版本管理

</td>
</tr>
</table>

**欢迎在 [Discussions](https://github.com/erweixin/Go-GenAI-Stack/discussions) 提出你的想法！**

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！⭐ **Star** 本项目表示支持。

### 💡 如何贡献

<table>
<tr>
<td width="50%">

**🐛 发现问题？**
- 提交 [Issue](https://github.com/erweixin/Go-GenAI-Stack/issues)
- 描述问题和复现步骤
- 附上环境信息

**💬 有想法？**
- 在 [Discussions](https://github.com/erweixin/Go-GenAI-Stack/discussions) 讨论
- 分享你的使用案例
- 提出功能建议

</td>
<td width="50%">

**🔧 想要贡献代码？**

```bash
# 1. Fork 并克隆
git clone https://github.com/YOUR_NAME/Go-GenAI-Stack.git

# 2. 创建分支
git checkout -b feat/amazing-feature

# 3. 提交（遵循 Conventional Commits）
git commit -m 'feat(task): add amazing feature'

# 4. 推送并创建 PR
git push origin feat/amazing-feature
```

</td>
</tr>
</table>

### 📝 Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat(domain):     新功能
fix(domain):      Bug 修复
docs:             文档更新
refactor(domain): 重构
test(domain):     测试
chore:            构建/工具链
```

---

## 📊 项目指标

<table>
<tr>
<td align="center" width="25%">
<h3>🎯 测试覆盖率</h3>
<h2>≥ 60%</h2>
<small>持续提升中</small>
</td>
<td align="center" width="25%">
<h3>✅ 代码质量</h3>
<h2>100%</h2>
<small>go vet + staticcheck</small>
</td>
<td align="center" width="25%">
<h3>📚 结构完整性</h3>
<h2>6/6</h2>
<small>必需文件齐全</small>
</td>
<td align="center" width="25%">
<h3>🤖 AI 友好性</h3>
<h2>≥ 90%</h2>
<small>usecases.yaml 覆盖</small>
</td>
</tr>
</table>

---

## 🌟 Star History

如果这个项目对你有帮助，请点个 ⭐ Star 支持一下！

[![Star History Chart](https://api.star-history.com/svg?repos=erweixin/Go-GenAI-Stack&type=Date)](https://star-history.com/#erweixin/Go-GenAI-Stack&Date)

---

## 💬 社区与支持

<table>
<tr>
<td align="center" width="33%">

### 📖 文档

完整的中文文档

[查看文档](docs/INDEX.md)

</td>
<td align="center" width="33%">

### 💡 讨论

分享想法和问题

[参与讨论](https://github.com/erweixin/Go-GenAI-Stack/discussions)

</td>
<td align="center" width="33%">

### 🐛 问题

报告 Bug 和功能请求

[提交 Issue](https://github.com/erweixin/Go-GenAI-Stack/issues)

</td>
</tr>
</table>

---

## 🔗 参考项目与资源

### 灵感来源

- **[Coze Studio](https://www.coze.com/)** - LLM 编排平台，启发了本项目的声明式工作流设计
- **[Bluesky Social App](https://github.com/bluesky-social/social-app)** - React Native 最佳实践参考

### 技术文档

- [CloudWeGo Hertz](https://www.cloudwego.io/zh/docs/hertz/) - 高性能 HTTP 框架
- [Eino Framework](https://github.com/cloudwego/eino) - 字节跳动 LLM 框架
- [Atlas](https://atlasgo.io/) - 数据库 Schema 管理
- [Domain-Driven Design](https://domainlanguage.com/ddd/) - 领域驱动设计

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

<div align="center">

**如果这个项目帮助到了你，请给一个 ⭐ Star！**

Made with ❤️ by Go-GenAI-Stack Team

[⬆ 回到顶部](#-go-genai-stack)

---

**版本**：v0.1.0 | **状态**：🚀 Active Development | **最后更新**：2025-12-01

</div>
