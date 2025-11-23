#!/bin/bash

# Setup development tools for Go-GenAI-Stack
# 安装开发所需的所有工具

set -e

echo "🔧 Setting up development tools..."
echo ""

# 1. goimports
echo "1️⃣ Installing goimports..."
if command -v goimports &> /dev/null; then
    echo "✅ goimports already installed"
else
    go install golang.org/x/tools/cmd/goimports@latest
    echo "✅ goimports installed"
fi
echo ""

# 2. staticcheck
echo "2️⃣ Installing staticcheck..."
if command -v staticcheck &> /dev/null; then
    echo "✅ staticcheck already installed"
else
    go install honnef.co/go/tools/cmd/staticcheck@latest
    echo "✅ staticcheck installed"
fi
echo ""

# 3. fieldalignment
echo "3️⃣ Installing fieldalignment..."
if command -v fieldalignment &> /dev/null; then
    echo "✅ fieldalignment already installed"
else
    go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
    echo "✅ fieldalignment installed"
fi
echo ""

# 4. golangci-lint
echo "4️⃣ Installing golangci-lint..."
if command -v golangci-lint &> /dev/null; then
    echo "✅ golangci-lint already installed"
    golangci-lint version
else
    echo "Installing golangci-lint..."
    curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.61.0
    echo "✅ golangci-lint installed"
fi
echo ""

# 5. 设置 Git hooks
echo "5️⃣ Setting up Git hooks..."
HOOKS_DIR=".git/hooks"
if [ -f "$HOOKS_DIR/pre-commit" ]; then
    echo "✅ pre-commit hook already exists"
else
    echo "⚠️  pre-commit hook not found"
    echo "It should be created at: $HOOKS_DIR/pre-commit"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All development tools installed!"
echo ""
echo "📝 Installed tools:"
echo "   ✓ goimports     - $(which goimports || echo 'not found')"
echo "   ✓ staticcheck   - $(which staticcheck || echo 'not found')"
echo "   ✓ fieldalignment - $(which fieldalignment || echo 'not found')"
echo "   ✓ golangci-lint - $(which golangci-lint || echo 'not found')"
echo ""
echo "🎯 Next steps:"
echo "   1. Run lint checks: ./scripts/lint.sh"
echo "   2. Auto-fix issues: ./scripts/lint-fix.sh"
echo "   3. Commit changes with automatic checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

