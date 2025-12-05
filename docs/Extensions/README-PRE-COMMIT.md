# Pre-commit Hook 使用说明

本项目配置了自动格式化的 pre-commit hook，在提交代码前会自动格式化 Go 和前端代码。

## 功能

- ✅ **自动格式化 Go 代码**：使用 `gofmt` 和 `goimports`
- ✅ **自动格式化前端代码**：使用 `prettier`
- ✅ **只格式化暂存的文件**：提高性能
- ✅ **无需根目录 package.json**：使用纯 shell 脚本

## 安装

运行安装脚本：

```bash
./scripts/setup-pre-commit.sh
```

或者手动安装：

```bash
chmod +x scripts/pre-commit-format.sh
cp scripts/pre-commit-format.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 工作原理

1. 当你执行 `git commit` 时，Git 会自动运行 `.git/hooks/pre-commit`
2. Hook 会调用 `scripts/pre-commit-format.sh`
3. 脚本会检查暂存的文件：
   - 如果有 `.go` 文件，使用 `goimports`（或 `gofmt`）格式化
   - 如果有前端文件（`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`），使用 `prettier` 格式化
4. 格式化后的文件会自动添加到暂存区
5. 提交继续进行

## 依赖工具

### Go 格式化工具

```bash
# 安装 goimports（推荐）
go install golang.org/x/tools/cmd/goimports@latest

# 或者使用 gofmt（Go 自带）
# 无需安装
```

### 前端格式化工具

```bash
# 确保已安装 pnpm（项目使用 pnpm）
npm install -g pnpm

# prettier 已包含在 frontend/package.json 中
# 运行 pnpm install 即可
```

## 测试

测试 pre-commit hook：

```bash
# 1. 修改一些文件
echo "// test" >> backend/cmd/server/main.go
echo "const test = 'test'" >> frontend/web/src/test.ts

# 2. 暂存文件
git add backend/cmd/server/main.go frontend/web/src/test.ts

# 3. 提交（会自动格式化）
git commit -m "test: format code"
```

## 跳过格式化

如果需要跳过格式化（不推荐），可以使用：

```bash
git commit --no-verify -m "skip formatting"
```

## 手动格式化

如果需要手动格式化所有代码：

```bash
# Go 代码
cd backend && make fmt

# 或使用脚本
./scripts/lint-fix.sh

# 前端代码
cd frontend && pnpm format
```

## 故障排除

### Hook 不工作

1. 检查 hook 是否存在：
   ```bash
   ls -la .git/hooks/pre-commit
   ```

2. 检查 hook 是否有执行权限：
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

3. 检查脚本路径：
   ```bash
   cat .git/hooks/pre-commit
   ```

### 格式化失败

1. **Go 格式化失败**：
   - 确保已安装 `goimports` 或 `gofmt`
   - 检查 Go 文件语法是否正确

2. **前端格式化失败**：
   - 确保已安装 `pnpm`：`npm install -g pnpm`
   - 确保已安装依赖：`cd frontend && pnpm install`
   - 检查文件语法是否正确

### 性能问题

如果格式化太慢，可以：
- 只暂存需要提交的文件（而不是 `git add .`）
- 使用 `git commit --no-verify` 跳过（不推荐）

## 配置

格式化配置：

- **Go**：使用 Go 标准格式（`gofmt`）
- **前端**：使用 `frontend/.prettierrc` 配置

## 与 CI/CD 集成

虽然 pre-commit hook 会自动格式化，但建议在 CI 中也检查格式：

```yaml
# .github/workflows/ci.yml
- name: Check Go format
  run: |
    cd backend
    gofmt -l . | grep -q . && exit 1 || exit 0

- name: Check frontend format
  run: |
    cd frontend
    pnpm format:check
```

