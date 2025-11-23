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

# 3. golangci-lint auto-fix
echo "3️⃣ Running golangci-lint --fix..."
if command -v golangci-lint &> /dev/null; then
    golangci-lint run --fix --timeout=5m ./... || true
    echo "✅ golangci-lint fixes applied"
else
    echo "⚠️  golangci-lint not found"
    echo "Install with: curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b \$(go env GOPATH)/bin"
fi
echo ""

# 4. go mod tidy
echo "4️⃣ Tidying go.mod..."
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

