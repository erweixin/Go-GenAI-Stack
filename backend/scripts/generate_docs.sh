#!/bin/bash

# generate_docs.sh
# 自动生成领域文档
#
# 扫描所有领域，生成：
# - 领域概览
# - 用例列表
# - API 文档
# - 架构图
#
# 使用方式：
#   ./scripts/generate_docs.sh         # 生成所有文档
#   ./scripts/generate_docs.sh chat    # 只生成 chat 领域文档

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOMAINS_DIR="${BACKEND_DIR}/domains"
DOCS_DIR="${BACKEND_DIR}/../docs/generated"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 创建文档目录
mkdir -p "${DOCS_DIR}"

# 生成领域概览文档
generate_domain_overview() {
    local domain=$1
    local domain_path="${DOMAINS_DIR}/${domain}"
    local output_file="${DOCS_DIR}/${domain}_overview.md"
    
    info "Generating overview for domain '${domain}'..."
    
    cat > "$output_file" << EOF
# ${domain^} Domain Overview

> Generated: $(date '+%Y-%m-%d %H:%M:%S')

## 领域简介

EOF

    # 添加 README 内容
    if [ -f "${domain_path}/README.md" ]; then
        cat "${domain_path}/README.md" >> "$output_file"
    fi
    
    cat >> "$output_file" << EOF

## 术语表

EOF

    # 添加 Glossary
    if [ -f "${domain_path}/glossary.md" ]; then
        tail -n +2 "${domain_path}/glossary.md" >> "$output_file"
    fi
    
    cat >> "$output_file" << EOF

## 业务规则

EOF

    # 添加 Rules
    if [ -f "${domain_path}/rules.md" ]; then
        tail -n +2 "${domain_path}/rules.md" >> "$output_file"
    fi
    
    cat >> "$output_file" << EOF

## 领域事件

EOF

    # 添加 Events
    if [ -f "${domain_path}/events.md" ]; then
        tail -n +2 "${domain_path}/events.md" >> "$output_file"
    fi
    
    info "Generated: $output_file"
}

# 生成用例列表文档
generate_usecases_doc() {
    local domain=$1
    local domain_path="${DOMAINS_DIR}/${domain}"
    local output_file="${DOCS_DIR}/${domain}_usecases.md"
    
    info "Generating usecases documentation for '${domain}'..."
    
    cat > "$output_file" << EOF
# ${domain^} Domain Use Cases

> Generated: $(date '+%Y-%m-%d %H:%M:%S')

## 用例列表

EOF

    # 解析 usecases.yaml
    if [ -f "${domain_path}/usecases.yaml" ]; then
        if command -v yq &> /dev/null; then
            # 使用 yq 解析
            yq eval '.usecases | to_entries | .[] | "### " + .key + "\n\n" + .value.description + "\n"' "${domain_path}/usecases.yaml" >> "$output_file"
        else
            # 简单解析
            cat "${domain_path}/usecases.yaml" >> "$output_file"
        fi
    fi
    
    info "Generated: $output_file"
}

