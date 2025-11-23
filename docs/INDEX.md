# Go-GenAI-Stack 文档导航

> 📖 完整的文档索引，帮助你快速找到需要的信息

---

## 🚀 新手入门

### 快速开始
- **[5 分钟快速开始](Getting-Started/QUICK-START.md)** - 一键启动项目（规划中）
- **[项目结构导览](Getting-Started/PROJECT-STRUCTURE.md)** - 理解项目组织（规划中）
- **[常见问题 FAQ](Getting-Started/FAQ.md)** - 故障排查和常见问题（规划中）

### 基础教程
- **[Task 领域示例](../backend/domains/task/README.md)** - 完整的领域实现示例

---

## 🏗️ 架构与设计

### 核心理念
- **[Vibe-Coding-Friendly 理念](Vibe-Coding-Friendly.md)** ⭐ - 核心设计哲学
- **[DDD 架构说明](vibe-coding-ddd-structure.md)** - 领域驱动设计结构
- **[最优架构设计](optimal-architecture.md)** - 架构决策和权衡

### 模式与实践
- **[Repository 模式](Architecture/repository-pattern.md)** - 数据访问层模式（规划中）
- **[为什么不用 ORM](REFACTORING-COMPLETE.md)** - 使用 database/sql 的理由

---

## 🔧 开发指南

### 基础操作
- **[快速参考](quick-reference.md)** - 常用命令速查
- **[添加新用例](Development/ADD-USE-CASE.md)** - 如何添加业务用例（规划中）
- **[创建新领域](Development/CREATE-DOMAIN.md)** - 如何创建自己的业务领域（规划中）

### 数据库管理
- **[Atlas 快速开始](atlas-quickstart.md)** - 数据库 Schema 管理
- **[数据库设置](database-setup.md)** - 数据库配置和连接

### 前后端协作
- **[类型同步指南](type-sync.md)** - Go DTO → TypeScript 类型同步
- **[Monorepo 设置](monorepo-setup.md)** - 前端 Monorepo 结构

---

## 🔌 扩展指南

### 高级功能
- **[Application 层（跨领域编排）](Extensions/APPLICATION-LAYER-GUIDE.md)** ⭐ - 何时以及如何使用 Application 层
- **[LLM 集成](Extensions/LLM-INTEGRATION.md)** - 集成 OpenAI、Claude 等（规划中）
- **[认证与授权](Extensions/AUTH-GUIDE.md)** - JWT 认证实现（规划中）
- **[事件总线](Extensions/EVENT-BUS.md)** - 领域事件发布和订阅（规划中）

### 基础设施
- **[监控和追踪](Extensions/MONITORING.md)** - Prometheus + OpenTelemetry（规划中）
- **[缓存策略](Extensions/CACHING.md)** - Redis 缓存使用（规划中）
- **[消息队列](Extensions/MESSAGE-QUEUE.md)** - 异步任务处理（规划中）

---

## 🤖 AI 辅助开发

### AI 友好设计
- **[Cursor AI 规则说明](../.cursorrules)** - AI 编码助手配置
- **[AI 元数据规范](AI-Friendly/ai-metadata-spec.md)** - ai-metadata.json 格式（规划中）
- **[用例声明规范](AI-Friendly/usecases-yaml-spec.md)** - usecases.yaml 格式（规划中）

### 最佳实践
- **[领域映射指南](Development/DOMAIN-MAPPING-GUIDE.md)** - 如何将 Task 映射到你的业务（规划中）
- **[AI 辅助开发工作流](AI-Friendly/ai-workflow.md)** - 使用 AI 高效开发（规划中）

---

## 📦 项目管理

### 整改计划
- **[Starter 整改计划](STARTER-REFACTORING-PLAN.md)** ⭐ - 项目优化路线图
- **[整改检查清单](REFACTORING-CHECKLIST.md)** - 跟踪整改进度（已删除）

