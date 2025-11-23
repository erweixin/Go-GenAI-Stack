#!/bin/bash

# Auto-fix lint issues for Go-GenAI-Stack
# 自动修复代码问题

set -e

cd "$(dirname "$0")/.."

echo "🔧 Auto-fixing lint issues..."
echo ""

cd backend

# 1. gofmt
echo "1️⃣ Formatting code (gofmt)..."
gofmt -w .
echo "✅ Code formatted"
echo ""

# 2. goimports
echo "2️⃣ Fixing imports (goimports)..."
if command -v goimports &> /dev/null; then
    goimports -w .
    echo "✅ Imports fixed"
else
    echo "⚠️  goimports not found"
    echo "Install with: go install golang.org/x/tools/cmd/goimports@latest"
fi
echo ""

# 3. go mod tidy
echo "3️⃣ Tidying go.mod..."
go mod tidy
echo "✅ go.mod tidied"
echo ""

cd ..

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All fixes applied!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the changes: git diff"
echo "   2. Run tests: cd backend && go test ./..."
echo "   3. Commit: git add . && git commit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
