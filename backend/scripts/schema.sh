#!/bin/bash

# schema.sh
# Atlas Schema 管理脚本
#
# 使用方式：
#   ./scripts/schema.sh diff <name>    - 生成迁移（对比差异）
#   ./scripts/schema.sh apply          - 应用迁移
#   ./scripts/schema.sh status         - 查看迁移状态
#   ./scripts/schema.sh inspect        - 检查当前数据库 schema
#   ./scripts/schema.sh lint           - 检查 schema 质量
#   ./scripts/schema.sh validate       - 验证 schema
#   ./scripts/schema.sh clean          - 清理开发数据库

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SCHEMA_DIR="${BACKEND_DIR}/infrastructure/database/schema"
MIGRATIONS_DIR="${BACKEND_DIR}/migrations/atlas"
SEED_DIR="${BACKEND_DIR}/migrations/seed"

# 环境变量
ENV="${ATLAS_ENV:-local}"

# 从环境变量构建 DATABASE_URL
# 支持两种格式：
#   1. APP_DATABASE_* (Go 后端格式)
#   2. POSTGRES_* (Docker Compose 格式)
DB_HOST="${APP_DATABASE_HOST:-${POSTGRES_HOST:-localhost}}"
DB_PORT="${APP_DATABASE_PORT:-${POSTGRES_PORT:-5432}}"
DB_USER="${APP_DATABASE_USER:-${POSTGRES_USER:-genai}}"
DB_PASSWORD="${APP_DATABASE_PASSWORD:-${POSTGRES_PASSWORD:-genai_password}}"
DB_NAME="${APP_DATABASE_DATABASE:-${POSTGRES_DB:-go_genai_stack}}"
DB_SSL_MODE="${APP_DATABASE_SSL_MODE:-disable}"

DATABASE_URL="${DATABASE_URL:-postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=${DB_SSL_MODE}}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查 Atlas 是否安装
check_atlas_installed() {
    if ! command -v atlas &> /dev/null; then
        error "Atlas is not installed!"
        info "Install it:"
        info "  macOS:  brew install ariga/tap/atlas"
        info "  Linux:  curl -sSf https://atlasgo.sh | sh"
        info "  Go:     go install ariga.io/atlas/cmd/atlas@latest"
        info ""
        info "Documentation: https://atlasgo.io/getting-started"
        exit 1
    fi
    
    local version=$(atlas version | head -n 1)
    debug "Using Atlas: $version"
}

# 检查数据库连接
check_db_connection() {
    info "Checking database connection..."
    
    if ! psql "${DATABASE_URL}" -c "SELECT 1" > /dev/null 2>&1; then
        error "Cannot connect to database!"
        error "URL: ${DATABASE_URL}"
        exit 1
    fi
    
    info "Database connection OK"
}

# 生成迁移（对比差异）
schema_diff() {
    local name=$1
    
    if [ -z "$name" ]; then
        error "Migration name is required!"
        error "Usage: $0 diff <name>"
        exit 1
    fi
    
    info "Generating migration: $name"
    
    cd "${BACKEND_DIR}"
    
    atlas migrate diff "$name" \
        --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
        --env "$ENV" \
        --to "file://${SCHEMA_DIR}" \
        --dev-url "docker://postgres/15/dev?search_path=public"
    
    info "Migration generated: ${MIGRATIONS_DIR}/"
    info "Review the migration files before applying!"
}

# 应用迁移
schema_apply() {
    info "Applying migrations to database..."
    
    cd "${BACKEND_DIR}"
    
    # 显示将要应用的迁移
    atlas migrate status \
        --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
        --env "$ENV" \
        --url "$DATABASE_URL"
    
    echo ""
    read -p "Apply these migrations? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        atlas migrate apply \
            --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
            --env "$ENV" \
            --url "$DATABASE_URL"
        
        info "Migrations applied successfully!"
        
        # 应用种子数据（如果存在且是首次）
        apply_seed_data
    else
        info "Migration cancelled"
    fi
}

