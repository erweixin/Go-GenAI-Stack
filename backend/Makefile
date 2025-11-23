.PHONY: help lint lint-fix test test-coverage fmt vet staticcheck tools

# 默认目标：显示帮助
help:
	@echo "Go-GenAI-Stack Backend Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make lint          - Run all lint checks"
	@echo "  make lint-fix      - Auto-fix lint issues"
	@echo "  make test          - Run all tests"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make fmt           - Format code"
	@echo "  make vet           - Run go vet"
	@echo "  make staticcheck   - Run staticcheck"
	@echo "  make tools         - Install development tools"
	@echo "  make check         - Run all checks (lint + test)"

# 安装开发工具
tools:
	@echo "🔧 Installing development tools..."
	@go install golang.org/x/tools/cmd/goimports@latest
	@go install honnef.co/go/tools/cmd/staticcheck@latest
	@go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
	@echo "✅ Tools installed"

# 代码格式化
fmt:
	@echo "📐 Formatting code..."
	@gofmt -w .
	@if command -v goimports >/dev/null 2>&1; then \
		goimports -w .; \
	fi
	@echo "✅ Code formatted"

# Go vet 检查
vet:
	@echo "🔍 Running go vet..."
	@go vet ./...
	@echo "✅ go vet passed"

# Staticcheck 检查
staticcheck:
	@echo "🔍 Running staticcheck..."
	@if command -v staticcheck >/dev/null 2>&1; then \
		staticcheck ./...; \
	else \
		echo "⚠️  staticcheck not found, run 'make tools' first"; \
		exit 1; \
	fi
	@echo "✅ staticcheck passed"

# Lint 检查
lint: fmt vet staticcheck
	@echo "🔍 Running golangci-lint..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run --timeout=5m ./...; \
	else \
		echo "⚠️  golangci-lint not found"; \
		echo "Install with: curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b \$$(go env GOPATH)/bin"; \
		exit 1; \
	fi
	@echo "✅ All lint checks passed"

# 自动修复 Lint 问题
lint-fix:
	@echo "🔧 Auto-fixing lint issues..."
	@gofmt -w .
	@if command -v goimports >/dev/null 2>&1; then \
		goimports -w .; \
	fi
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run --fix --timeout=5m ./...; \
	fi
	@go mod tidy
	@echo "✅ All fixes applied"

# 运行测试
test:
	@echo "🧪 Running tests..."
	@go test -v -race ./...
	@echo "✅ Tests passed"

# 运行测试并生成覆盖率
test-coverage:
	@echo "🧪 Running tests with coverage..."
	@go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
	@go tool cover -func=coverage.out | grep total
	@echo ""
	@echo "📊 Coverage report generated: coverage.out"
	@echo "   View with: go tool cover -html=coverage.out"

# 运行所有检查
check: lint test
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "✅ All checks passed!"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

