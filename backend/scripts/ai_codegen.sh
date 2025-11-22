#!/bin/bash

# ai_codegen.sh
# AI 辅助代码生成工具
#
# 读取领域的显式知识文件（README、glossary、rules、usecases.yaml）
# 生成 handler 和测试代码骨架
#
# 使用方式：
#   ./scripts/ai_codegen.sh --domain chat --usecase ExportConversation
#   ./scripts/ai_codegen.sh --domain llm --usecase SelectModel
#   ./scripts/ai_codegen.sh --domain chat --list  # 列出所有用例

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOMAINS_DIR="${BACKEND_DIR}/domains"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 显示使用帮助
show_usage() {
    cat << EOF
${GREEN}AI 代码生成工具${NC}

使用方式:
  $0 --domain <domain> --usecase <usecase>
  $0 --domain <domain> --list

选项:
  --domain, -d    领域名称 (如: chat, llm, monitoring)
  --usecase, -u   用例名称 (如: ExportConversation, SelectModel)
  --list, -l      列出领域中的所有用例
  --help, -h      显示此帮助信息

示例:
  # 为 chat 领域生成 ExportConversation 用例的代码
  $0 --domain chat --usecase ExportConversation
  
  # 列出 llm 领域的所有用例
  $0 --domain llm --list

EOF
}

# 解析命令行参数
parse_args() {
    DOMAIN=""
    USECASE=""
    LIST_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -u|--usecase)
                USECASE="$2"
                shift 2
                ;;
            -l|--list)
                LIST_MODE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 验证必需参数
    if [ -z "$DOMAIN" ]; then
        error "Domain is required!"
        show_usage
        exit 1
    fi
    
    if [ "$LIST_MODE" = false ] && [ -z "$USECASE" ]; then
        error "Usecase is required (or use --list to list all usecases)!"
        show_usage
        exit 1
    fi
}

# 检查领域是否存在
check_domain_exists() {
    local domain_path="${DOMAINS_DIR}/${DOMAIN}"
    
    if [ ! -d "$domain_path" ]; then
        error "Domain '${DOMAIN}' does not exist!"
        error "Available domains:"
        ls -1 "${DOMAINS_DIR}" | grep -v "shared" | sed 's/^/  /'
        exit 1
    fi
    
    # 检查必需文件
    local required_files=("README.md" "glossary.md" "rules.md" "events.md" "usecases.yaml" "ai-metadata.json")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${domain_path}/${file}" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        warn "Domain '${DOMAIN}' is missing some required files:"
        printf '  %s\n' "${missing_files[@]}"
        warn "Code generation may not work properly!"
    fi
}

# 列出领域中的所有用例
list_usecases() {
    local usecases_file="${DOMAINS_DIR}/${DOMAIN}/usecases.yaml"
    
    if [ ! -f "$usecases_file" ]; then
        error "usecases.yaml not found in domain '${DOMAIN}'"
        exit 1
    fi
    
    info "Available usecases in '${DOMAIN}' domain:"
    echo ""
    
    # 使用 yq 解析 YAML（如果安装了）
    if command -v yq &> /dev/null; then
        yq eval '.usecases | keys | .[]' "$usecases_file" | sed 's/^/  • /'
    else
        # 简单解析（不完美，但可用）
        grep -E '^\s+[A-Z][a-zA-Z]+:' "$usecases_file" | sed 's/://g' | sed 's/^/  • /'
    fi
    
    echo ""
    info "Use: $0 --domain ${DOMAIN} --usecase <usecase_name>"
}

# 读取领域知识文件
read_domain_knowledge() {
    local domain_path="${DOMAINS_DIR}/${DOMAIN}"
    
    debug "Reading domain knowledge files..."
    
    README_CONTENT=""
    GLOSSARY_CONTENT=""
    RULES_CONTENT=""
    EVENTS_CONTENT=""
    USECASES_CONTENT=""
    AI_METADATA_CONTENT=""
    
    [ -f "${domain_path}/README.md" ] && README_CONTENT=$(cat "${domain_path}/README.md")
    [ -f "${domain_path}/glossary.md" ] && GLOSSARY_CONTENT=$(cat "${domain_path}/glossary.md")
    [ -f "${domain_path}/rules.md" ] && RULES_CONTENT=$(cat "${domain_path}/rules.md")
    [ -f "${domain_path}/events.md" ] && EVENTS_CONTENT=$(cat "${domain_path}/events.md")
    [ -f "${domain_path}/usecases.yaml" ] && USECASES_CONTENT=$(cat "${domain_path}/usecases.yaml")
    [ -f "${domain_path}/ai-metadata.json" ] && AI_METADATA_CONTENT=$(cat "${domain_path}/ai-metadata.json")
    
    debug "Knowledge files loaded"
}