# 应用种子数据
apply_seed_data() {
    if [ -d "$SEED_DIR" ] && [ "$(ls -A $SEED_DIR 2>/dev/null)" ]; then
        echo ""
        read -p "Apply seed data? (y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Applying seed data..."
            
            for seed_file in "$SEED_DIR"/*.sql; do
                if [ -f "$seed_file" ]; then
                    info "Applying: $(basename $seed_file)"
                    psql "$DATABASE_URL" -f "$seed_file"
                fi
            done
            
            info "Seed data applied!"
        fi
    fi
}

# 查看迁移状态
schema_status() {
    info "Migration status:"
    
    cd "${BACKEND_DIR}"
    
    atlas migrate status \
        --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
        --env "$ENV" \
        --url "$DATABASE_URL"
}

# 检查数据库 schema
schema_inspect() {
    info "Inspecting database schema..."
    
    cd "${BACKEND_DIR}"
    
    atlas schema inspect \
        --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
        --env "$ENV" \
        --url "$DATABASE_URL" \
        --format "{{ sql . }}"
}

# Schema Linting
schema_lint() {
    info "Linting schema..."
    
    cd "${BACKEND_DIR}"
    
    atlas migrate lint \
        --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
        --env "$ENV" \
        --dev-url "docker://postgres/15/dev?search_path=public" \
        --latest 1
    
    info "Lint completed!"
}

# 验证 schema
schema_validate() {
    info "Validating schema..."
    
    cd "${BACKEND_DIR}"
    
    atlas migrate validate \
        --config "file://${MIGRATIONS_DIR}/atlas.hcl" \
        --env "$ENV" \
        --dev-url "docker://postgres/15/dev?search_path=public"
    
    info "Schema is valid!"
}

# 清理开发数据库
schema_clean() {
    warn "This will DROP ALL TABLES in the database!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Dropping all tables..."
        
        # 生成删除所有表的 SQL
        psql "$DATABASE_URL" << 'EOF'
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all materialized views
    FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(r.matviewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;
EOF
        
        info "Database cleaned!"
        info "Run './scripts/schema.sh apply' to recreate tables"
    else
        info "Clean cancelled"
    fi
}

# 显示帮助
show_help() {
    cat << EOF
${GREEN}Atlas Schema 管理工具${NC}

使用方式:
  $0 <command> [options]

命令:
  diff <name>     生成迁移（对比 schema 差异）
  apply           应用迁移到数据库
  status          查看迁移状态
  inspect         检查当前数据库 schema
  lint            检查 schema 质量
  validate        验证 schema 文件
  clean           清理开发数据库（谨慎使用）

环境变量:
  ATLAS_ENV                Atlas 环境 (默认: local)
  DATABASE_URL             数据库连接字符串（可选）
  APP_DATABASE_HOST        数据库主机 (默认: localhost)
  APP_DATABASE_PORT        数据库端口 (默认: 5432)
  APP_DATABASE_USER        数据库用户 (默认: genai)
  APP_DATABASE_PASSWORD    数据库密码 (默认: genai_password)
  APP_DATABASE_DATABASE    数据库名 (默认: go_genai_stack)
  APP_DATABASE_SSL_MODE    SSL 模式 (默认: disable)

示例:
  # 使用默认配置
  $0 apply
  
  # 使用环境变量
  source docker/.env && $0 apply
  
  # 修改 schema 后生成迁移
  $0 diff add_user_email
  
  # 查看状态
  $0 status

更多信息: https://atlasgo.io/

EOF
}

# 主函数
main() {
    local command=${1:-help}
    
    case "$command" in
        diff)
            check_atlas_installed
            schema_diff "$2"
            ;;
        apply)
            check_atlas_installed
            check_db_connection
            schema_apply
            ;;
        status)
            check_atlas_installed
            check_db_connection
            schema_status
            ;;
        inspect)
            check_atlas_installed
            check_db_connection
            schema_inspect
            ;;
        lint)
            check_atlas_installed
            schema_lint
            ;;
        validate)
            check_atlas_installed
            schema_validate
            ;;
        clean)
            check_db_connection
            schema_clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"

