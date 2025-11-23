#!/bin/bash

# lint_domain.sh - 领域完整性检查工具
# 
# 用途：验证领域目录是否符合 Vibe-Coding-Friendly DDD 的要求
# 
# 使用：
#   ./scripts/lint_domain.sh task              # 检查单个领域
#   ./scripts/lint_domain.sh task chat llm     # 检查多个领域
#   ./scripts/lint_domain.sh --all             # 检查所有领域
#
# 检查项：
#   1. 6 个必需文件（README.md, glossary.md, rules.md, events.md, usecases.yaml, ai-metadata.json）
#   2. 目录结构（model/, repository/, handlers/, http/, tests/）
#   3. 代码与 usecases.yaml 的一致性
#   4. 测试覆盖率

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 全局变量
DOMAIN=""
TOTAL_SCORE=0
MAX_SCORE=100
ISSUES=0
WARNINGS=0

# 打印带颜色的消息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ISSUES++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 检查 6 个必需文件
check_required_files() {
    print_header "📄 必需文件检查"
    
    local files=(
        "README.md"
        "glossary.md"
        "rules.md"
        "events.md"
        "usecases.yaml"
        "ai-metadata.json"
    )
    
    local file_score=0
    local max_file_score=30
    
    for file in "${files[@]}"; do
        local filepath="domains/$DOMAIN/$file"
        if [ -f "$filepath" ]; then
            local lines=$(wc -l < "$filepath" | tr -d ' ')
            print_success "$file ($lines 行)"
            ((file_score += 5))
        else
            print_error "$file - 缺失"
        fi
    done
    
    TOTAL_SCORE=$((TOTAL_SCORE + file_score))
    echo ""
    echo "得分: $file_score/$max_file_score"
}

# 检查目录结构
check_directory_structure() {
    print_header "📦 目录结构检查"
    
    local dirs=(
        "model:领域模型"
        "repository:仓储接口和实现"
        "handlers:用例处理器"
        "http:HTTP 接口层"
        "http/dto:数据传输对象"
        "tests:测试"
    )
    
    local dir_score=0
    local max_dir_score=20
    
    for dir_info in "${dirs[@]}"; do
        local dir="${dir_info%%:*}"
        local desc="${dir_info##*:}"
        local dirpath="domains/$DOMAIN/$dir"
        
        if [ -d "$dirpath" ]; then
            local file_count=$(find "$dirpath" -type f -name "*.go" | wc -l | tr -d ' ')
            print_success "$dir/ - $desc ($file_count 个文件)"
            
            if [ "$dir" = "tests" ]; then
                if [ "$file_count" -gt 0 ]; then
                    ((dir_score += 5))
                else
                    print_warning "$dir/ 目录存在但为空"
                fi
            else
                ((dir_score += 3))
            fi
        else
            if [ "$dir" = "tests" ]; then
                print_error "$dir/ - 不存在（应有至少 6 个测试文件）"
            else
                print_error "$dir/ - 不存在"
            fi
        fi
    done
    
    TOTAL_SCORE=$((TOTAL_SCORE + dir_score))
    echo ""
    echo "得分: $dir_score/$max_dir_score"
}