# 提取用例定义
extract_usecase_definition() {
    local usecases_file="${DOMAINS_DIR}/${DOMAIN}/usecases.yaml"
    
    if [ ! -f "$usecases_file" ]; then
        error "usecases.yaml not found!"
        exit 1
    fi
    
    # 使用 yq 提取用例（如果安装了）
    if command -v yq &> /dev/null; then
        USECASE_DEF=$(yq eval ".usecases.${USECASE}" "$usecases_file")
        
        if [ "$USECASE_DEF" = "null" ]; then
            error "Usecase '${USECASE}' not found in usecases.yaml"
            info "Available usecases:"
            yq eval '.usecases | keys | .[]' "$usecases_file" | sed 's/^/  • /'
            exit 1
        fi
    else
        # 简单提取（不完美）
        USECASE_DEF=$(awk "/^  ${USECASE}:/,/^  [A-Z]/" "$usecases_file")
        
        if [ -z "$USECASE_DEF" ]; then
            error "Usecase '${USECASE}' not found in usecases.yaml"
            error "Please install 'yq' for better parsing: brew install yq"
            exit 1
        fi
    fi
    
    debug "Usecase definition extracted"
}

# 生成 handler 文件
generate_handler() {
    local domain_path="${DOMAINS_DIR}/${DOMAIN}"
    local handler_file="${domain_path}/handlers/$(echo ${USECASE} | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//').handler.go"
    
    if [ -f "$handler_file" ]; then
        warn "Handler file already exists: $handler_file"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Handler generation cancelled"
            return
        fi
    fi
    
    # 创建 handlers 目录（如果不存在）
    mkdir -p "${domain_path}/handlers"
    
    # 生成 handler 代码骨架
    cat > "$handler_file" << 'EOF'
package handlers

import (
    "context"
    "fmt"

    "github.com/erweixin/go-genai-stack/domains/{{DOMAIN}}/model"
    "github.com/erweixin/go-genai-stack/domains/{{DOMAIN}}/repository"
    "github.com/erweixin/go-genai-stack/domains/shared/errors"
)

// {{USECASE}}Handler {{USECASE}} 用例处理器
//
// UseCase: {{USECASE}}
// Source: domains/{{DOMAIN}}/usecases.yaml
//
// Description:
//   TODO: 从 usecases.yaml 复制描述
//
// Steps:
//   TODO: 从 usecases.yaml 复制步骤
//
// Example:
//   handler := New{{USECASE}}Handler(repo)
//   result, err := handler.Handle(ctx, req)
type {{USECASE}}Handler struct {
    // TODO: 添加依赖（repository, service 等）
    // repo repository.SomeRepository
}

// New{{USECASE}}Handler 创建处理器
func New{{USECASE}}Handler(/* TODO: 添加依赖参数 */) *{{USECASE}}Handler {
    return &{{USECASE}}Handler{
        // TODO: 初始化依赖
    }
}

// {{USECASE}}Request 请求参数
type {{USECASE}}Request struct {
    // TODO: 从 usecases.yaml 的 inputs 中添加字段
}

// {{USECASE}}Response 响应结果
type {{USECASE}}Response struct {
    // TODO: 从 usecases.yaml 的 outputs 中添加字段
}

// Handle 执行 {{USECASE}} 用例
func (h *{{USECASE}}Handler) Handle(ctx context.Context, req *{{USECASE}}Request) (*{{USECASE}}Response, error) {
    // TODO: 实现业务逻辑
    // 参考 usecases.yaml 中的 steps
    
    // Step 1: TODO
    // Step 2: TODO
    // Step 3: TODO
    
    // 错误处理：参考 usecases.yaml 中的 errors
    // 失败策略：参考 usecases.yaml 中的 on_fail
    
    return &{{USECASE}}Response{
        // TODO: 填充响应
    }, nil
}
EOF

    # 替换占位符
    sed -i '' "s/{{DOMAIN}}/${DOMAIN}/g" "$handler_file"
    sed -i '' "s/{{USECASE}}/${USECASE}/g" "$handler_file"
    
    info "Handler generated: $handler_file"
}

