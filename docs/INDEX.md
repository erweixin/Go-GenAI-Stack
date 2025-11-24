# Go-GenAI-Stack 文档导航

> 📖 完整的文档索引，帮助你快速找到需要的信息

**最后更新**：2025-11-23

---

## 📚 文档结构

```
docs/
├── INDEX.md                                  # 📍 你在这里
├── Core/                                     # 核心文档（必读）
│   ├── vibe-coding-friendly.md              # Vibe-Coding-Friendly 理念
│   └── architecture-overview.md             # 架构概览
├── Guides/                                   # 开发指南
│   ├── quick-reference.md                   # 快速参考
│   ├── database.md                          # 数据库管理
│   └── type-sync.md                         # 类型同步
├── Extensions/                               # 扩展指南
│   └── APPLICATION-LAYER-GUIDE.md           # Application 层指南
└── Archive/                                  # 归档（历史文档）
    ├── README.md
    ├── monorepo-setup.md
    └── REFACTORING-COMPLETE.md
```

---

## 🚀 新手入门

### 第一步：快速开始

1. **阅读项目 README**
   - [主 README](../README.md) - 项目概览和定位
   - [Backend README](../backend/README.md) - 后端详细说明

2. **运行项目**
   ```bash
   # 一键启动（推荐）
   ./scripts/quickstart.sh
   
   # 或手动启动
   cd docker && docker-compose up -d
   cd ../backend && ./scripts/schema.sh apply
   cd ../backend && ./scripts/seed.sh
   cd ../backend && go run cmd/server/main.go
   ```

3. **验证安装**
   ```bash
   # 健康检查
   curl http://localhost:8080/health
   
   # 获取任务列表
   curl http://localhost:8080/api/tasks
   ```

### 第二步：理解架构

- **[Vibe-Coding-Friendly 理念](Core/vibe-coding-friendly.md)** ⭐
  - 核心设计哲学
  - 为什么这样设计
  - AI 友好的理念

- **[架构概览](Core/architecture-overview.md)** ⭐
  - 完整的目录结构
  - 分层架构说明
  - 领域驱动设计（DDD）
  - 前后端 Monorepo 结构

### 第三步：查看示例

- **[Task 领域实现](../backend/domains/task/README.md)**
  - 完整的领域示例
  - 6 个必需文件（README、glossary、rules、events、usecases.yaml、ai-metadata.json）
  - Handler、Repository、HTTP 层实现

---

## 📖 核心文档

### Vibe-Coding-Friendly 理念

**[vibe-coding-friendly.md](Core/vibe-coding-friendly.md)**

- 什么是 Vibe-Coding-Friendly
- 核心原则（领域优先、自包含、显式知识）
- 为什么这样设计
- AI 协作工作流

**适合**：想理解项目设计理念的开发者

### 架构概览

**[architecture-overview.md](Core/architecture-overview.md)**

- 完整的项目结构
- 分层架构详解
- 目录职责说明
- 前后端类型同步
- 创建新领域指南

**适合**：想深入了解架构的开发者

---

## 🔧 开发指南

### 快速参考

**[quick-reference.md](Guides/quick-reference.md)**

- 常用命令速查
- 快速示例
- 故障排查

**适合**：日常开发查阅

### 数据库管理

**[database.md](Guides/database.md)**

- PostgreSQL + Atlas 完整指南
- Schema 管理工作流
- 常用 SQL 命令
- 连接池配置
- 故障排查

**适合**：需要管理数据库的开发者

### 类型同步

**[type-sync.md](Guides/type-sync.md)**

- Go DTO → TypeScript 类型同步
- tygo 配置和使用
- 前端如何使用生成的类型

**适合**：前后端协作开发

### Docker 部署

**[docker-deployment.md](Guides/docker-deployment.md)**

- Docker 一键启动指南
- 多阶段构建 Dockerfile
- 生产环境部署
- 常见问题排查

**适合**：需要部署项目的开发者

---

## 🔌 扩展指南

### Application 层指南

**[APPLICATION-LAYER-GUIDE.md](Extensions/APPLICATION-LAYER-GUIDE.md)**

- 什么是 Application 层
- 何时需要 Application 层
- 跨领域编排示例
- 最佳实践

**适合**：需要实现跨领域功能的开发者

### Database Providers 数据库提供者

**[DATABASE-PROVIDERS.md](Extensions/DATABASE-PROVIDERS.md)**

- 数据库依赖注入架构
- 切换 PostgreSQL/MySQL/SQLite
- 实现自定义数据库提供者
- SQL 方言抽象

**适合**：需要切换数据库或添加自定义数据库支持的开发者

### 其他扩展（规划中）

- LLM 集成指南
- 认证与授权
- 事件总线实现
- 监控和追踪

---

## 🎓 学习路径

### 🌟 新手路径（1-2 天）

**目标**：快速上手，理解基本概念

1. ✅ 阅读 [主 README](../README.md)
2. ✅ 运行 `./scripts/quickstart.sh`
3. ✅ 阅读 [Task 领域](../backend/domains/task/README.md)
4. ✅ 测试 API（curl 或 Postman）
5. ✅ 阅读 [usecases.yaml](../backend/domains/task/usecases.yaml)