# 检查 usecases.yaml 一致性
check_usecases_consistency() {
    print_header "🔍 usecases.yaml 一致性检查"
    
    local usecases_file="domains/$DOMAIN/usecases.yaml"
    
    if [ ! -f "$usecases_file" ]; then
        print_error "usecases.yaml 不存在，跳过一致性检查"
        return
    fi
    
    local consistency_score=0
    local max_consistency_score=30
    
    # 提取用例名称（简单的 grep 方式，适用于标准格式）
    local usecases=$(grep -E "^  [A-Z][a-zA-Z]+:" "$usecases_file" | sed 's/://g' | awk '{print $1}' | sort)
    local usecase_count=$(echo "$usecases" | wc -l | tr -d ' ')
    
    if [ "$usecase_count" -gt 0 ]; then
        print_info "发现 $usecase_count 个用例声明"
        ((consistency_score += 5))
        
        # 检查每个用例是否有对应的 handler
        local handlers_dir="domains/$DOMAIN/handlers"
        local missing_handlers=0
        
        for usecase in $usecases; do
            # 转换 CamelCase 到 snake_case
            # 例如：CreateTask -> create_task
            local handler_file=$(echo "$usecase" | perl -pe 's/([A-Z])/_\l$1/g; s/^_//')
            local handler_path="$handlers_dir/${handler_file}.handler.go"
            
            if [ -f "$handler_path" ]; then
                print_success "用例 $usecase → handler 存在"
                ((consistency_score += 2))
            else
                print_warning "用例 $usecase → handler 缺失 ($handler_path)"
                ((missing_handlers++))
            fi
        done
        
        if [ "$missing_handlers" -eq 0 ]; then
            print_info "所有用例都有对应的 handler"
            ((consistency_score += 5))
        fi
    else
        print_warning "usecases.yaml 中没有找到用例声明"
    fi
    
    # 统计 errors 数量
    local error_count=$(grep -c "code:" "$usecases_file" 2>/dev/null || echo "0")
    if [ "$error_count" -gt 0 ]; then
        print_info "声明了 $error_count 个错误码"
        ((consistency_score += 3))
    fi
    
    TOTAL_SCORE=$((TOTAL_SCORE + consistency_score))
    echo ""
    echo "得分: $consistency_score/$max_consistency_score"
}

# 检查测试覆盖率
check_test_coverage() {
    print_header "🧪 测试覆盖率检查"
    
    local test_score=0
    local max_test_score=20
    
    local tests_dir="domains/$DOMAIN/tests"
    
    if [ ! -d "$tests_dir" ]; then
        print_error "tests/ 目录不存在"
        echo ""
        echo "得分: 0/$max_test_score"
        return
    fi
    
    local test_files=$(find "$tests_dir" -name "*_test.go" 2>/dev/null)
    local test_count=$(echo "$test_files" | grep -c ".go" || echo "0")
    
    if [ "$test_count" -eq 0 ]; then
        print_error "没有找到测试文件（*_test.go）"
        echo ""
        echo "得分: 0/$max_test_score"
        return
    fi
    
    print_success "找到 $test_count 个测试文件"
    ((test_score += 5))
    
    # 统计测试函数数量
    local test_func_count=0
    for test_file in $test_files; do
        if [ -f "$test_file" ]; then
            local funcs=$(grep -c "^func Test" "$test_file" 2>/dev/null || echo "0")
            funcs=${funcs:-0}  # 确保不是空字符串
            test_func_count=$((test_func_count + funcs))
        fi
    done
    
    if [ "$test_func_count" -gt 0 ] 2>/dev/null; then
        print_success "包含 $test_func_count 个测试函数"
        ((test_score += 5))
        
        # 根据测试数量给分
        if [ "$test_func_count" -ge 20 ]; then
            print_success "测试覆盖率良好（20+ 个测试）"
            ((test_score += 10))
        elif [ "$test_func_count" -ge 10 ]; then
            print_info "测试覆盖率中等（10+ 个测试）"
            ((test_score += 7))
        elif [ "$test_func_count" -ge 5 ]; then
            print_warning "测试覆盖率较低（5+ 个测试）"
            ((test_score += 3))
        else
            print_warning "测试覆盖率很低（<5 个测试）"
        fi
    else
        print_error "测试文件存在但没有测试函数"
    fi
    
    TOTAL_SCORE=$((TOTAL_SCORE + test_score))
    echo ""
    echo "得分: $test_score/$max_test_score"
}