### 变更历史
- **[整改完成报告](REFACTORING-COMPLETE.md)** - 数据库重构完成记录
- **[后端代码组织](backend-code-organization.md)** - 代码组织方式演进

---

## 🎓 学习路径

### 🌟 新手路径（1-2 天）

**目标**：快速上手，理解基本概念

1. ✅ 阅读 [主 README](../README.md) - 了解项目定位
2. ✅ 运行 `./scripts/quickstart.sh` - 启动项目
3. ✅ 阅读 [Task 领域](../backend/domains/task/README.md) - 理解领域实现
4. ✅ 测试 API - 使用 curl 或 Postman 测试
5. ✅ 阅读 [usecases.yaml](../backend/domains/task/usecases.yaml) - 理解用例声明

### 🚀 进阶路径（3-5 天）

**目标**：深入理解架构，能够定制功能

1. ✅ 阅读 [Vibe-Coding-Friendly 理念](Vibe-Coding-Friendly.md)
2. ✅ 阅读 [DDD 架构说明](vibe-coding-ddd-structure.md)
3. ✅ 修改现有用例 - 添加新字段或逻辑
4. ✅ 添加新用例 - 参考现有代码
5. ✅ 运行测试 - `./backend/scripts/test_all.sh`

### 💡 高级路径（1-2 周）

**目标**：创建自己的业务领域，扩展功能

1. ✅ 创建新领域 - 基于 Task 模板
2. ✅ 实现跨领域编排 - 阅读 [Application 层指南](Extensions/APPLICATION-LAYER-GUIDE.md)
3. ✅ 集成真实 LLM - OpenAI、Claude 等
4. ✅ 实现认证授权 - JWT + 权限控制
5. ✅ 部署到生产环境 - Docker + Kubernetes

---

## 📌 快速链接

### 常用文档
- [主 README](../README.md)
- [Backend README](../backend/README.md)
- [快速参考](quick-reference.md)
- [Atlas 快速开始](atlas-quickstart.md)

### 示例代码
- [Task 领域完整实现](../backend/domains/task/)
- [usecases.yaml 示例](../backend/domains/task/usecases.yaml)
- [Handler 示例](../backend/domains/task/handlers/create_task.handler.go)
- [Repository 示例](../backend/domains/task/repository/task_repo.go)

### 配置文件
- [Cursor AI 规则](../.cursorrules)
- [Docker Compose](../docker/docker-compose.yml)
- [数据库 Schema](../backend/infrastructure/database/schema/schema.sql)
- [种子数据](../backend/migrations/seed/01_initial_data.sql)

---

## 🔍 按主题查找

### 我想了解...

#### 项目是什么？
→ 阅读 [主 README](../README.md) 和 [Vibe-Coding-Friendly 理念](Vibe-Coding-Friendly.md)

#### 如何启动项目？
→ 运行 `./scripts/quickstart.sh` 或参考 [Backend README](../backend/README.md)

#### 如何添加新功能？
→ 阅读 [Task 领域示例](../backend/domains/task/README.md) 和 [usecases.yaml](../backend/domains/task/usecases.yaml)

#### 如何创建自己的业务领域？
→ 复制 Task 领域，参考 [Task README 的映射指南](../backend/domains/task/README.md#映射指南)

#### 如何实现跨领域功能？
→ 阅读 [Application 层指南](Extensions/APPLICATION-LAYER-GUIDE.md)

#### 如何管理数据库 Schema？
→ 阅读 [Atlas 快速开始](atlas-quickstart.md)

#### 如何同步前后端类型？
→ 阅读 [类型同步指南](type-sync.md)

#### 如何使用 AI 辅助开发？
→ 阅读 [Cursor AI 规则](../.cursorrules) 和 [usecases.yaml 规范](AI-Friendly/usecases-yaml-spec.md)（规划中）

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
| ❌ 已弃用 | 文档内容过时，仅供参考 |

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

**最后更新**：2025-11-23  
**维护者**：Go-GenAI-Stack Team


