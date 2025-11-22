#!/bin/bash

# validate_structure.sh
# 验证领域结构完整性
#
# 检查每个领域是否有必需的文件和目录
# 确保符合 Vibe-Coding-Friendly DDD 规范
#
# 使用方式：
#   ./scripts/validate_structure.sh        # 验证所有领域
#   ./scripts/validate_structure.sh chat   # 只验证 chat 领域

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOMAINS_DIR="${BACKEND_DIR}/domains"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# 统计
TOTAL_DOMAINS=0
PASSED_DOMAINS=0
FAILED_DOMAINS=0
TOTAL_ERRORS=0
TOTAL_WARNINGS=0

# 验证领域结构
validate_domain() {
    local domain=$1
    local domain_path="${DOMAINS_DIR}/${domain}"
    local has_errors=false
    
    echo ""
    echo "=== Validating domain: ${domain} ==="
    echo ""
    
    TOTAL_DOMAINS=$((TOTAL_DOMAINS + 1))
    
    # 1. 检查必需文件
    local required_files=(
        "README.md"
        "glossary.md"
        "rules.md"
        "events.md"
        "usecases.yaml"
        "ai-metadata.json"
    )
    
    echo "📄 Checking required files..."
    for file in "${required_files[@]}"; do
        if [ -f "${domain_path}/${file}" ]; then
            info "${file} exists"
        else
            error "${file} is MISSING"
            has_errors=true
            TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
        fi
    done
    
    # 2. 检查目录结构
    local required_dirs=(
        "model"
        "handlers"
        "http/dto"
        "repository"
    )
    
    echo ""
    echo "📁 Checking directory structure..."
    for dir in "${required_dirs[@]}"; do
        if [ -d "${domain_path}/${dir}" ]; then
            info "${dir}/ exists"
        else
            warn "${dir}/ is missing (recommended)"
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
        fi
    done
    
    # 3. 检查 tests 目录
    echo ""
    echo "🧪 Checking tests..."
    if [ -d "${domain_path}/tests" ]; then
        info "tests/ directory exists"
        
        # 检查是否有测试文件
        test_count=$(find "${domain_path}/tests" -name "*.test.go" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$test_count" -gt 0 ]; then
            info "Found ${test_count} test file(s)"
        else
            warn "tests/ directory exists but no test files found"
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
        fi
    else
        error "tests/ directory is MISSING"
        has_errors=true
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
    
    # 4. 验证 usecases.yaml 格式
    echo ""
    echo "📋 Validating usecases.yaml..."
    if [ -f "${domain_path}/usecases.yaml" ]; then
        if command -v yq &> /dev/null; then
            if yq eval '.usecases' "${domain_path}/usecases.yaml" > /dev/null 2>&1; then
                info "usecases.yaml is valid YAML"
                
                # 统计用例数量
                usecase_count=$(yq eval '.usecases | keys | length' "${domain_path}/usecases.yaml")
                info "Found ${usecase_count} use case(s)"
            else
                error "usecases.yaml has INVALID YAML syntax"
                has_errors=true
                TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
            fi
        else
            warn "Install 'yq' for YAML validation: brew install yq"
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
        fi
    fi
    
    # 5. 验证 ai-metadata.json 格式
    echo ""
    echo "🤖 Validating ai-metadata.json..."
    if [ -f "${domain_path}/ai-metadata.json" ]; then
        if command -v jq &> /dev/null; then
            if jq empty "${domain_path}/ai-metadata.json" > /dev/null 2>&1; then
                info "ai-metadata.json is valid JSON"
            else
                error "ai-metadata.json has INVALID JSON syntax"
                has_errors=true
                TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
            fi
        else
            warn "Install 'jq' for JSON validation: brew install jq"
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
        fi
    fi
    
    # 6. 检查 handlers 和 tests 的对应关系
    echo ""
    echo "🔗 Checking handler-test correspondence..."
    if [ -d "${domain_path}/handlers" ] && [ -d "${domain_path}/tests" ]; then
        for handler_file in "${domain_path}/handlers"/*.handler.go; do
            if [ -f "$handler_file" ]; then
                handler_name=$(basename "$handler_file" .handler.go)
                test_file="${domain_path}/tests/${handler_name}.test.go"
                
                if [ -f "$test_file" ]; then
                    info "${handler_name}: handler ↔ test"
                else
                    warn "${handler_name}: handler exists but NO test file"
                    TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
                fi
            fi
        done
    fi
    
    # 7. 统计代码文件
    echo ""
    echo "📊 Statistics..."
    model_count=$(find "${domain_path}/model" -name "*.go" 2>/dev/null | wc -l | tr -d ' ')
    handler_count=$(find "${domain_path}/handlers" -name "*.go" 2>/dev/null | wc -l | tr -d ' ')
    dto_count=$(find "${domain_path}/http/dto" -name "*.go" 2>/dev/null | wc -l | tr -d ' ')
    
    info "Models: ${model_count}"
    info "Handlers: ${handler_count}"
    info "DTOs: ${dto_count}"
    
    # 汇总结果
    echo ""
    if [ "$has_errors" = false ]; then
        info "Domain '${domain}' passed validation ✨"
        PASSED_DOMAINS=$((PASSED_DOMAINS + 1))
    else
        error "Domain '${domain}' has validation errors ❌"
        FAILED_DOMAINS=$((FAILED_DOMAINS + 1))
    fi
}

# 打印汇总报告
print_summary() {
    echo ""
    echo "============================================"
    echo "          Validation Summary"
    echo "============================================"
    echo ""
    echo "Total domains:   ${TOTAL_DOMAINS}"
    echo "Passed:          ${PASSED_DOMAINS} ✓"
    echo "Failed:          ${FAILED_DOMAINS} ✗"
    echo ""
    echo "Total errors:    ${TOTAL_ERRORS}"
    echo "Total warnings:  ${TOTAL_WARNINGS}"
    echo ""
    
    if [ "$FAILED_DOMAINS" -eq 0 ] && [ "$TOTAL_ERRORS" -eq 0 ]; then
        info "All domains are well-structured! 🎉"
        return 0
    else
        error "Some domains need attention!"
        return 1
    fi
}

# 主函数
main() {
    local target_domain=$1
    
    echo "🔍 Starting structure validation..."
    echo ""
    
    if [ -n "$target_domain" ]; then
        # 只验证指定领域
        if [ ! -d "${DOMAINS_DIR}/${target_domain}" ]; then
            error "Domain '${target_domain}' does not exist!"
            exit 1
        fi
        
        validate_domain "$target_domain"
    else
        # 验证所有领域
        for domain_dir in "${DOMAINS_DIR}"/*; do
            if [ -d "$domain_dir" ]; then
                domain=$(basename "$domain_dir")
                if [ "$domain" != "shared" ]; then
                    validate_domain "$domain"
                fi
            fi
        done
    fi
    
    print_summary
}

main "$@"

