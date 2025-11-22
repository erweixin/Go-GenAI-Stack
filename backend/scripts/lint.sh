#!/bin/bash

# lint.sh
# 代码风格和质量检查
#
# 使用方式：
#   ./scripts/lint.sh              # 运行所有检查
#   ./scripts/lint.sh --fix        # 自动修复可修复的问题

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 检查工具是否安装
check_tools() {
    if ! command -v golangci-lint &> /dev/null; then
        error "golangci-lint is not installed!"
        info "Install: brew install golangci-lint"
        info "Or: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"
        exit 1
    fi
}

# Go fmt
run_gofmt() {
    info "Running gofmt..."
    cd "${BACKEND_DIR}"
    
    if [ "$1" = "--fix" ]; then
        gofmt -w .
        info "gofmt: Fixed ✅"
    else
        local unformatted=$(gofmt -l .)
        if [ -z "$unformatted" ]; then
            info "gofmt: Passed ✅"
        else
            error "gofmt: Failed ❌"
            echo "Unformatted files:"
            echo "$unformatted"
            return 1
        fi
    fi
}

# Go vet
run_govet() {
    info "Running go vet..."
    cd "${BACKEND_DIR}"
    
    if go vet ./...; then
        info "go vet: Passed ✅"
    else
        error "go vet: Failed ❌"
        return 1
    fi
}

# golangci-lint
run_golangcilint() {
    info "Running golangci-lint..."
    cd "${BACKEND_DIR}"
    
    if [ "$1" = "--fix" ]; then
        golangci-lint run --fix
        info "golangci-lint: Fixed ✅"
    else
        if golangci-lint run; then
            info "golangci-lint: Passed ✅"
        else
            error "golangci-lint: Failed ❌"
            return 1
        fi
    fi
}

# 检查命名规范
check_naming() {
    info "Checking naming conventions..."
    cd "${BACKEND_DIR}"
    
    # 检查文件命名（应该是小写+下划线）
    local bad_names=$(find domains -name "*.go" | grep -E "[A-Z]" || true)
    if [ -n "$bad_names" ]; then
        warn "Files with uppercase characters found (should be snake_case):"
        echo "$bad_names"
    else
        info "Naming conventions: Passed ✅"
    fi
}

# 检查依赖
check_dependencies() {
    info "Checking dependencies..."
    cd "${BACKEND_DIR}"
    
    go mod tidy
    if git diff --exit-code go.mod go.sum; then
        info "Dependencies: Up to date ✅"
    else
        warn "go.mod or go.sum has changes, please commit them"
    fi
}

# 主函数
main() {
    local fix_mode=false
    
    if [ "$1" = "--fix" ]; then
        fix_mode=true
        info "Running in FIX mode..."
    fi
    
    check_tools
    
    info "Starting code quality checks..."
    echo ""
    
    local exit_code=0
    
    if [ "$fix_mode" = true ]; then
        run_gofmt --fix
        run_golangcilint --fix
        run_govet || exit_code=1
    else
        run_gofmt || exit_code=1
        run_govet || exit_code=1
        run_golangcilint || exit_code=1
    fi
    
    check_naming
    check_dependencies
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        info "All checks passed! 🎉"
    else
        error "Some checks failed!"
        info "Run with --fix to auto-fix some issues: ./scripts/lint.sh --fix"
    fi
    
    exit $exit_code
}

main "$@"

