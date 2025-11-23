#!/bin/bash

#================================================
# 种子数据加载脚本
#================================================
# 功能：
# - 加载 migrations/seed/*.sql 中的种子数据
# - 可选：清空现有数据
#================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 切换到 backend 目录
cd "$(dirname "$0")/.."

# 检查 psql
if ! command -v psql &> /dev/null; then
    error "psql 未安装，无法加载种子数据"
    exit 1
fi

# 读取数据库配置（从环境变量或使用默认值）
# 支持两种格式：APP_DATABASE_* (Go 后端格式) 和 POSTGRES_* (Docker Compose 格式)
DB_HOST=${APP_DATABASE_HOST:-${POSTGRES_HOST:-localhost}}
DB_PORT=${APP_DATABASE_PORT:-${POSTGRES_PORT:-5432}}
DB_USER=${APP_DATABASE_USER:-${POSTGRES_USER:-genai}}
DB_PASSWORD=${APP_DATABASE_PASSWORD:-${POSTGRES_PASSWORD:-genai_password}}
DB_NAME=${APP_DATABASE_DATABASE:-${POSTGRES_DB:-go_genai_stack}}

echo ""
echo "================================================"
echo "  📦 种子数据加载脚本"
echo "================================================"
echo ""
info "数据库配置："
echo "  - Host: $DB_HOST"
echo "  - Port: $DB_PORT"
echo "  - User: $DB_USER"
echo "  - Database: $DB_NAME"
echo ""

# 检查是否需要清空数据
if [ "$1" = "--clear" ]; then
    warning "清空现有数据..."
    
    # 清空 tasks 和 task_tags 表
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "TRUNCATE TABLE tasks, task_tags CASCADE;" || {
        error "清空数据失败"
        exit 1
    }
    
    success "现有数据已清空"
    echo ""
fi

# 加载种子数据
SEED_DIR="migrations/seed"

if [ ! -d "$SEED_DIR" ]; then
    error "种子数据目录不存在: $SEED_DIR"
    exit 1
fi

# 查找所有 .sql 文件
SEED_FILES=$(find "$SEED_DIR" -name "*.sql" | sort)

if [ -z "$SEED_FILES" ]; then
    warning "没有找到种子数据文件"
    exit 0
fi

info "加载种子数据文件："
echo "$SEED_FILES" | while read -r file; do
    echo "  - $file"
done
echo ""

# 逐个加载文件
echo "$SEED_FILES" | while read -r file; do
    info "加载 $file..."
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" || {
        error "加载失败: $file"
        exit 1
    }
    
    success "加载完成: $file"
done

echo ""
success "所有种子数据加载完成！"
echo ""
info "提示："
echo "  - 查看数据: psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT * FROM tasks LIMIT 10;'"
echo "  - 清空并重新加载: ./scripts/seed.sh --clear"
echo ""