# 生成 API 文档
generate_api_doc() {
    local domain=$1
    local domain_path="${DOMAINS_DIR}/${domain}"
    local output_file="${DOCS_DIR}/${domain}_api.md"
    
    info "Generating API documentation for '${domain}'..."
    
    cat > "$output_file" << EOF
# ${domain^} Domain API Reference

> Generated: $(date '+%Y-%m-%d %H:%M:%S')

## HTTP Endpoints

EOF

    # 扫描 HTTP 路由文件
    if [ -f "${domain_path}/http/router.go" ]; then
        echo "Scanning routes from: ${domain_path}/http/router.go" >> "$output_file"
        echo "" >> "$output_file"
        grep -E "(GET|POST|PUT|DELETE|PATCH)" "${domain_path}/http/router.go" | sed 's/^/- /' >> "$output_file" || true
    fi
    
    cat >> "$output_file" << EOF

## DTO Structures

EOF

    # 扫描 DTO 文件
    if [ -d "${domain_path}/http/dto" ]; then
        for dto_file in "${domain_path}/http/dto"/*.go; do
            if [ -f "$dto_file" ]; then
                echo "### $(basename $dto_file .go)" >> "$output_file"
                echo "" >> "$output_file"
                echo '```go' >> "$output_file"
                grep -A 20 "^type.*struct" "$dto_file" | head -n 21 >> "$output_file" || true
                echo '```' >> "$output_file"
                echo "" >> "$output_file"
            fi
        done
    fi
    
    info "Generated: $output_file"
}

# 生成架构图
generate_architecture_diagram() {
    info "Generating architecture diagram..."
    
    local output_file="${DOCS_DIR}/architecture.md"
    
    cat > "$output_file" << EOF
# Backend Architecture

> Generated: $(date '+%Y-%m-%d %H:%M:%S')

## Domains

EOF

    # 列出所有领域
    for domain_dir in "${DOMAINS_DIR}"/*; do
        if [ -d "$domain_dir" ]; then
            domain=$(basename "$domain_dir")
            if [ "$domain" != "shared" ]; then
                echo "- **${domain}**: $(head -n 1 ${domain_dir}/README.md 2>/dev/null || echo 'No description')" >> "$output_file"
            fi
        fi
    done
    
    cat >> "$output_file" << EOF

## Directory Structure

\`\`\`
EOF

    tree -L 3 -I 'node_modules|*.test.go' "${BACKEND_DIR}" >> "$output_file" 2>/dev/null || echo "Install 'tree' command for better visualization" >> "$output_file"
    
    cat >> "$output_file" << EOF
\`\`\`

## Dependencies

EOF

    # 扫描依赖关系
    info "Scanning dependencies..."
    find "${DOMAINS_DIR}" -name "*.go" -type f | xargs grep -h "^import" | sort | uniq >> "$output_file" || true
    
    info "Generated: $output_file"
}

# 生成索引文件
generate_index() {
    local output_file="${DOCS_DIR}/README.md"
    
    info "Generating documentation index..."
    
    cat > "$output_file" << EOF
# Backend Documentation

> Auto-generated: $(date '+%Y-%m-%d %H:%M:%S')

## 📚 Documentation

### Architecture
- [Architecture Overview](architecture.md)

### Domains

EOF

    # 列出所有领域文档
    for domain_dir in "${DOMAINS_DIR}"/*; do
        if [ -d "$domain_dir" ]; then
            domain=$(basename "$domain_dir")
            if [ "$domain" != "shared" ]; then
                cat >> "$output_file" << EOF
#### ${domain^}
- [Overview](${domain}_overview.md)
- [Use Cases](${domain}_usecases.md)
- [API Reference](${domain}_api.md)

EOF
            fi
        fi
    done
    
    info "Generated: $output_file"
}

# 验证领域结构
validate_domain_structure() {
    local domain=$1
    local domain_path="${DOMAINS_DIR}/${domain}"
    
    local required_files=("README.md" "glossary.md" "rules.md" "events.md" "usecases.yaml" "ai-metadata.json")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${domain_path}/${file}" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        warn "Domain '${domain}' is missing files:"
        printf '  %s\n' "${missing_files[@]}"
    fi
}

# 主函数
main() {
    local target_domain=$1
    
    info "Starting documentation generation..."
    
    if [ -n "$target_domain" ]; then
        # 只生成指定领域的文档
        if [ ! -d "${DOMAINS_DIR}/${target_domain}" ]; then
            error "Domain '${target_domain}' does not exist!"
            exit 1
        fi
        
        validate_domain_structure "$target_domain"
        generate_domain_overview "$target_domain"
        generate_usecases_doc "$target_domain"
        generate_api_doc "$target_domain"
    else
        # 生成所有领域的文档
        for domain_dir in "${DOMAINS_DIR}"/*; do
            if [ -d "$domain_dir" ]; then
                domain=$(basename "$domain_dir")
                if [ "$domain" != "shared" ]; then
                    validate_domain_structure "$domain"
                    generate_domain_overview "$domain"
                    generate_usecases_doc "$domain"
                    generate_api_doc "$domain"
                fi
            fi
        done
        
        # 生成整体架构文档
        generate_architecture_diagram
        generate_index
    fi
    
    info "Documentation generation completed! 📚"
    info "Output directory: ${DOCS_DIR}"
}

main "$@"

