#!/bin/bash

# Lint script for Go-GenAI-Stack
# 运行所有代码检查

set -e

cd "$(dirname "$0")/.."

echo "🔍 Running lint checks..."
echo ""

cd backend

# 1. gofmt
echo "1️⃣ Checking code format (gofmt)..."
UNFORMATTED=$(gofmt -l .)
if [ -n "$UNFORMATTED" ]; then
    echo "❌ The following files are not formatted:"
    echo "$UNFORMATTED"
    echo ""
    echo "Run: gofmt -w ."
    exit 1
fi
echo "✅ All files are properly formatted"
echo ""

# 2. goimports
echo "2️⃣ Checking imports (goimports)..."
if command -v goimports &> /dev/null; then
    UNIMPORTED=$(goimports -l .)
    if [ -n "$UNIMPORTED" ]; then
        echo "❌ The following files have import issues:"
        echo "$UNIMPORTED"
        echo ""
        echo "Run: goimports -w ."
        exit 1
    fi
    echo "✅ All imports are correct"
else
    echo "⚠️  goimports not found, skipping"
fi
echo ""

# 3. go vet
echo "3️⃣ Running go vet..."
if go vet ./...; then
    echo "✅ go vet passed"
else
    echo "❌ go vet failed"
    exit 1
fi
echo ""

# 4. staticcheck
echo "4️⃣ Running staticcheck..."
if command -v staticcheck &> /dev/null; then
    if staticcheck ./...; then
        echo "✅ staticcheck passed"
    else
        echo "❌ staticcheck failed"
        exit 1
    fi
else
    echo "⚠️  staticcheck not found"
    echo "Install with: go install honnef.co/go/tools/cmd/staticcheck@latest"
fi
echo ""

# 5. golangci-lint
echo "5️⃣ Running golangci-lint..."
if command -v golangci-lint &> /dev/null; then
    if golangci-lint run --timeout=5m ./...; then
        echo "✅ golangci-lint passed"
    else
        echo "❌ golangci-lint failed"
        exit 1
    fi
else
    echo "⚠️  golangci-lint not found"
    echo "Install with: curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b \$(go env GOPATH)/bin"
fi
echo ""

cd ..

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All lint checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

