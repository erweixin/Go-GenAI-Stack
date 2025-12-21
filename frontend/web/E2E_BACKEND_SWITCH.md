# E2E 测试后端切换指南

本文档说明如何在 E2E 测试中切换后端实现（Go 或 Node.js）。

---

## 🎯 快速开始

### 方式 1：使用 npm 脚本（推荐）⭐

```bash
cd frontend/web

# 测试 Go 后端（默认）
pnpm e2e              # 命令行模式
pnpm e2e:ui           # UI 模式（推荐）

# 测试 Node.js 后端
pnpm e2e:nodejs       # 命令行模式
pnpm e2e:nodejs:ui    # UI 模式（推荐）

# 一键运行（包含环境启动和清理）
pnpm e2e:all          # Go 后端
pnpm e2e:nodejs:all   # Node.js 后端
```

### 方式 2：使用环境变量

```bash
# 测试 Go 后端（默认）
E2E_BACKEND_URL=http://localhost:8081 pnpm e2e

# 测试 Node.js 后端
E2E_BACKEND_URL=http://localhost:8082 pnpm e2e
```

---

## 📋 后端端口映射

| 后端实现 | 端口 | 说明 |
|---------|------|------|
| Go Backend | 8081 | 默认后端 |
| Node.js Backend | 8082 | Node.js 实现 |

---

## 🔧 配置说明

### playwright.config.ts

Playwright 配置已更新，支持通过 `E2E_BACKEND_URL` 环境变量切换后端：

```typescript
webServer: {
  command: 'pnpm dev',
  port: 5173,
  env: {
    // 支持通过 E2E_BACKEND_URL 环境变量切换后端
    VITE_API_BASE_URL: process.env.E2E_BACKEND_URL || 'http://localhost:8081',
  },
}
```

### package.json 脚本

新增的脚本：

- `e2e:nodejs` - 测试 Node.js 后端（命令行模式）
- `e2e:nodejs:ui` - 测试 Node.js 后端（UI 模式）
- `e2e:nodejs:all` - 一键运行（启动环境 → 测试 → 清理）

---

## 🚀 完整流程示例

### 测试 Go 后端

```bash
# 1. 启动 E2E 环境（包含 Go 和 Node.js 两个后端）
cd frontend/web
pnpm e2e:setup

# 2. 运行测试（Go 后端）
pnpm e2e:ui

# 3. 停止环境
pnpm e2e:teardown
```

### 测试 Node.js 后端

```bash
# 1. 启动 E2E 环境（包含 Go 和 Node.js 两个后端）
cd frontend/web
pnpm e2e:setup

# 2. 运行测试（Node.js 后端）
pnpm e2e:nodejs:ui

# 3. 停止环境
pnpm e2e:teardown
```

---

## 📝 注意事项

1. **环境启动**：`pnpm e2e:setup` 会同时启动 Go 和 Node.js 两个后端，但测试时只会使用其中一个。

2. **端口冲突**：确保端口 8081 和 8082 没有被其他服务占用。

3. **测试数据**：两个后端共享同一个数据库（Postgres），使用相同的测试数据。

4. **Redis 依赖**：Node.js 后端需要 Redis，但 Go 后端不需要。E2E 环境已包含 Redis 服务。

---

## 🔍 验证后端切换

### 检查 Go 后端

```bash
curl http://localhost:8081/health
```

### 检查 Node.js 后端

```bash
curl http://localhost:8082/health
```

---

## 📚 相关文档

- [E2E 测试文档](./e2e/README.md)
- [E2E 测试指南](./doc/e2e-testing.md)
- [Docker E2E 环境](../../docker/e2e/README.md)

---

**最后更新**: 2025-01-XX