# 生成测试文件
generate_test() {
    local domain_path="${DOMAINS_DIR}/${DOMAIN}"
    local test_file="${domain_path}/tests/$(echo ${USECASE} | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//').test.go"
    
    if [ -f "$test_file" ]; then
        warn "Test file already exists: $test_file"
        read -p "Overwrite? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Test generation cancelled"
            return
        fi
    fi
    
    # 创建 tests 目录（如果不存在）
    mkdir -p "${domain_path}/tests"
    
    # 生成测试代码骨架
    cat > "$test_file" << 'EOF'
package tests

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/erweixin/go-genai-stack/domains/{{DOMAIN}}/handlers"
)

// Test{{USECASE}}_Success 测试成功场景
func Test{{USECASE}}_Success(t *testing.T) {
    // TODO: 准备测试数据
    ctx := context.Background()
    
    // TODO: 创建 handler
    // handler := handlers.New{{USECASE}}Handler(mockRepo)
    
    // TODO: 执行测试
    // req := &handlers.{{USECASE}}Request{
    //     // TODO: 填充请求参数
    // }
    // resp, err := handler.Handle(ctx, req)
    
    // TODO: 断言结果
    // assert.NoError(t, err)
    // assert.NotNil(t, resp)
    // assert.Equal(t, expectedValue, resp.SomeField)
}

// Test{{USECASE}}_Errors 测试错误场景
func Test{{USECASE}}_Errors(t *testing.T) {
    tests := []struct {
        name        string
        setupMock   func()
        request     *handlers.{{USECASE}}Request
        expectedErr error
    }{
        // TODO: 从 usecases.yaml 的 errors 中添加测试用例
        {
            name: "invalid_input",
            // TODO: 实现
        },
        {
            name: "not_found",
            // TODO: 实现
        },
        // TODO: 添加更多错误场景
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // TODO: 实现测试
        })
    }
}

// Test{{USECASE}}_Steps 测试步骤顺序
func Test{{USECASE}}_Steps(t *testing.T) {
    // TODO: 验证 usecases.yaml 中定义的 steps 按顺序执行
    
    // Step 1: TODO
    // Step 2: TODO
    // Step 3: TODO
}

// Test{{USECASE}}_OnFail 测试失败策略
func Test{{USECASE}}_OnFail(t *testing.T) {
    // TODO: 验证 usecases.yaml 中定义的 on_fail 策略
}
EOF

    # 替换占位符
    sed -i '' "s/{{DOMAIN}}/${DOMAIN}/g" "$test_file"
    sed -i '' "s/{{USECASE}}/${USECASE}/g" "$test_file"
    
    info "Test generated: $test_file"
}

# 更新 README.md
update_readme() {
    local domain_path="${DOMAINS_DIR}/${DOMAIN}"
    local readme_file="${domain_path}/README.md"
    
    if [ ! -f "$readme_file" ]; then
        warn "README.md not found, skipping update"
        return
    fi
    
    # TODO: 添加用例到 README.md 的用例列表
    info "Please manually update README.md to add the new usecase"
}

# 打印生成摘要
print_summary() {
    echo ""
    info "=== Code Generation Summary ==="
    info "Domain: ${DOMAIN}"
    info "Usecase: ${USECASE}"
    echo ""
    info "Generated files:"
    echo "  • handlers/$(echo ${USECASE} | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//').handler.go"
    echo "  • tests/$(echo ${USECASE} | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//').test.go"
    echo ""
    info "Next steps:"
    echo "  1. 完善 handler 中的 TODO 项"
    echo "  2. 完善 test 中的测试用例"
    echo "  3. 更新 README.md 添加用例说明"
    echo "  4. 运行测试: go test ./domains/${DOMAIN}/tests/..."
    echo ""
}

# 主函数
main() {
    parse_args "$@"
    check_domain_exists
    
    if [ "$LIST_MODE" = true ]; then
        list_usecases
        exit 0
    fi
    
    info "Generating code for usecase '${USECASE}' in domain '${DOMAIN}'..."
    
    read_domain_knowledge
    extract_usecase_definition
    generate_handler
    generate_test
    update_readme
    print_summary
    
    info "Code generation completed! ✨"
}

# 执行主函数
main "$@"

