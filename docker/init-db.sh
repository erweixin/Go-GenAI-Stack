#!/bin/bash
#================================================
# Docker 数据库初始化脚本
#================================================
# 功能：
# 1. 等待 PostgreSQL 就绪
# 2. 应用 Schema 迁移
# 3. 加载种子数据
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

error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
echo "================================================"
echo "  🚀 数据库初始化"
echo "================================================"
echo ""

# 数据库配置（从环境变量读取）
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-genai}
DB_PASSWORD=${DB_PASSWORD:-genai_password}
DB_NAME=${DB_NAME:-go_genai_stack}

info "等待 PostgreSQL 就绪..."
info "连接信息: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# 等待数据库就绪（最多等待 60 秒）
MAX_RETRIES=60
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
        success "PostgreSQL 已就绪"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        error "等待 PostgreSQL 超时"
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

echo ""

# 检查数据库是否存在
info "检查数据库..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    info "创建数据库 $DB_NAME..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    success "数据库创建完成"
else
    info "数据库已存在"
fi

# 应用 Schema
info "应用 Schema..."
if [ -f "/schema/schema.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /schema/schema.sql || {
        error "应用 Schema 失败"
        exit 1
    }
    success "Schema 应用完成"
else
    error "Schema 文件不存在: /schema/schema.sql"
    exit 1
fi

# 检查是否需要加载种子数据
SKIP_SEED=${SKIP_SEED:-false}

if [ "$SKIP_SEED" = "true" ]; then
    info "跳过种子数据加载（SKIP_SEED=true）"
else
    # 加载种子数据
    info "加载种子数据..."
    
    if [ -d "/seed" ]; then
        SEED_FILES=$(find /seed -name "*.sql" | sort)
        
        if [ -z "$SEED_FILES" ]; then
            info "没有找到种子数据文件"
        else
            echo "$SEED_FILES" | while read -r file; do
                info "加载 $(basename $file)..."
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" || {
                    error "加载失败: $file"
                    exit 1
                }
            done
            success "种子数据加载完成"
        fi
    else
        info "种子数据目录不存在"
    fi
fi

echo ""
success "数据库初始化完成！"
echo ""

# 输出统计信息
info "数据统计："
TASK_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tasks;" 2>/dev/null || echo "0")
echo "  - 任务数量: $TASK_COUNT"

echo ""