# 生成总结报告
generate_summary() {
    print_header "📊 总体评分"
    
    # 计算评分等级
    local percentage=$((TOTAL_SCORE * 100 / MAX_SCORE))
    local grade=""
    local color=""
    
    if [ "$percentage" -ge 90 ]; then
        grade="优秀 (A)"
        color="${GREEN}"
    elif [ "$percentage" -ge 80 ]; then
        grade="良好 (B)"
        color="${GREEN}"
    elif [ "$percentage" -ge 70 ]; then
        grade="中等 (C)"
        color="${YELLOW}"
    elif [ "$percentage" -ge 60 ]; then
        grade="及格 (D)"
        color="${YELLOW}"
    else
        grade="不及格 (F)"
        color="${RED}"
    fi
    
    echo -e "${color}总分: $TOTAL_SCORE / $MAX_SCORE ($percentage%)${NC}"
    echo -e "${color}等级: $grade${NC}"
    echo ""
    echo "统计:"
    echo "  - 错误 (❌): $ISSUES"
    echo "  - 警告 (⚠️): $WARNINGS"
    echo ""
    
    # 给出建议
    if [ "$percentage" -lt 80 ]; then
        echo -e "${YELLOW}建议：${NC}"
        
        if [ ! -d "domains/$DOMAIN/tests" ] || [ "$(find domains/$DOMAIN/tests -name "*_test.go" | wc -l)" -eq 0 ]; then
            echo "  1. 立即添加测试 - 这是最严重的缺失"
        fi
        
        if [ "$ISSUES" -gt 0 ]; then
            echo "  2. 修复上述 $ISSUES 个错误"
        fi
        
        if [ "$WARNINGS" -gt 0 ]; then
            echo "  3. 处理 $WARNINGS 个警告"
        fi
        
        echo ""
        echo "参考: docs/Core/architecture-audit.md"
    else
        echo -e "${GREEN}✅ 该领域符合 Vibe-Coding-Friendly DDD 标准！${NC}"
    fi
    
    echo ""
}

# 检查单个领域
lint_domain() {
    local domain=$1
    DOMAIN=$domain
    TOTAL_SCORE=0
    ISSUES=0
    WARNINGS=0
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  检查领域: $domain"
    echo "════════════════════════════════════════════════════════════════"
    
    # 检查领域目录是否存在
    if [ ! -d "domains/$domain" ]; then
        print_error "领域目录不存在: domains/$domain"
        return 1
    fi
    
    # 执行各项检查
    check_required_files
    check_directory_structure
    check_usecases_consistency
    check_test_coverage
    generate_summary
    
    # 如果评分低于 60，返回非零退出码
    local percentage=$((TOTAL_SCORE * 100 / MAX_SCORE))
    if [ "$percentage" -lt 60 ]; then
        return 1
    fi
    
    return 0
}

# 列出所有领域
list_domains() {
    echo "可用的领域:"
    for dir in domains/*/; do
        if [ -d "$dir" ] && [ "$(basename "$dir")" != "shared" ]; then
            echo "  - $(basename "$dir")"
        fi
    done
}

# 主函数
main() {
    # 检查是否在正确的目录
    if [ ! -d "domains" ]; then
        echo -e "${RED}错误: 请在 backend 目录下运行此脚本${NC}"
        echo "用法: cd backend && ./scripts/lint_domain.sh <domain>"
        exit 1
    fi
    
    # 解析参数
    if [ $# -eq 0 ]; then
        echo "用法: ./scripts/lint_domain.sh <domain> [domain2 ...]"
        echo "      ./scripts/lint_domain.sh --all"
        echo "      ./scripts/lint_domain.sh --list"
        echo ""
        list_domains
        exit 1
    fi
    
    if [ "$1" = "--list" ]; then
        list_domains
        exit 0
    fi
    
    if [ "$1" = "--all" ]; then
        # 检查所有领域
        local all_domains=()
        for dir in domains/*/; do
            if [ -d "$dir" ] && [ "$(basename "$dir")" != "shared" ]; then
                all_domains+=("$(basename "$dir")")
            fi
        done
        
        local failed_domains=()
        for domain in "${all_domains[@]}"; do
            if ! lint_domain "$domain"; then
                failed_domains+=("$domain")
            fi
        done
        
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "  总结"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        echo "检查了 ${#all_domains[@]} 个领域"
        
        if [ ${#failed_domains[@]} -eq 0 ]; then
            echo -e "${GREEN}✅ 所有领域都通过检查！${NC}"
            exit 0
        else
            echo -e "${RED}❌ ${#failed_domains[@]} 个领域未通过检查:${NC}"
            for domain in "${failed_domains[@]}"; do
                echo "  - $domain"
            done
            exit 1
        fi
    fi
    
    # 检查指定的领域
    local failed=0
    for domain in "$@"; do
        if ! lint_domain "$domain"; then
            failed=1
        fi
    done
    
    exit $failed
}

# 运行主函数
main "$@"

