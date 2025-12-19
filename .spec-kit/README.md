# Spec-Kit 规范驱动开发

> 📋 **规范即代码**：将业务需求转化为可执行的开发规范

## 目录结构

```
.spec-kit/
├── README.md              # 本文件
├── specs/                  # 业务规范（What & Why）
│   ├── task-management.spec.md
│   ├── auth.spec.md
│   └── user-management.spec.md
├── plans/                  # 实现计划（How）
│   ├── task-management.plan.md
│   └── auth.plan.md
├── tasks/                  # 任务分解（Tasks）
│   ├── task-management.tasks.md
│   └── auth.tasks.md
└── templates/              # 模板文件
    ├── spec.template.md
    ├── plan.template.md
    └── tasks.template.md
```

## 工作流程

```
1. Specify（规格化）
   ↓
   .spec-kit/specs/*.spec.md
   ↓
2. Plan（规划）
   ↓
   .spec-kit/plans/*.plan.md
   ↓
3. Tasks（任务分解）
   ↓
   .spec-kit/tasks/*.tasks.md
   ↓
4. Implement（实现）
   ↓
   backend/domains/*/usecases.yaml
   ↓
   AI 生成代码
```

## 规范层次

| 层级 | 文件位置 | 内容 | 受众 |
|------|---------|------|------|
| **业务规范** | `.spec-kit/specs/` | 业务需求、用户故事、功能规格 | 产品、业务 |
| **实现计划** | `.spec-kit/plans/` | 技术方案、架构决策、实现步骤 | 开发、架构 |
| **任务分解** | `.spec-kit/tasks/` | 具体任务、验收标准、依赖关系 | 开发 |
| **实现规范** | `domains/*/usecases.yaml` | API 规范、数据模型、业务逻辑 | AI、开发 |

## 快速开始

1. **创建新规范**：
   ```bash
   cp .spec-kit/templates/spec.template.md .spec-kit/specs/my-feature.spec.md
   ```

2. **生成实现计划**：
   ```bash
   # 手动创建或使用 AI 生成
   cp .spec-kit/templates/plan.template.md .spec-kit/plans/my-feature.plan.md
   ```

3. **分解任务**：
   ```bash
   cp .spec-kit/templates/tasks.template.md .spec-kit/tasks/my-feature.tasks.md
   ```

4. **更新 usecases.yaml**：
   根据 plan 和 tasks 更新对应领域的 `usecases.yaml`

## 相关文档

- [Spec-Kit 使用指南](../../docs/Guides/spec-kit-guide.md)
- [与现有系统集成指南](../../docs/Guides/spec-kit-integration.md)
- [Spec-Kit 官方文档](https://github.com/github/spec-kit)

