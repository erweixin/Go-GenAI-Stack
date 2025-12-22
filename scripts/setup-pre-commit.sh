#!/bin/bash

# Setup pre-commit hook for auto-formatting
# 设置自动格式化的 pre-commit hook

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

echo "🔧 Setting up pre-commit hook for auto-formatting..."
echo ""

# 确保 .git/hooks 目录存在
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ .git/hooks directory not found. Are you in a git repository?"
    exit 1
fi

# 创建 pre-commit hook
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash

# Pre-commit hook: Auto-format code
# 自动格式化代码的 Git pre-commit hook

# 获取项目根目录
ROOT_DIR="$(git rev-parse --show-toplevel)"

# 调用格式化脚本
"$ROOT_DIR/scripts/pre-commit-format.sh"
EOF

# 添加执行权限
chmod +x "$PRE_COMMIT_HOOK"

echo "✅ Pre-commit hook installed at: $PRE_COMMIT_HOOK"
echo ""
echo "📝 The hook will automatically:"
echo "   • Format Go files (using gofmt/goimports)"
echo "   • Format Frontend files (using prettier)"
echo "   • Check backend-nodejs ESLint (errors will block commit)"
echo ""
echo "🎯 To test the hook, try:"
echo "   git add <some files>"
echo "   git commit -m 'test'"
echo ""

