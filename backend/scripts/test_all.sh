#!/bin/bash

# test_all.sh
# 运行所有测试并生成覆盖率报告
#
# 使用方式：
#   ./scripts/test_all.sh              # 运行所有测试
#   ./scripts/test_all.sh chat         # 只运行 chat 领域测试
#   ./scripts/test_all.sh --coverage   # 生成覆盖率报告

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COVERAGE_DIR="${BACKEND_DIR}/coverage"

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

# 创建覆盖率目录
mkdir -p "${COVERAGE_DIR}"

# 运行测试
run_tests() {
    local target=$1
    local with_coverage=$2
    
    cd "${BACKEND_DIR}"
    
    if [ -n "$target" ]; then
        info "Running tests for domain: ${target}"
        if [ "$with_coverage" = true ]; then
            go test -v -race -coverprofile="${COVERAGE_DIR}/${target}.out" "./domains/${target}/..." || return 1
        else
            go test -v -race "./domains/${target}/..." || return 1
        fi
    else
        info "Running all tests..."
        if [ "$with_coverage" = true ]; then
            go test -v -race -coverprofile="${COVERAGE_DIR}/coverage.out" ./... || return 1
        else
            go test -v -race ./... || return 1
        fi
    fi
}

# 生成覆盖率报告
generate_coverage_report() {
    info "Generating coverage report..."
    
    if [ -f "${COVERAGE_DIR}/coverage.out" ]; then
        go tool cover -html="${COVERAGE_DIR}/coverage.out" -o "${COVERAGE_DIR}/coverage.html"
        go tool cover -func="${COVERAGE_DIR}/coverage.out" | tail -n 1
        
        info "Coverage report: ${COVERAGE_DIR}/coverage.html"
        
        # 在浏览器中打开（macOS）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "${COVERAGE_DIR}/coverage.html"
        fi
    else
        warn "No coverage data found"
    fi
}

# 主函数
main() {
    local target_domain=""
    local with_coverage=false
    
    # 解析参数
    for arg in "$@"; do
        case $arg in
            --coverage|-c)
                with_coverage=true
                ;;
            *)
                target_domain=$arg
                ;;
        esac
    done
    
    info "Starting tests..."
    
    if run_tests "$target_domain" "$with_coverage"; then
        info "All tests passed! ✅"
        
        if [ "$with_coverage" = true ]; then
            generate_coverage_report
        fi
        
        exit 0
    else
        error "Some tests failed! ❌"
        exit 1
    fi
}

main "$@"