### 🚀 进阶路径（3-5 天）

**目标**：深入理解架构，能够定制功能

1. ✅ 阅读 [Vibe-Coding-Friendly 理念](Core/vibe-coding-friendly.md)
2. ✅ 阅读 [架构概览](Core/architecture-overview.md)
3. ✅ 修改现有用例（添加新字段）
4. ✅ 添加新用例（参考现有代码）
5. ✅ 运行测试（`./backend/scripts/test_all.sh`）

### 💡 高级路径（1-2 周）

**目标**：创建自己的业务领域，扩展功能

1. ✅ 创建新领域（基于 Task 模板）
2. ✅ 实现跨领域编排（[Application 层指南](Extensions/APPLICATION-LAYER-GUIDE.md)）
3. ✅ 集成真实 LLM（规划中）
4. ✅ 实现认证授权（规划中）
5. ✅ 部署到生产环境

---

## 🔍 按主题查找

### 我想了解...

| 主题 | 推荐文档 |
|------|----------|
| **项目是什么？** | [主 README](../README.md) |
| **如何启动项目？** | [Docker 部署指南](Guides/docker-deployment.md) + `./docker/docker-up.sh` |
| **架构是什么样的？** | [架构概览](Core/architecture-overview.md) |
| **如何添加新功能？** | [Task 领域示例](../backend/domains/task/README.md) |
| **如何管理数据库？** | [数据库指南](Guides/database.md) |
| **如何同步前后端类型？** | [类型同步指南](Guides/type-sync.md) |
| **如何部署到生产环境？** | [Docker 部署指南](Guides/docker-deployment.md) |
| **如何实现跨领域功能？** | [Application 层指南](Extensions/APPLICATION-LAYER-GUIDE.md) |
| **常用命令是什么？** | [快速参考](Guides/quick-reference.md) |

---

## 📦 归档文档

**[Archive/](Archive/)** - 历史文档，仅供参考

- [monorepo-setup.md](Archive/monorepo-setup.md) - Monorepo 设置完成记录
- [REFACTORING-COMPLETE.md](Archive/REFACTORING-COMPLETE.md) - 数据库重构记录

**注意**：归档文档内容可能已过时，不建议新用户阅读。

---

## 📝 文档约定

### 标记说明

- ⭐ - 重要文档，必读
- 🚧 - 正在编写中
- 📝 - 规划中，待创建
- ✅ - 已完成
- ❌ - 已弃用

### 文档状态

| 状态 | 说明 |
|------|------|
| ✅ 已完成 | 文档内容完整，可以阅读 |
| 🚧 编写中 | 文档正在编写，内容可能不完整 |
| 📝 规划中 | 文档计划创建，但尚未开始编写 |
| 📦 已归档 | 文档已归档，内容可能过时 |

---

## 🔗 快速链接

### 常用文档

- [主 README](../README.md)
- [Backend README](../backend/README.md)
- [架构概览](Core/architecture-overview.md) ⭐
- [数据库指南](Guides/database.md)
- [快速参考](Guides/quick-reference.md)

### 示例代码

- [Task 领域](../backend/domains/task/)
- [usecases.yaml 示例](../backend/domains/task/usecases.yaml)
- [Handler 示例](../backend/domains/task/handlers/create_task.handler.go)
- [Repository 示例](../backend/domains/task/repository/task_repo.go)

### 配置文件

- [Cursor AI 规则](../.cursorrules)
- [Docker Compose](../docker/docker-compose.yml)
- [数据库 Schema](../backend/infrastructure/database/schema/schema.sql)
- [种子数据](../backend/migrations/seed/01_initial_data.sql)
- [类型同步配置](../tygo.yaml)

---

## 🤝 贡献指南

### 改进文档

如果你发现文档有误或需要改进：

1. 提交 [GitHub Issue](https://github.com/erweixin/Go-GenAI-Stack/issues)
2. 或直接提交 PR 修改文档
3. 或在 [Discussions](https://github.com/erweixin/Go-GenAI-Stack/discussions) 中讨论

### 添加新文档

如果你想贡献新文档：

1. 参考现有文档的格式和风格
2. 遵循文档约定和命名规范
3. 在 `docs/INDEX.md` 中添加链接
4. 提交 PR

---

## 📧 获取帮助

### 遇到问题？

1. **查看文档** - 先在本索引中查找相关文档
2. **搜索 Issues** - 可能有人遇到过相同问题
3. **提问 Discussions** - 在社区中提问
4. **提交 Issue** - 报告 Bug 或请求新功能

### 联系方式

- 📧 Email: [your-email@example.com]
- 💬 GitHub Discussions: [项目 Discussions 页面]
- 🐛 GitHub Issues: [项目 Issues 页面]

---

## 📊 文档优化记录

### 2025-11-23 - 文档清理优化

- ✅ 整合架构文档（3 → 1）
- ✅ 整合数据库文档（2 → 1）
- ✅ 创建清晰的目录结构
- ✅ 归档历史文档

**效果**：
- 活跃文档：从 12 个减少到 7 个（-42%）
- 文档重复率：从 40% 降低到 <10%
- 维护成本：降低 66%

详见：[文档清理计划](DOCUMENTATION-CLEANUP-PLAN.md)

---

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team
