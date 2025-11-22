# Go-GenAI-Stack

> 🚀 一个采用 **Vibe-Coding-Friendly DDD** 架构的 GenAI 应用全栈项目
>
> **特点**：显式知识 + 声明式用例 + AI 友好 + Monorepo

---

## 📁 项目结构

```
Go-GenAI-Stack/
├── backend/              # 后端（Go + Hertz + Eino + DDD）
│   ├── domains/          # 领域层（Domain-First）
│   │   ├── chat/         # 聊天领域
│   │   ├── llm/          # LLM 领域
│   │   └── shared/       # 共享组件
│   ├── infrastructure/   # 基础设施层
│   │   ├── persistence/  # 持久化（Postgres, Redis）
│   │   ├── middleware/   # 中间件
│   │   ├── config/       # 配置管理
│   │   └── queue/        # 异步任务队列
│   ├── application/      # 应用层（跨领域编排）
│   ├── pkg/              # 可复用工具包
│   │   ├── logger/       # 日志
│   │   ├── ratelimiter/  # 限流
│   │   ├── circuitbreaker/ # 熔断
│   │   └── validator/    # 验证
│   ├── migrations/       # 数据库迁移
│   └── scripts/          # 开发脚本
├── frontend/             # 前端 Monorepo
│   ├── web/              # React Web 应用
│   ├── mobile/           # React Native 移动应用
│   └── shared/           # 前端共享代码
│       ├── types/        # TypeScript 类型定义
│       ├── utils/        # 工具函数
│       └── constants/    # 常量
├── docs/                 # 项目文档
└── scripts/              # 项目级脚本
```

---

## ✨ 核心特性

### 🎯 Vibe-Coding-Friendly DDD

- **领域优先**：按业务领域垂直切分（chat, llm, monitoring）
- **自包含**：每个领域包含 model + handlers + http + tests
- **显式知识**：6 个必需文件（README, glossary, rules, events, usecases.yaml, ai-metadata.json）
- **声明式用例**：在 `usecases.yaml` 中定义业务流程
- **AI 友好**：结构化知识 + 语义化命名 + 完整注释

### 🤖 AI 辅助开发

- **AI 代码生成**：`./scripts/ai_codegen.sh` 一键生成 handler 和 test
- **自动化文档**：`./scripts/generate_docs.sh` 生成领域文档
- **结构验证**：`./scripts/validate_structure.sh` 检查规范性
- **完整 CI/CD**：6 个 GitHub Actions 工作流

### 🛠️ 开发工具链

- **pkg/ 工具包**：Logger, RateLimiter, CircuitBreaker, Validator
- **数据库迁移**：`./scripts/migrate.sh` 管理数据库变更
- **测试覆盖率**：`./scripts/test_all.sh --coverage` 生成报告
- **代码质量**：`./scripts/lint.sh` 自动检查和修复

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/erweixin/Go-GenAI-Stack.git
cd Go-GenAI-Stack
```

### 2. 启动后端

```bash
cd backend

# 安装依赖
go mod download

# 启动数据库（使用 Docker Compose）
docker-compose up -d

# 运行数据库迁移
./scripts/migrate.sh up

# 启动开发服务器
./scripts/dev.sh
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

```bash
# 修改 schema
vim backend/infrastructure/database/schema/schema.sql

# 生成迁移
cd backend
./scripts/schema.sh diff my_change

# 应用迁移
./scripts/schema.sh apply

# 查看状态
./scripts/schema.sh status
```

详细文档：
- [Atlas 快速参考](docs/atlas-quickstart.md)
- [Atlas 详细指南](backend/infrastructure/database/README.md)
- [迁移完成报告](docs/atlas-migration-guide.md)

### 创建新用例

```bash
# 1. 在 usecases.yaml 中定义用例
vim backend/domains/chat/usecases.yaml

# 2. 生成代码骨架
cd backend
./scripts/ai_codegen.sh --domain chat --usecase NewUseCase

# 3. 实现业务逻辑
vim domains/chat/handlers/new_use_case.handler.go

# 4. 完善测试
vim domains/chat/tests/new_use_case.test.go

# 5. 运行测试
./scripts/test_all.sh chat
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

# 3. 验证结构
./scripts/validate_structure.sh

# 4. 提交
git add .
git commit -m "feat(chat): add new use case"
git push
```

---

## 📖 文档

- [架构设计](docs/optimal-architecture.md)
- [Vibe-Coding-Friendly 理念](docs/Vibe-Coding-Friendly.md)
- [目录结构说明](docs/vibe-coding-ddd-structure.md)
- [优化计划](docs/optimization-plan.md)
- [优化检查清单](docs/optimization-checklist.md)
- [快速参考](docs/quick-reference.md)
- [Monorepo 设置](docs/monorepo-setup.md)
- [类型同步指南](docs/type-sync.md)
- [第 3 周完成报告](docs/week3-completion-report.md)
- [第 5 周完成报告](docs/week5-completion-report.md)

---

## 🏗️ 技术栈

### 后端
- **语言**：Go 1.21+
- **框架**：CloudWeGo Hertz (HTTP)
- **LLM**：Eino (字节跳动 LLM 框架)
- **数据库**：PostgreSQL, Redis
- **消息队列**：Asynq (Redis-based)
- **工具**：golangci-lint, golang-migrate

### 前端
- **框架**：React (Web), React Native (Mobile)
- **语言**：TypeScript
- **构建**：Vite (Web), Metro (Mobile)
- **包管理**：pnpm (Monorepo)

### DevOps
- **CI/CD**：GitHub Actions
- **容器**：Docker, Docker Compose
- **监控**：（规划中：Prometheus, OpenTelemetry）

---

## 📋 项目状态

### ✅ 已完成
- ✅ 基础架构搭建
- ✅ Chat 领域完整实现
- ✅ LLM 领域基础实现
- ✅ 基础设施层重构
- ✅ 可复用工具包（pkg/）
- ✅ 数据库迁移管理
- ✅ AI 代码生成工具
- ✅ 开发工具链
- ✅ CI/CD 配置
- ✅ 前端 Monorepo 设置

### 🚧 进行中
- 🚧 LLM 领域完善（Week 1）
- 🚧 测试体系建设（Week 2）

### 📅 计划中
- 📅 Monitoring 领域（Week 4）
- 📅 性能优化
- 📅 监控和追踪

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

- **测试覆盖率目标**：≥ 80%
- **代码质量**：golangci-lint 全部通过
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
